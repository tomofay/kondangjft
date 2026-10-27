import { NextResponse } from 'next/server';
import { getStore, calculateVoucherDiscount } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User, TryoutPackage, Transaction, Voucher } from '@/types';
import { generateDokuSignature, getDokuBaseUrl } from '@/lib/doku';
import { generateDynamicQris } from '@/lib/qris';

export async function POST(request: Request) {
  try {
    await initDatabase();
    const { userId, packageId, channel = 'BRI', voucherCode } = await request.json();

    if (!userId || !packageId) {
      return NextResponse.json(
        { success: false, message: 'User ID dan Package ID wajib diisi.' },
        { status: 400 }
      );
    }

    const store = getStore();
    let user = store.users.find((u: User) => u.id === userId);

    if (!user) {
      try {
        const [rows] = await pool.query<any[]>(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );
        if (rows && rows.length > 0) {
          const dbU = rows[0];
          user = {
            id: dbU.id,
            name: dbU.name,
            email: dbU.email,
            role: dbU.role,
            subscriptionExpiresAt: dbU.subscriptionExpiresAt,
            credits: dbU.credits,
            registrationNumber: dbU.registrationNumber,
            nationality: dbU.nationality,
            dateOfBirth: dbU.dateOfBirth,
            sex: dbU.sex,
            activeSessionId: dbU.activeSessionId,
            lastActiveAt: dbU.lastActiveAt
          };
          store.users.push(user);
        }
      } catch (dbErr) {
        console.warn('MySQL lookup user error:', dbErr);
      }
    }

    const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);

    if (!user || !pkg) {
      return NextResponse.json(
        { success: false, message: 'User atau Paket tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Check if this package is first-time only and user has already purchased a package
    if (pkg.firstTimeOnly) {
      let hasPreviousPaid = store.transactions.some(
        (t) => t.userId === userId && t.status === 'PAID'
      );
      if (!hasPreviousPaid) {
        try {
          const [paidRows] = await pool.query<any[]>(
            'SELECT id FROM transactions WHERE userId = ? AND status = "PAID" LIMIT 1',
            [userId]
          );
          if (paidRows && paidRows.length > 0) {
            hasPreviousPaid = true;
          }
        } catch {}
      }

      if (hasPreviousPaid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Paket Spesial Rp 100 ini hanya berlaku 1 kali untuk pengguna baru.'
          },
          { status: 400 }
        );
      }
    }

    // Voucher validation & discount calculation
    let appliedVoucher: Voucher | null = null;
    let originalAmount = pkg.price;
    let discountAmount = 0;
    let finalAmount = pkg.price;
    let voucherCodeUsed: string | undefined = undefined;

    if (voucherCode && typeof voucherCode === 'string' && voucherCode.trim()) {
      const cleanCode = voucherCode.trim().toUpperCase();
      try {
        const [vRows] = await pool.query<any[]>('SELECT * FROM vouchers WHERE UPPER(code) = ? LIMIT 1', [cleanCode]);
        if (vRows && vRows.length > 0) {
          const r = vRows[0];
          let validPkgs: string[] = [];
          if (r.validPackages) {
            try {
              validPkgs = typeof r.validPackages === 'string' ? JSON.parse(r.validPackages) : r.validPackages;
            } catch {}
          }
          appliedVoucher = {
            id: r.id,
            code: r.code,
            discountType: r.discountType,
            discountValue: Number(r.discountValue),
            maxDiscountAmount: r.maxDiscountAmount !== null ? Number(r.maxDiscountAmount) : null,
            minPurchaseAmount: Number(r.minPurchaseAmount || 0),
            usageLimit: r.usageLimit !== null ? Number(r.usageLimit) : null,
            usedCount: Number(r.usedCount || 0),
            validPackages: validPkgs,
            startDate: r.startDate,
            expiredAt: r.expiredAt,
            isActive: Boolean(r.isActive),
            description: r.description
          };
        }
      } catch {}

      if (!appliedVoucher) {
        appliedVoucher = store.vouchers.find((v: Voucher) => v.code.toUpperCase() === cleanCode) || null;
      }

      if (appliedVoucher) {
        const discountRes = calculateVoucherDiscount(appliedVoucher, pkg.price, pkg.id);
        if (discountRes.isValid) {
          discountAmount = discountRes.discountAmount;
          finalAmount = discountRes.finalPrice;
          voucherCodeUsed = appliedVoucher.code;
        }
      }
    }

    const clientId = process.env.DOKU_CLIENT_ID || 'BRN-0217-1792292490991';
    const secretKey = process.env.DOKU_SECRET_KEY || 'SK-exfHwYOtzTIzZi16bxSz';
    const baseUrl = getDokuBaseUrl();

    // Unique invoice number & reference
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const merchantRef = String(Math.floor(100000000 + Math.random() * 900000000)); // 9 digits

    // CASE 100% DISCOUNT: Free activation directly without payment gateway
    if (finalAmount === 0 && voucherCodeUsed) {
      const durationMs = pkg.durationHours
        ? pkg.durationHours * 60 * 60 * 1000
        : (pkg.durationDays || 7) * 24 * 60 * 60 * 1000;

      const baseTime = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > Date.now()
        ? new Date(user.subscriptionExpiresAt).getTime()
        : Date.now();

      const newExpiry = new Date(baseTime + durationMs).toISOString();
      user.subscriptionExpiresAt = newExpiry;

      try {
        await pool.query('UPDATE users SET subscriptionExpiresAt = ? WHERE id = ?', [newExpiry, user.id]);
      } catch {}

      if (appliedVoucher) {
        appliedVoucher.usedCount += 1;
        try {
          await pool.query('UPDATE vouchers SET usedCount = usedCount + 1 WHERE id = ?', [appliedVoucher.id]);
        } catch {}
      }

      const freeTx: Transaction = {
        id: invoiceNumber,
        userId: user.id,
        userName: user.name,
        packageId: pkg.id,
        packageName: pkg.name,
        amount: 0,
        originalAmount,
        discountAmount,
        voucherCode: voucherCodeUsed,
        paymentMethod: `Voucher 100% (${voucherCodeUsed})`,
        paymentCode: voucherCodeUsed,
        status: 'PAID',
        createdAt: new Date().toISOString()
      };
      store.transactions.unshift(freeTx);

      try {
        await pool.query(
          `INSERT INTO transactions (id, userId, userName, packageId, packageName, amount, voucherCode, discountAmount, originalAmount, paymentMethod, paymentCode, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?)`,
          [
            freeTx.id,
            freeTx.userId,
            freeTx.userName,
            freeTx.packageId,
            freeTx.packageName,
            freeTx.amount,
            freeTx.voucherCode,
            freeTx.discountAmount,
            freeTx.originalAmount,
            freeTx.paymentMethod,
            freeTx.paymentCode,
            freeTx.createdAt
          ]
        );
      } catch (err) {
        console.warn('MySQL insert free tx warning:', err);
      }

      const durationLabel = pkg.durationHours ? `${pkg.durationHours} Jam` : `${pkg.durationDays || 7} Hari`;
      return NextResponse.json({
        success: true,
        isFree: true,
        invoiceNumber,
        amount: 0,
        originalAmount,
        discountAmount,
        voucherCode: voucherCodeUsed,
        subscriptionExpiresAt: newExpiry,
        message: `Selamat! Voucher ${voucherCodeUsed} 100% berhasil digunakan. Akses Tryout ${durationLabel} aktif gratis!`
      });
    }

    // Dynamic base URL for hosting compatibility
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto') || 'https';
    const dynamicOrigin = hostHeader ? `${protoHeader}://${hostHeader}` : null;
    const baseUrlWeb = dynamicOrigin || process.env.NEXT_PUBLIC_BASE_URL || 'https://kondangsensei.my.id';

    const requestTarget = '/checkout/v1/payment';
    const paymentChannelName = 'QRIS Instant';
    const requestBody = {
      order: {
        invoice_number: invoiceNumber,
        amount: finalAmount,
        callback_url: baseUrlWeb,
        failed_url: baseUrlWeb,
        auto_redirect: true
      },
      payment: {
        payment_due_date: 60,
        payment_method_types: ['QRIS']
      },
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: '6281234567890'
      }
    };

    const rawBody = JSON.stringify(requestBody);
    const signature = generateDokuSignature(
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      rawBody,
      secretKey
    );

    const isProd = process.env.DOKU_IS_PRODUCTION === 'true';
    const isSandbox = !isProd;

    let dokuResponse: Response | null = null;
    let dokuData: any = null;

    try {
      // Call DOKU API (sandbox or production)
      dokuResponse = await fetch(`${baseUrl}${requestTarget}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': clientId,
          'Request-Id': requestId,
          'Request-Timestamp': requestTimestamp,
          Signature: signature
        },
        body: rawBody
      });
      dokuData = await dokuResponse.json();
    } catch (fetchErr) {
      console.warn('DOKU Fetch error:', fetchErr);
    }

    let checkoutPaymentUrl = dokuData?.response?.payment?.url || dokuData?.payment?.url || dokuData?.url;
    let qrString = dokuData?.qr_content || dokuData?.qr_string || dokuData?.payment?.qr_content;
    const tokenId = dokuData?.response?.payment?.token_id;

    // Fetch official direct DOKU QRIS (ASPI/EMVCo compliant) so users can scan directly in GoPay/m-Banking
    if (tokenId) {
      try {
        const checkoutHost = isProd ? 'https://checkout.doku.com' : 'https://checkout-sandbox.doku.com';
        const directQrRes = await fetch(`${checkoutHost}/checkout/v1/payment/${tokenId}/generate-qris`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': `${checkoutHost}/checkout-link-v2/${tokenId}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify({ token_id: tokenId })
        });
        if (directQrRes.ok) {
          const directQrJson = await directQrRes.json();
          if (directQrJson?.qr_code) {
            qrString = directQrJson.qr_code;
          }
        }
      } catch (directQrErr) {
        console.warn('Direct DOKU QRIS generation warning:', directQrErr);
      }
    }

    let howToPayUrl = checkoutPaymentUrl || 'https://kondangsensei.my.id';
    const hasLiveCode = Boolean(qrString || (dokuResponse?.ok && checkoutPaymentUrl));

    // Ensure valid ASPI EMVCo dynamic QR string
    if (!qrString) {
      const label = isSandbox ? 'KONDANG SENSEI (SANDBOX)' : 'Kondang Sensei Education';
      qrString = generateDynamicQris(finalAmount, invoiceNumber, label);
    }

    if (isSandbox && !checkoutPaymentUrl) {
      howToPayUrl = 'https://sandbox.doku.com/qris-simulator/';
    }

    // Normalize expired date to valid ISO format (DOKU returns 'YYYYMMDDHHmmss' format e.g. '20261018123529')
    const rawExpired = dokuData?.virtual_account_info?.expired_date || dokuData?.online_to_offline_info?.expired_date;
    let expiredAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    if (rawExpired && typeof rawExpired === 'string') {
      if (/^\d{14}$/.test(rawExpired)) {
        const y = rawExpired.substring(0, 4);
        const m = rawExpired.substring(4, 6);
        const d = rawExpired.substring(6, 8);
        const h = rawExpired.substring(8, 10);
        const min = rawExpired.substring(10, 12);
        const s = rawExpired.substring(12, 14);
        // Interpret as GMT+7 (WIB)
        const dObj = new Date(`${y}-${m}-${d}T${h}:${min}:${s}+07:00`);
        if (!isNaN(dObj.getTime())) {
          expiredAt = dObj.toISOString();
        }
      } else {
        const dObj = new Date(rawExpired);
        if (!isNaN(dObj.getTime())) {
          expiredAt = dObj.toISOString();
        }
      }
    }

    if (hasLiveCode || isSandbox || qrString) {
      const code = qrString || 'DOKU-QRIS';
      const sandboxLabel = isSandbox ? ' [SANDBOX]' : '';
      const fullMethod = `QRIS Instant${sandboxLabel}`;

      // Save Transaction record with PENDING status, paymentCode, and 1 hour expiry
      const newTx: Transaction = {
        id: invoiceNumber,
        userId: user.id,
        userName: user.name,
        packageId: pkg.id,
        packageName: pkg.name,
        amount: finalAmount,
        originalAmount,
        discountAmount,
        voucherCode: voucherCodeUsed,
        paymentMethod: fullMethod,
        paymentCode: code,
        howToPayUrl,
        expiredAt,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      store.transactions.unshift(newTx);

      // Save to MySQL
      try {
        await pool.query(
          `INSERT INTO transactions 
           (id, userId, userName, packageId, packageName, amount, voucherCode, discountAmount, originalAmount, paymentMethod, paymentCode, howToPayUrl, expiredAt, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             amount = VALUES(amount),
             voucherCode = VALUES(voucherCode),
             discountAmount = VALUES(discountAmount),
             originalAmount = VALUES(originalAmount),
             paymentMethod = VALUES(paymentMethod),
             paymentCode = VALUES(paymentCode),
             howToPayUrl = VALUES(howToPayUrl),
             expiredAt = VALUES(expiredAt),
             status = VALUES(status)`,
          [
            newTx.id,
            newTx.userId,
            newTx.userName,
            newTx.packageId,
            newTx.packageName,
            newTx.amount,
            newTx.voucherCode || null,
            newTx.discountAmount || 0,
            newTx.originalAmount || null,
            newTx.paymentMethod,
            newTx.paymentCode,
            newTx.howToPayUrl,
            newTx.expiredAt,
            newTx.status,
            newTx.createdAt
          ]
        );
      } catch (dbErr) {
        console.warn('MySQL pending tx insert warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        channel,
        channelName: paymentChannelName,
        paymentCode: code,
        howToPayUrl,
        expiredDate: expiredAt,
        amount: finalAmount,
        originalAmount,
        discountAmount,
        voucherCode: voucherCodeUsed,
        invoiceNumber,
        isSandbox,
        message: `Nomor Pembayaran DOKU (${paymentChannelName}${sandboxLabel}) berhasil diterbitkan.`
      });
    }

    console.warn('DOKU API Response Error:', dokuData);
    return NextResponse.json({
      success: false,
      message: dokuData?.error?.message || (Array.isArray(dokuData?.message) ? dokuData?.message.join(', ') : dokuData?.message) || 'Gagal membuat nomor pembayaran DOKU.',
      details: dokuData
    }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

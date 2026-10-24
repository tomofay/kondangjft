import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User, TryoutPackage, Transaction } from '@/types';
import { generateDokuSignature, getDokuBaseUrl } from '@/lib/doku';
import { generateDynamicQris } from '@/lib/qris';

export async function POST(request: Request) {
  try {
    await initDatabase();
    const { userId, packageId, channel = 'BRI' } = await request.json();

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

    const clientId = process.env.DOKU_CLIENT_ID || 'BRN-0217-1792292490991';
    const secretKey = process.env.DOKU_SECRET_KEY || 'SK-exfHwYOtzTIzZi16bxSz';
    const baseUrl = getDokuBaseUrl();

    // Unique invoice number & reference
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const merchantRef = String(Math.floor(100000000 + Math.random() * 900000000)); // 9 digits

    let requestTarget = '/bri-virtual-account/v2/payment-code';
    let requestBody: any = {};
    let paymentChannelName = 'BRI Virtual Account';

    // Dynamic base URL for hosting compatibility
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto') || 'https';
    const dynamicOrigin = hostHeader ? `${protoHeader}://${hostHeader}` : null;
    const baseUrlWeb = dynamicOrigin || process.env.NEXT_PUBLIC_BASE_URL || 'https://kondangsensei.my.id';

    // Route based on active channel verified in DOKU Back Office
    switch (channel) {
      case 'BNI':
        requestTarget = '/bni-virtual-account/v2/payment-code';
        paymentChannelName = 'BNI Virtual Account';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          virtual_account_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT',
            merchant_unique_reference: merchantRef
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'BSI':
        requestTarget = '/bsm-virtual-account/v2/payment-code';
        paymentChannelName = 'BSI Virtual Account';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          virtual_account_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT',
            merchant_unique_reference: merchantRef
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'CIMB':
        requestTarget = '/cimb-virtual-account/v2/payment-code';
        paymentChannelName = 'CIMB Niaga Virtual Account';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          virtual_account_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT',
            merchant_unique_reference: merchantRef
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'DANAMON':
        requestTarget = '/danamon-virtual-account/v2/payment-code';
        paymentChannelName = 'Danamon Virtual Account';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          virtual_account_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT',
            merchant_unique_reference: merchantRef
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'MAYBANK':
        requestTarget = '/maybank-virtual-account/v2/payment-code';
        paymentChannelName = 'Maybank Virtual Account';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          virtual_account_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT',
            merchant_unique_reference: merchantRef
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'DOKU_EWALLET': {
        requestTarget = '/dokuwallet-emoney/v1/payment';
        paymentChannelName = 'DOKU e-Wallet';
        requestBody = {
          order: {
            invoice_number: invoiceNumber,
            amount: pkg.price,
            line_items: [
              {
                name: pkg.name,
                price: pkg.price,
                quantity: 1
              }
            ],
            callback_url: baseUrlWeb,
            failed_url: baseUrlWeb,
            notify_url: `${baseUrlWeb}/api/payments/doku/webhook`,
            auto_redirect: true
          },
          customer: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: '6281234567890'
          }
        };
        break;
      }

      case 'DOKU_VA':
        requestTarget = '/doku-virtual-account/v2/payment-code';
        paymentChannelName = 'DOKU Virtual Account';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          virtual_account_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT',
            merchant_unique_reference: merchantRef
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'QRIS': {
        requestTarget = '/checkout/v1/payment';
        paymentChannelName = 'QRIS Instant';
        requestBody = {
          order: {
            invoice_number: invoiceNumber,
            amount: pkg.price,
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
        break;
      }



      case 'ALFAMART':
        requestTarget = '/alfa-online-to-offline/v2/payment-code';
        paymentChannelName = 'Alfa Group / Alfamart';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          online_to_offline_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT'
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'INDOMARET':
        requestTarget = '/indomaret-online-to-offline/v2/payment-code';
        paymentChannelName = 'Indomaret';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          online_to_offline_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT'
          },
          customer: { name: user.name, email: user.email }
        };
        break;

      case 'BRI':
      default:
        requestTarget = '/bri-virtual-account/v2/payment-code';
        paymentChannelName = 'BRI Virtual Account';
        requestBody = {
          order: { invoice_number: invoiceNumber, amount: pkg.price },
          virtual_account_info: {
            expired_time: 60,
            reusable_status: false,
            info1: 'KondangSensei JFT'
          },
          customer: { name: user.name, email: user.email }
        };
        break;
    }

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

    let vaNumber = dokuData?.virtual_account_info?.virtual_account_number;
    let paymentCode = dokuData?.online_to_offline_info?.payment_code;
    let walletPageUrl = dokuData?.doku_wallet_payment_page?.url;
    let checkoutPaymentUrl = dokuData?.response?.payment?.url || dokuData?.payment?.url || dokuData?.url;
    let qrString = dokuData?.qr_content || dokuData?.qr_string || dokuData?.payment?.qr_content;
    let howToPayUrl = walletPageUrl || checkoutPaymentUrl || dokuData?.virtual_account_info?.how_to_pay_page || dokuData?.online_to_offline_info?.how_to_pay_page;

    const hasLiveCode = Boolean(dokuResponse?.ok && (vaNumber || paymentCode || walletPageUrl || checkoutPaymentUrl || qrString));

    // Sandbox Simulator Fallback if DOKU Sandbox API returns error or merchant key is not active on sandbox
    if (isSandbox && !hasLiveCode) {
      console.log(`[DOKU SANDBOX SIMULATOR] Generating sandbox payment for channel: ${channel}`);
      howToPayUrl = 'https://sandbox.doku.com';

      switch (channel) {
        case 'QRIS':
          qrString = generateDynamicQris(pkg.price, invoiceNumber, 'KONDANG SENSEI (SANDBOX)');
          howToPayUrl = 'https://sandbox.doku.com/qris-simulator/';
          break;
        case 'BNI':
          vaNumber = `8291${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          break;
        case 'BSI':
          vaNumber = `6059${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          break;
        case 'CIMB':
          vaNumber = `1899${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          break;
        case 'DANAMON':
          vaNumber = `8922${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          break;
        case 'MAYBANK':
          vaNumber = `7867${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          break;
        case 'DOKU_EWALLET':
          walletPageUrl = `${baseUrlWeb}/api/payments/status?invoiceNumber=${invoiceNumber}`;
          paymentCode = `DW-${Math.floor(10000000 + Math.random() * 90000000)}`;
          break;
        case 'ALFAMART':
          paymentCode = `917${Math.floor(1000 + Math.random() * 9000)}`;
          break;
        case 'INDOMARET':
          paymentCode = `949${Math.floor(10000 + Math.random() * 90000)}`;
          break;
        case 'BRI':
        default:
          vaNumber = `1236${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          break;
      }
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

    if (hasLiveCode || isSandbox) {
      const code = vaNumber || paymentCode || qrString || 'DOKU-CHECKOUT';
      const sandboxLabel = isSandbox ? ' [SANDBOX]' : '';
      const fullMethod = `DOKU (${paymentChannelName}${sandboxLabel})${vaNumber || paymentCode ? ` - ${code}` : ''}`;

      // Save Transaction record with PENDING status, paymentCode, and 1 hour expiry
      const newTx: Transaction = {
        id: invoiceNumber,
        userId: user.id,
        userName: user.name,
        packageId: pkg.id,
        packageName: pkg.name,
        amount: pkg.price,
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
           (id, userId, userName, packageId, packageName, amount, paymentMethod, paymentCode, howToPayUrl, expiredAt, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
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
        amount: pkg.price,
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

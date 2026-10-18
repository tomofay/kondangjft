import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User, TryoutPackage, Transaction } from '@/types';
import { generateDokuSignature, getDokuBaseUrl } from '@/lib/doku';

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
        const baseUrlWeb = process.env.NEXT_PUBLIC_BASE_URL || 'https://kondangsensei.my.id';
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
        const baseUrlWeb = process.env.NEXT_PUBLIC_BASE_URL || 'https://kondangsensei.my.id';
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

      case 'GOOGLE_PAY': {
        requestTarget = '/checkout/v1/payment';
        paymentChannelName = 'Google Pay';
        const baseUrlWeb = process.env.NEXT_PUBLIC_BASE_URL || 'https://kondangsensei.my.id';
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
            payment_method_types: ['GOOGLE_PAY']
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

      case 'AKULAKU': {
        requestTarget = '/akulaku-peer-to-peer/v2/generate-order';
        paymentChannelName = 'Akulaku PayLater';
        const baseUrlWeb = process.env.NEXT_PUBLIC_BASE_URL || 'https://kondangsensei.my.id';
        // Akulaku line_items.name strictly allows alphanumeric and spaces (no brackets/parentheses)
        const sanitizedItemName = (pkg.name || 'Paket Tryout JFT Basic')
          .replace(/[^a-zA-Z0-9 ]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 50);

        requestBody = {
          order: {
            invoice_number: invoiceNumber,
            amount: pkg.price,
            line_items: [
              {
                name: sanitizedItemName,
                price: pkg.price,
                quantity: 1,
                sku: (pkg.id || 'JFT01').replace(/[^a-zA-Z0-9]/g, ''),
                category: 'Education'
              }
            ],
            callback_url: baseUrlWeb
          },
          payment: {
            merchant_unique_reference: `MUR-${invoiceNumber}`
          },
          customer: {
            id: user.id,
            name: (user.name || 'Peserta JFT').replace(/[^a-zA-Z0-9 ]/g, ' ').trim(),
            phone: '6281234567890',
            address: 'Indonesia',
            city: 'Jakarta',
            state: 'DKI Jakarta',
            postcode: '10110'
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

    // Call DOKU Direct API
    const dokuResponse = await fetch(`${baseUrl}${requestTarget}`, {
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

    const dokuData = await dokuResponse.json();

    const vaNumber = dokuData.virtual_account_info?.virtual_account_number;
    const paymentCode = dokuData.online_to_offline_info?.payment_code;
    const walletPageUrl = dokuData.doku_wallet_payment_page?.url;
    const checkoutPaymentUrl = dokuData.response?.payment?.url || dokuData.payment?.url || dokuData.url;
    const qrString = dokuData.qr_content || dokuData.qr_string || dokuData.payment?.qr_content;
    const howToPayUrl = walletPageUrl || checkoutPaymentUrl || dokuData.virtual_account_info?.how_to_pay_page || dokuData.online_to_offline_info?.how_to_pay_page;
    
    // Normalize expired date to valid ISO format (DOKU returns 'YYYYMMDDHHmmss' format e.g. '20261018123529')
    const rawExpired = dokuData.virtual_account_info?.expired_date || dokuData.online_to_offline_info?.expired_date;
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

    if (dokuResponse.ok && (vaNumber || paymentCode || walletPageUrl || checkoutPaymentUrl || qrString)) {
      const code = vaNumber || paymentCode || qrString || 'DOKU-CHECKOUT';
      const fullMethod = `DOKU (${paymentChannelName})${vaNumber || paymentCode ? ` - ${code}` : ''}`;

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
        message: `Nomor Pembayaran DOKU (${paymentChannelName}) berhasil diterbitkan.`
      });
    }

    console.warn('DOKU API Response Error:', dokuData);
    return NextResponse.json({
      success: false,
      message: dokuData.error?.message || (Array.isArray(dokuData.message) ? dokuData.message.join(', ') : dokuData.message) || 'Gagal membuat nomor pembayaran DOKU.',
      details: dokuData
    }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

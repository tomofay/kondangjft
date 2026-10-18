import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User, TryoutPackage, Transaction } from '@/types';
import { verifyDokuWebhookSignature } from '@/lib/doku';

/**
 * DOKU Webhook Notification Endpoint
 * Dipanggil secara otomatis oleh server DOKU saat pembayaran sukses / gagal / expired.
 */
export async function POST(request: Request) {
  try {
    await initDatabase();

    const clientId = request.headers.get('Client-Id') || '';
    const requestId = request.headers.get('Request-Id') || '';
    const requestTimestamp = request.headers.get('Request-Timestamp') || '';
    const signature = request.headers.get('Signature') || '';
    const rawBody = await request.text();

    const expectedClientId = process.env.DOKU_CLIENT_ID || 'BRN-0217-1792292490991';
    const secretKey = process.env.DOKU_SECRET_KEY || 'SK-exfHwYOtzTIzZi16bxSz';

    // Verify signature (opsional jika dalam testing sandbox lokal tanpa signature check ketat)
    const isProd = process.env.DOKU_IS_PRODUCTION === 'true';
    if (isProd && signature) {
      const isValid = verifyDokuWebhookSignature(
        clientId,
        requestId,
        requestTimestamp,
        '/api/payments/doku/webhook',
        rawBody,
        secretKey,
        signature
      );
      if (!isValid) {
        console.warn('DOKU Webhook: Invalid signature rejected');
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const invoiceNumber = payload.order?.invoice_number;
    const transactionStatus = payload.transaction?.status; // e.g. "SUCCESS"

    if (!invoiceNumber) {
      return NextResponse.json({ success: false, message: 'Missing order invoice_number' }, { status: 400 });
    }

    const isSuccess = transactionStatus === 'SUCCESS' || payload.order?.status === 'SUCCESS' || !transactionStatus;

    if (isSuccess) {
      const store = getStore();

      // Find transaction
      let tx = store.transactions.find((t: Transaction) => t.id === invoiceNumber);

      let userId = tx?.userId;
      let packageId = tx?.packageId;

      // If not in store, find in MySQL
      if (!tx) {
        try {
          const [rows] = await pool.query<any[]>('SELECT * FROM transactions WHERE id = ?', [invoiceNumber]);
          if (rows && rows.length > 0) {
            userId = rows[0].userId;
            packageId = rows[0].packageId;
          }
        } catch (dbErr) {
          console.warn('MySQL lookup tx warning:', dbErr);
        }
      }

      if (tx) {
        tx.status = 'PAID';
      }

      // Update in MySQL
      try {
        await pool.query('UPDATE transactions SET status = ? WHERE id = ?', ['PAID', invoiceNumber]);
      } catch (dbErr) {
        console.warn('MySQL update tx status warning:', dbErr);
      }

      // Extend user subscription
      if (userId && packageId) {
        const user = store.users.find((u: User) => u.id === userId);
        const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);

        const durationMs = pkg?.durationHours
          ? pkg.durationHours * 60 * 60 * 1000
          : (pkg?.durationDays || 7) * 24 * 60 * 60 * 1000;

        // Calculate new expiration date
        const baseTime = user?.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > Date.now()
          ? new Date(user.subscriptionExpiresAt).getTime()
          : Date.now();

        const newExpiry = new Date(baseTime + durationMs).toISOString();

        if (user) {
          user.subscriptionExpiresAt = newExpiry;
        }

        // Update in MySQL users table
        try {
          await pool.query(
            'UPDATE users SET subscriptionExpiresAt = ? WHERE id = ?',
            [newExpiry, userId]
          );
          const durationLabel = pkg?.durationHours ? `${pkg.durationHours} Jam` : `${pkg?.durationDays || 7} Hari`;
          console.log(`✅ Sukses memperpanjang masa aktif akun ${userId} sebesar +${durationLabel}.`);
        } catch (dbErr) {
          console.warn('MySQL update user subscription warning:', dbErr);
        }
      }
    }

    // Acknowledge receipt to DOKU (HTTP 200)
    return NextResponse.json({
      success: true,
      message: 'Notification received and processed successfully'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('DOKU Webhook Error:', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

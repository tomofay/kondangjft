import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { Transaction, User } from '@/types';

/**
 * GET /api/payments/status?invoiceNumber=INV-xxxx
 * Digunakan oleh frontend untuk mengecek apakah DOKU sudah mengonfirmasi pembayaran (PAID).
 */
export async function GET(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get('invoiceNumber');

    if (!invoiceNumber) {
      return NextResponse.json({ success: false, message: 'Invoice number required' }, { status: 400 });
    }

    const store = getStore();

    // 1. Cek di memory store
    let tx = store.transactions.find((t: Transaction) => t.id === invoiceNumber);
    let user: User | undefined;

    if (tx?.userId) {
      user = store.users.find((u: User) => u.id === tx?.userId);
    }

    // 2. Cek di MySQL jika status belum PAID atau belum ada di store
    if (!tx || tx.status !== 'PAID') {
      try {
        const [rows] = await pool.query<any[]>(
          'SELECT * FROM transactions WHERE id = ?',
          [invoiceNumber]
        );
        if (rows && rows.length > 0) {
          const dbTx = rows[0];
          if (!tx) {
            tx = {
              id: dbTx.id,
              userId: dbTx.userId,
              userName: dbTx.userName,
              packageId: dbTx.packageId,
              packageName: dbTx.packageName,
              amount: dbTx.amount,
              paymentMethod: dbTx.paymentMethod,
              status: dbTx.status,
              createdAt: dbTx.createdAt
            };
            store.transactions.unshift(tx);
          } else {
            tx.status = dbTx.status;
          }

          // Cek masa aktif user di DB
          const [userRows] = await pool.query<any[]>(
            'SELECT * FROM users WHERE id = ?',
            [dbTx.userId]
          );
          if (userRows && userRows.length > 0) {
            if (user) {
              user.subscriptionExpiresAt = userRows[0].subscriptionExpiresAt;
            }
          }
        }
      } catch (dbErr) {
        console.warn('MySQL check tx status warning:', dbErr);
      }
    }

    const isPaid = tx?.status === 'PAID';

    return NextResponse.json({
      success: true,
      invoiceNumber,
      status: tx?.status || 'PENDING',
      isPaid,
      subscriptionExpiresAt: user?.subscriptionExpiresAt || null,
      message: isPaid ? 'Pembayaran telah dikonfirmasi oleh DOKU.' : 'Menunggu transfer peserta ke DOKU...'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

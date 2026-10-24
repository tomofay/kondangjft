import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { Transaction, User, TryoutPackage } from '@/types';
import { checkDokuOrderStatus } from '@/lib/doku';

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
    let userId = tx?.userId;
    let packageId = tx?.packageId;

    // 2. Cek di MySQL
    if (!tx) {
      try {
        const [rows] = await pool.query<any[]>(
          'SELECT * FROM transactions WHERE id = ?',
          [invoiceNumber]
        );
        if (rows && rows.length > 0) {
          const dbTx = rows[0];
          userId = dbTx.userId;
          packageId = dbTx.packageId;
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
        }
      } catch (dbErr) {
        console.warn('MySQL check tx status warning:', dbErr);
      }
    }

    // 3. Jika status masih PENDING, tanyakan langsung ke API resmi DOKU
    if (tx && tx.status !== 'PAID') {
      try {
        const dokuCheck = await checkDokuOrderStatus(invoiceNumber);
        if (dokuCheck.isSuccess) {
          tx.status = 'PAID';

          // Update transaction in MySQL
          try {
            await pool.query('UPDATE transactions SET status = "PAID" WHERE id = ?', [invoiceNumber]);
          } catch (dbErr) {
            console.warn('MySQL update tx status to PAID warning:', dbErr);
          }

          // Perpanjang masa aktif user
          if (userId && packageId) {
            const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);
            const durationMs = pkg?.durationHours
              ? pkg.durationHours * 60 * 60 * 1000
              : (pkg?.durationDays || 7) * 24 * 60 * 60 * 1000;

            let targetUser = store.users.find((u: User) => u.id === userId);
            let currentExpiresAt: string | null | undefined = targetUser?.subscriptionExpiresAt;

            if (!currentExpiresAt) {
              try {
                const [uRows] = await pool.query<any[]>('SELECT subscriptionExpiresAt FROM users WHERE id = ?', [userId]);
                if (uRows && uRows.length > 0 && uRows[0].subscriptionExpiresAt) {
                  currentExpiresAt = String(uRows[0].subscriptionExpiresAt);
                }
              } catch {}
            }

            const baseTime = currentExpiresAt && new Date(currentExpiresAt).getTime() > Date.now()
              ? new Date(currentExpiresAt).getTime()
              : Date.now();
            const newExpiry = new Date(baseTime + durationMs).toISOString();

            if (targetUser) {
              targetUser.subscriptionExpiresAt = newExpiry;
            }

            try {
              await pool.query('UPDATE users SET subscriptionExpiresAt = ? WHERE id = ?', [newExpiry, userId]);
              console.log(`✅ Status API: Sukses mengaktifkan paket ${packageId} untuk user ${userId} hingga ${newExpiry}`);
            } catch (dbErr) {
              console.warn('MySQL update user subscription warning:', dbErr);
            }
          }
        }
      } catch (dokuErr) {
        console.warn('DOKU live status query error:', dokuErr);
      }
    }

    let user = store.users.find((u: User) => u.id === (userId || tx?.userId));
    if (!user?.subscriptionExpiresAt && userId) {
      try {
        const [uRows] = await pool.query<any[]>('SELECT * FROM users WHERE id = ?', [userId]);
        if (uRows && uRows.length > 0 && uRows[0].subscriptionExpiresAt) {
          if (user) {
            user.subscriptionExpiresAt = String(uRows[0].subscriptionExpiresAt);
          }
        }
      } catch {}
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

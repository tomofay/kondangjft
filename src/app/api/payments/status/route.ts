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

    const paramUserId = searchParams.get('userId');
    const paramPackageId = searchParams.get('packageId');

    if (!userId && paramUserId) userId = paramUserId;
    if (!packageId && paramPackageId) packageId = paramPackageId;

    // 3. Tanyakan langsung ke API resmi DOKU jika status belum PAID atau tx belum tercatat
    if (!tx || tx.status !== 'PAID') {
      try {
        const dokuCheck = await checkDokuOrderStatus(invoiceNumber);
        if (dokuCheck.isSuccess) {
          const dokuAmount = Number(dokuCheck.data?.order?.amount || dokuCheck.data?.transaction?.amount || 35000);

          // Deduce package if not specified
          if (!packageId) {
            if (dokuAmount === 35000) {
              packageId = 'pkg_7d';
            } else if (dokuAmount === 59000) {
              packageId = 'pkg_14d';
            } else if (dokuAmount === 99000) {
              packageId = 'pkg_30d';
            } else {
              packageId = 'pkg_7d';
            }
          }

          const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);

          // If userId still not found, try getting active session or first registered user from DB
          if (!userId) {
            try {
              const [uRows] = await pool.query<any[]>('SELECT id FROM users ORDER BY lastActiveAt DESC LIMIT 1');
              if (uRows && uRows.length > 0) {
                userId = uRows[0].id;
              } else if (store.users.length > 0) {
                userId = store.users[0].id;
              }
            } catch {}
          }

          if (!tx) {
            tx = {
              id: invoiceNumber,
              userId: userId || 'u_1',
              userName: 'Peserta JFT',
              packageId: packageId,
              packageName: pkg?.name || 'Paket JFT Basic',
              amount: dokuAmount,
              paymentMethod: 'QRIS Instant',
              status: 'PAID',
              createdAt: new Date().toISOString()
            };
            store.transactions.unshift(tx);
          } else {
            tx.status = 'PAID';
            if (packageId && !tx.packageId) tx.packageId = packageId;
          }

          // Insert or Update transaction in MySQL
          try {
            await pool.query(
              `INSERT INTO transactions (id, userId, userName, packageId, packageName, amount, paymentMethod, status, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', NOW())
               ON DUPLICATE KEY UPDATE status = 'PAID'`,
              [
                tx.id,
                tx.userId || userId || 'u_1',
                tx.userName || 'Peserta JFT',
                tx.packageId || packageId,
                tx.packageName || 'Paket JFT Basic',
                tx.amount || dokuAmount,
                tx.paymentMethod || 'QRIS Instant'
              ]
            );
          } catch (dbErr) {
            console.warn('MySQL upsert tx status to PAID warning:', dbErr);
          }

          // Perpanjang masa aktif user
          if (userId && packageId) {
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

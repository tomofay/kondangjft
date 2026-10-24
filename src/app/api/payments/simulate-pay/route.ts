import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User, TryoutPackage, Transaction } from '@/types';

/**
 * POST /api/payments/simulate-pay
 * Sandbox Testing Endpoint untuk mensimulasikan pembayaran berhasil (PAID) secara instan.
 */
export async function POST(request: Request) {
  try {
    await initDatabase();
    const { invoiceNumber } = await request.json();

    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: 'Invoice number required' },
        { status: 400 }
      );
    }

    const store = getStore();

    // 1. Cari transaksi di store atau database
    let tx = store.transactions.find((t: Transaction) => t.id === invoiceNumber);
    let userId = tx?.userId;
    let packageId = tx?.packageId;

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
            paymentCode: dbTx.paymentCode,
            status: 'PENDING',
            createdAt: dbTx.createdAt
          };
          store.transactions.unshift(tx);
        }
      } catch (dbErr) {
        console.warn('MySQL lookup tx warning:', dbErr);
      }
    }

    if (!tx || !userId || !packageId) {
      return NextResponse.json(
        { success: false, message: 'Transaksi tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 2. Set status transaksi menjadi PAID
    tx.status = 'PAID';

    try {
      await pool.query(
        'UPDATE transactions SET status = ? WHERE id = ?',
        ['PAID', invoiceNumber]
      );
    } catch (dbErr) {
      console.warn('MySQL update tx status warning:', dbErr);
    }

    // 3. Perpanjang masa aktif akun siswa
    const user = store.users.find((u: User) => u.id === userId);
    const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);

    const durationMs = pkg?.durationHours
      ? pkg.durationHours * 60 * 60 * 1000
      : (pkg?.durationDays || 7) * 24 * 60 * 60 * 1000;

    const baseTime =
      user?.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt).getTime() > Date.now()
        ? new Date(user.subscriptionExpiresAt).getTime()
        : Date.now();

    const newExpiry = new Date(baseTime + durationMs).toISOString();

    if (user) {
      user.subscriptionExpiresAt = newExpiry;
    }

    try {
      await pool.query(
        'UPDATE users SET subscriptionExpiresAt = ? WHERE id = ?',
        [newExpiry, userId]
      );
    } catch (dbErr) {
      console.warn('MySQL update user subscription warning:', dbErr);
    }

    const durationLabel = pkg?.durationHours
      ? `${pkg.durationHours} Jam`
      : `${pkg?.durationDays || 7} Hari`;

    return NextResponse.json({
      success: true,
      invoiceNumber,
      status: 'PAID',
      subscriptionExpiresAt: newExpiry,
      message: `Simulasi pembayaran berhasil! Masa aktif paket ${pkg?.name || ''} (+${durationLabel}) telah aktif.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

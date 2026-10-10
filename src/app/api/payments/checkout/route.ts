import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/dataStore';
import { Transaction, User, TryoutPackage } from '../../../../types';

export async function POST(request: Request) {
  try {
    const { userId, packageId, paymentMethod } = await request.json();
    const store = getStore();

    const user = store.users.find((u: User) => u.id === userId);
    const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);

    if (!user || !pkg) {
      return NextResponse.json({ success: false, message: 'User atau Paket tidak ditemukan' }, { status: 404 });
    }

    const newTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: user.id,
      userName: user.name,
      packageId: pkg.id,
      packageName: pkg.name,
      amount: pkg.price,
      paymentMethod: paymentMethod || 'QRIS Instant',
      status: 'PAID',
      createdAt: new Date().toISOString()
    };

    // Calculate new expiration date (extend if active, or set from now)
    const durationMs = (pkg.durationDays || 7) * 24 * 60 * 60 * 1000;
    const baseTime = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > Date.now()
      ? new Date(user.subscriptionExpiresAt).getTime()
      : Date.now();

    const newExpiry = new Date(baseTime + durationMs).toISOString();
    user.subscriptionExpiresAt = newExpiry;
    store.transactions.unshift(newTx);

    return NextResponse.json({
      success: true,
      transaction: newTx,
      subscriptionExpiresAt: newExpiry,
      user,
      message: `Pembayaran berhasil! Akses Tryout Unlimited Anda bertambah +${pkg.durationDays} hari.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

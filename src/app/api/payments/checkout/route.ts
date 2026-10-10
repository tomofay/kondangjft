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

    user.credits += pkg.tryoutCount;
    store.transactions.unshift(newTx);

    return NextResponse.json({
      success: true,
      transaction: newTx,
      newCredits: user.credits,
      message: `Pembayaran berhasil! +${pkg.tryoutCount} kuota tryout telah ditambahkan ke akun Anda.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

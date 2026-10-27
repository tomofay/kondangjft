import { NextResponse } from 'next/server';
import { getStore, calculateVoucherDiscount } from '../../../../lib/dataStore';
import { Transaction, User, TryoutPackage, Voucher } from '../../../../types';
import { pool } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { userId, packageId, paymentMethod, voucherCode } = await request.json();
    const store = getStore();

    const user = store.users.find((u: User) => u.id === userId);
    const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);

    if (!user || !pkg) {
      return NextResponse.json({ success: false, message: 'User atau Paket tidak ditemukan' }, { status: 404 });
    }

    let originalAmount = pkg.price;
    let discountAmount = 0;
    let finalAmount = pkg.price;
    let voucherCodeUsed: string | undefined = undefined;

    if (voucherCode && typeof voucherCode === 'string' && voucherCode.trim()) {
      const cleanCode = voucherCode.trim().toUpperCase();
      const voucher = store.vouchers.find((v: Voucher) => v.code.toUpperCase() === cleanCode);
      if (voucher) {
        const discountRes = calculateVoucherDiscount(voucher, pkg.price, pkg.id);
        if (discountRes.isValid) {
          discountAmount = discountRes.discountAmount;
          finalAmount = discountRes.finalPrice;
          voucherCodeUsed = voucher.code;
          voucher.usedCount += 1;
          try {
            await pool.query('UPDATE vouchers SET usedCount = usedCount + 1 WHERE id = ?', [voucher.id]);
          } catch {}
        }
      }
    }

    const newTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: user.id,
      userName: user.name,
      packageId: pkg.id,
      packageName: pkg.name,
      amount: finalAmount,
      originalAmount,
      discountAmount,
      voucherCode: voucherCodeUsed,
      paymentMethod: paymentMethod || 'QRIS Instant',
      status: 'PAID',
      createdAt: new Date().toISOString()
    };

    // Calculate new expiration date (extend if active, or set from now)
    const durationMs = pkg.durationHours
      ? pkg.durationHours * 60 * 60 * 1000
      : (pkg.durationDays || 7) * 24 * 60 * 60 * 1000;
    const baseTime = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > Date.now()
      ? new Date(user.subscriptionExpiresAt).getTime()
      : Date.now();

    const newExpiry = new Date(baseTime + durationMs).toISOString();
    user.subscriptionExpiresAt = newExpiry;
    store.transactions.unshift(newTx);

    const durationLabel = pkg.durationHours ? `${pkg.durationHours} Jam` : `${pkg.durationDays} Hari`;

    return NextResponse.json({
      success: true,
      transaction: newTx,
      subscriptionExpiresAt: newExpiry,
      user,
      message: `Pembayaran berhasil! Akses Tryout Unlimited Anda bertambah +${durationLabel}.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

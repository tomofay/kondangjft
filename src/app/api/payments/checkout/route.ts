import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { createCheckoutTransaction, getPackageById } from '@/lib/paymentStore';

export async function POST(request: Request) {
  try {
    const token = extractToken({
      headers: {
        cookie: request.headers.get('cookie') || '',
        authorization: request.headers.get('authorization') || ''
      }
    });

    let userId = 'usr_siswa_001';
    if (token) {
      const res = verifySessionToken(token);
      if (res.valid) {
        userId = res.payload.userId;
      }
    }

    const body = await request.json();
    const { packageId, paymentMethod = 'QRIS' } = body;

    if (!packageId) {
      return NextResponse.json({ success: false, error: 'packageId wajib diisi' }, { status: 400 });
    }

    const pkg = getPackageById(packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Paket tidak ditemukan' }, { status: 404 });
    }

    const checkoutResult = createCheckoutTransaction(userId, packageId, paymentMethod);

    return NextResponse.json({
      success: true,
      data: checkoutResult.data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

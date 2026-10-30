import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getAllTransactions } from '@/lib/paymentStore';

export async function GET(request: Request) {
  const token = extractToken({
    headers: {
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || ''
    }
  });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = verifySessionToken(token);
  if (!result.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Strictly super_admin only, sensei and other roles are forbidden
  if (!result.payload.roles.includes('super_admin')) {
    return NextResponse.json(
      { error: 'Forbidden: Hanya Super Admin yang berhak mengakses laporan transaksi dan keuangan' },
      { status: 403 }
    );
  }

  const transactions = getAllTransactions();

  return NextResponse.json({
    success: true,
    data: {
      transactions
    }
  });
}

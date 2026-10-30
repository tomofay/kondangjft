import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getUserTransactions } from '@/lib/paymentStore';

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

  const userId = result.payload.userId;
  const transactions = getUserTransactions(userId);

  return NextResponse.json({
    success: true,
    data: {
      transactions
    }
  });
}

import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';

export async function GET(request: Request) {
  const token = extractToken({
    headers: {
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || ''
    }
  });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = verifySessionToken(token);
  if (!result.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only super_admin allowed, Sensei is strictly blocked
  if (!result.payload.roles.includes('super_admin')) {
    return NextResponse.json(
      { error: 'Unauthorized role: Sensei and students are forbidden from accessing financial records' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { transactions: [] }
  });
}

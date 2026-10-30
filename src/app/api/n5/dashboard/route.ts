import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { hasAnyRole } from '@/lib/rbac';

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

  if (!hasAnyRole(result.payload, ['siswa_n5', 'sensei'])) {
    return NextResponse.json(
      { error: 'Forbidden: Akun Anda memerlukan akses Kelas N5' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      user: result.payload,
      chaptersAvailable: [1, 2]
    }
  });
}

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
      { error: 'Forbidden: Anda belum terdaftar di Kelas N5' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      materials: [
        { id: 1, title: 'Bab 1: Perkenalan & Pola Kalimat Dasar' },
        { id: 2, title: 'Bab 2: Benda & Kepemilikan' }
      ]
    }
  });
}

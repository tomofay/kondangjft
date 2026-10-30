import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { hasAnyRole } from '@/lib/rbac';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
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
      { error: 'Forbidden: Akses materi bab memerlukan pendaftaran Kelas N5' },
      { status: 403 }
    );
  }

  const { chapterId } = await params;
  return NextResponse.json({
    success: true,
    data: {
      chapterId,
      title: `Bab ${chapterId}`
    }
  });
}

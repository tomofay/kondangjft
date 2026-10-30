import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getChapterOmake } from '@/lib/omakeCertificateStore';

export async function GET(request: Request) {
  try {
    const token = extractToken({
      headers: {
        cookie: request.headers.get('cookie') || '',
        authorization: request.headers.get('authorization') || ''
      }
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = verifySessionToken(token);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roles, userId } = auth.payload;
    const isN5Eligible = roles.includes('siswa_n5') || roles.includes('sensei') || roles.includes('super_admin');
    if (!isN5Eligible) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses ke Modul Hadiah Omake N5' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterId = parseInt(searchParams.get('chapterId') || '1', 10);

    const result = getChapterOmake(userId, chapterId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 403 });
    }

    return NextResponse.json({
      success: true,
      omake: result.omake,
      isUnlocked: result.isUnlocked
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

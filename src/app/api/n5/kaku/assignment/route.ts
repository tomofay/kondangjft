import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getKakuAssignmentByChapter } from '@/lib/kakuStore';

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

    const { roles } = auth.payload;
    const isN5Eligible = roles.includes('siswa_n5') || roles.includes('sensei') || roles.includes('super_admin');
    if (!isN5Eligible) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses ke Modul Penugasan Menulis Kaku N5' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterId = parseInt(searchParams.get('chapterId') || '1', 10);

    const assignment = getKakuAssignmentByChapter(chapterId);
    if (!assignment) {
      return NextResponse.json({ error: 'Tugas menulis bab ini belum tersedia' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assignment
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

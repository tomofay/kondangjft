import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getBunpouByChapter } from '@/lib/bunpouStore';

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

    // RBAC: Peserta JFT is forbidden from viewing N5 LMS Bunpou
    const isN5Eligible = roles.includes('siswa_n5') || roles.includes('sensei') || roles.includes('super_admin');
    if (!isN5Eligible) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses ke Modul Pembelajaran N5' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterIdParam = searchParams.get('chapterId') || '1';
    const chapterId = parseInt(chapterIdParam, 10);

    const patterns = getBunpouByChapter(chapterId);
    if (!patterns) {
      return NextResponse.json({ error: 'Bab tidak ditemukan' }, { status: 404 });
    }

    // Dynamic Gating Check (M9): Bab N (N > 1) is locked until student passes previous Mondai exam
    const isStaff = roles.includes('sensei') || roles.includes('super_admin');
    if (!isStaff && chapterId > 1) {
      const { isChapterUnlocked } = await import('@/lib/mondaiStore');
      if (!isChapterUnlocked(userId, chapterId)) {
        return NextResponse.json(
          { error: `Bab ${chapterId} masih terkunci! Anda wajib lulus Ujian Mondai Bab sebelumnya terlebih dahulu.` },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        chapterId,
        patterns
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

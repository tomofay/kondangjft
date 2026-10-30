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

    const { roles } = auth.payload;
    if (!roles.includes('sensei') && !roles.includes('super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Mode presentasi hanya untuk Sensei dan Super Admin' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterId = parseInt(searchParams.get('chapterId') || '1', 10);

    const patterns = getBunpouByChapter(chapterId);
    if (!patterns) {
      return NextResponse.json({ error: 'Bab tidak ditemukan' }, { status: 404 });
    }

    const slides = patterns.map((p, idx) => ({
      slideNumber: idx + 1,
      title: p.title,
      meaning: p.meaning,
      formula_blocks: p.formula_blocks,
      key_points: p.key_points,
      example_sentences: p.example_sentences,
      nuance_accordion: p.nuance_accordion
    }));

    return NextResponse.json({
      success: true,
      data: {
        chapterId,
        presentationMode: true,
        slides
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

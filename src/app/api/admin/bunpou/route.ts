import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { saveBunpouPattern, BunpouPattern } from '@/lib/bunpouStore';

export async function POST(request: Request) {
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

    if (!auth.payload.roles.includes('super_admin')) {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { chapter_id, title, formula_blocks } = body;

    // Validate formula_blocks
    if (formula_blocks && Array.isArray(formula_blocks)) {
      const validTypes = ['topic', 'particle', 'predicate'];
      for (const block of formula_blocks) {
        if (!validTypes.includes(block.type)) {
          return NextResponse.json(
            { error: 'Validasi gagal: type harus topic, particle, atau predicate' },
            { status: 400 }
          );
        }
      }
    }

    const newPattern: BunpouPattern = {
      chapter_id: chapter_id || 1,
      pattern_code: body.pattern_code || `N5-B01-${Date.now()}`,
      title: title || 'Pola Bunpou Baru',
      meaning: body.meaning || '',
      formula_blocks: formula_blocks || [],
      key_points: body.key_points || [],
      example_sentences: body.example_sentences || [],
      nuance_accordion: body.nuance_accordion || { title: 'Catatan', content: '' }
    };

    saveBunpouPattern(newPattern);

    return NextResponse.json({
      success: true,
      data: newPattern
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

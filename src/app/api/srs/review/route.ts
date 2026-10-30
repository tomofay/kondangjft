import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { calculateSM2Review } from '@/lib/srsAlgorithm';

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

    const { roles, userId } = auth.payload;

    const isN5Eligible = roles.includes('siswa_n5') || roles.includes('sensei') || roles.includes('super_admin');
    if (!isN5Eligible) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses ke Modul Kosakata N5' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vocabId, qualityRating } = body;

    if (!vocabId) {
      return NextResponse.json({ error: 'vocabId wajib diisi' }, { status: 400 });
    }

    // Always enforce the current authenticated user's ID, ignoring any targetUserId in body
    const result = calculateSM2Review(userId, vocabId, qualityRating);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

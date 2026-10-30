import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { completeJourneyStep } from '@/lib/flippedClassroomStore';

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
        { error: 'Forbidden: Anda tidak memiliki akses ke Flipped Classroom N5' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const chapterId = body.chapterId ? parseInt(body.chapterId, 10) : 1;
    const stepKey = body.stepKey;

    if (!stepKey) {
      return NextResponse.json({ error: 'stepKey wajib disertakan' }, { status: 400 });
    }

    const result = completeJourneyStep({
      userId,
      chapterId,
      stepKey
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      journey: result.journey
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

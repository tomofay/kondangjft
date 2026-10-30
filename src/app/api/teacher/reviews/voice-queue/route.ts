import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getVoiceReviewQueue } from '@/lib/kaiwaStore';

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
        { error: 'Forbidden: Hanya Sensei dan Super Admin yang dapat mengakses antrean ulasan suara' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId') || 'cls_batch1_n5';

    const queue = getVoiceReviewQueue(classId);

    return NextResponse.json({
      success: true,
      queue
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

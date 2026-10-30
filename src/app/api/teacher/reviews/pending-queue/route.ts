import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getPendingReviewQueue } from '@/lib/teacherReviewStore';

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
    const isTeacher = roles.includes('sensei') || roles.includes('super_admin');
    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Pengajar yang diizinkan mengakses antrean koreksi' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId') || undefined;

    const queue = getPendingReviewQueue(classId);

    return NextResponse.json({
      success: true,
      queue
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

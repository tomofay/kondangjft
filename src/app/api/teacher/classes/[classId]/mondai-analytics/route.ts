import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getMondaiAnalytics } from '@/lib/mondaiStore';

export async function GET(
  request: Request,
  context: { params: Promise<{ classId: string }> }
) {
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
        { error: 'Forbidden: Hanya Sensei yang berwenang melihat analisis evaluasi ujian' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const classId = params.classId;

    const { searchParams } = new URL(request.url);
    const chapterId = parseInt(searchParams.get('chapterId') || '1', 10);

    const analytics = getMondaiAnalytics(classId, chapterId);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

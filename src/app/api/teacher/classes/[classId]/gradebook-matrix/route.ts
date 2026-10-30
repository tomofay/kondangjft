import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getGradebookMatrix } from '@/lib/gradebookStore';

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

    const { roles, userId } = auth.payload;
    const isTeacher = roles.includes('sensei') || roles.includes('super_admin');
    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Pengajar yang diizinkan mengakses Gradebook Matrix' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const classId = params.classId;

    const result = getGradebookMatrix(classId, userId, roles.includes('super_admin'));

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

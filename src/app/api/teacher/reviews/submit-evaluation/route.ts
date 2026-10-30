import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { submitHomeworkEvaluation } from '@/lib/teacherReviewStore';

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

    const { roles, userId, classId: userClassId } = auth.payload;
    const isTeacher = roles.includes('sensei') || roles.includes('super_admin');
    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Forbidden: Siswa dilarang melakukan evaluasi tugas' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      submissionType = 'kaku_image',
      submissionId,
      status,
      hanamaruType,
      stampCoordinates,
      writtenFeedback,
      audioFeedbackUrl
    } = body;

    const result = submitHomeworkEvaluation({
      senseiUserId: userId,
      senseiClassId: userClassId,
      isSuperAdmin: roles.includes('super_admin'),
      submissionType,
      submissionId,
      status,
      hanamaruType,
      stampCoordinates,
      writtenFeedback,
      audioFeedbackUrl
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

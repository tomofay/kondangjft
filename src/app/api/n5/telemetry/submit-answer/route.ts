import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { recordStudentTelemetry } from '@/lib/gradebookStore';

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
        { error: 'Forbidden: Anda tidak memiliki akses ke telemetri latihan' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const classId = body.classId || 'cls_batch1_n5';
    const studentId = body.studentId || userId;
    const questionNumber = body.questionNumber || 1;
    const isCorrect = !!body.isCorrect;

    const result = recordStudentTelemetry({
      classId,
      studentId,
      questionNumber,
      isCorrect
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

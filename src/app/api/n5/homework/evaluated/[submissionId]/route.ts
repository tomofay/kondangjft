import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getEvaluatedHomework } from '@/lib/teacherReviewStore';

export async function GET(
  request: Request,
  context: { params: Promise<{ submissionId: string }> }
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
    const isEligible = roles.includes('siswa_n5') || roles.includes('sensei') || roles.includes('super_admin');
    if (!isEligible) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses ke tugas ini' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const submissionId = params.submissionId;

    const result = getEvaluatedHomework(submissionId);

    return NextResponse.json({
      success: true,
      submission: result.submission
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getLiveRenshuSubmissions } from '@/lib/renshuStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
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
    if (!roles.includes('sensei') && !roles.includes('super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya guru kelas atau super admin yang dapat melihat live renshu' },
        { status: 403 }
      );
    }

    const { classId } = await params;
    const submissions = getLiveRenshuSubmissions(classId);

    return NextResponse.json({
      success: true,
      submissions
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

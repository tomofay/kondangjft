import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const token = extractToken({
    headers: {
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || ''
    }
  });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = verifySessionToken(token);
  if (!result.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only sensei or super_admin allowed, students are strictly forbidden
  if (!result.payload.roles.includes('sensei') && !result.payload.roles.includes('super_admin')) {
    return NextResponse.json(
      { error: 'Forbidden: Siswa dilarang mengakses Gradebook Guru' },
      { status: 403 }
    );
  }

  const { classId } = await params;

  return NextResponse.json({
    success: true,
    data: { classId, matrix: [] }
  });
}

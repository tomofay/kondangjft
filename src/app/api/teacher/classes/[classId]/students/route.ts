import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getClassStudents } from '@/lib/rbac';

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

  const { roles, userId } = result.payload;
  if (!roles.includes('sensei') && !roles.includes('super_admin')) {
    return NextResponse.json({ error: 'Forbidden: Hanya Sensei atau Admin' }, { status: 403 });
  }

  const { classId } = await params;
  const res = getClassStudents(classId, userId);

  if (!res.success) {
    return NextResponse.json({ error: res.error || 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    data: { students: res.students }
  });
}

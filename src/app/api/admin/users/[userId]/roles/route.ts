import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { isValidRole, assignUserRole } from '@/lib/rbac';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
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

  if (!result.payload.roles.includes('super_admin')) {
    return NextResponse.json({ error: 'Forbidden: Hanya Super Admin' }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const { role } = body;

  if (!role || !isValidRole(role)) {
    return NextResponse.json(
      { error: 'Invalid role! Allowed roles: super_admin, sensei, siswa_n5, peserta_jft' },
      { status: 400 }
    );
  }

  const updateResult = assignUserRole(userId, role);

  return NextResponse.json({
    success: true,
    data: { roles: updateResult.roles }
  });
}

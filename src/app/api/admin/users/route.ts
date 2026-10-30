import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getAllUsers } from '@/lib/rbac';

export async function GET(request: Request) {
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

  const users = getAllUsers();
  return NextResponse.json({
    success: true,
    data: { users }
  });
}

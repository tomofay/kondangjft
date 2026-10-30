import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getUserEntitlements } from '@/lib/paymentStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const token = extractToken({
    headers: {
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || ''
    }
  });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = verifySessionToken(token);
  if (!result.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!result.payload.roles.includes('super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  const entitlements = getUserEntitlements(userId);

  return NextResponse.json({
    success: true,
    entitlements
  });
}

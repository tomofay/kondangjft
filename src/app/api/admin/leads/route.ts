import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getAllLeads } from '@/lib/leadStore';

export async function GET(request: Request) {
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
    return NextResponse.json(
      { error: 'Forbidden: Hanya Super Admin yang berhak melihat basis data prospek' },
      { status: 403 }
    );
  }

  const leads = await getAllLeads();

  return NextResponse.json({
    success: true,
    data: { leads }
  });
}

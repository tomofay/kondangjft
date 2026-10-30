import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';

const ALLOWED_ORIGINS = [
  'https://kondangsensei.my.id',
  'https://kelas.kondangsensei.my.id',
  'https://cbt.kondangsensei.my.id',
  'http://localhost:3000'
];

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  const response = new NextResponse(null, { status: 204 });

  if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  }

  return response;
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cookieHeader = request.headers.get('cookie') || '';
  const authHeader = request.headers.get('authorization') || '';

  const token = extractToken({ headers: { cookie: cookieHeader, authorization: authHeader } });

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const result = verifySessionToken(token);

  if (!result.valid) {
    if (result.reason === 'expired') {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }
    if (result.reason === 'suspended') {
      return NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Invalid session token' }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: result.payload.userId,
      name: result.payload.name,
      email: result.payload.email,
      roles: result.payload.roles,
      classId: result.payload.classId
    }
  });

  if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

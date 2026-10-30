import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractToken, verifySessionToken } from './lib/authCookie';
import { hasAnyRole, hasRole } from './lib/rbac';

const ALLOWED_ORIGINS = [
  'https://kondangsensei.my.id',
  'https://kelas.kondangsensei.my.id',
  'https://cbt.kondangsensei.my.id',
  'http://localhost:3000'
];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get('origin') || '';

  // 1. Handle CORS Preflight OPTIONS
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    }
    return response;
  }

  // 2. Subdomain & Route Guarding
  const token = extractToken({
    headers: {
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || ''
    }
  });

  // Check routes that require auth
  const isLmsRoute = host.startsWith('kelas.') || pathname.startsWith('/api/n5') || pathname.startsWith('/api/teacher');
  const isCbtRoute = host.startsWith('cbt.') || pathname.startsWith('/api/cbt');

  if (isLmsRoute || isCbtRoute) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const verification = verifySessionToken(token);
    if (!verification.valid) {
      if (verification.reason === 'expired') {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      if (verification.reason === 'suspended') {
        return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const session = verification.payload;

    // Guard LMS domain
    if (host.startsWith('kelas.')) {
      if (!hasAnyRole(session, ['siswa_n5', 'sensei'])) {
        return NextResponse.json(
          { error: 'Forbidden: Anda belum terdaftar di Kelas N5' },
          { status: 403 }
        );
      }
    }

    // Guard CBT domain
    if (host.startsWith('cbt.')) {
      if (!hasRole(session, 'peserta_jft')) {
        return NextResponse.json(
          { error: 'Forbidden: Akses CBT memerlukan paket simulasi JFT aktif' },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();
  if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*']
};

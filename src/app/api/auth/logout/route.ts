import { NextResponse } from 'next/server';
import { buildClearSessionCookie } from '@/lib/authCookie';

export async function POST(request: Request) {
  const host = request.headers.get('host') || 'kondangsensei.my.id';
  const clearCookie = buildClearSessionCookie(host);

  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil. Sesi telah diakhiri di seluruh subdomain.'
  });

  response.headers.set('Set-Cookie', clearCookie);
  return response;
}

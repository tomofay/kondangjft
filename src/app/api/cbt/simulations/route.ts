import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { hasRole } from '@/lib/rbac';

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

  if (!hasRole(result.payload, 'peserta_jft')) {
    return NextResponse.json(
      { error: 'Forbidden: Akses CBT memerlukan paket simulasi JFT aktif' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      simulations: [
        { id: 'jft_pack_1', title: 'Simulasi JFT-Basic A2 Paket 1', totalQuestions: 50 },
        { id: 'jft_pack_2', title: 'Simulasi JFT-Basic A2 Paket 2', totalQuestions: 50 }
      ]
    }
  });
}

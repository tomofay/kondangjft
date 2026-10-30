import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { revokeCertificate } from '@/lib/omakeCertificateStore';

export async function POST(
  request: Request,
  context: { params: Promise<{ certId: string }> }
) {
  try {
    const token = extractToken({
      headers: {
        cookie: request.headers.get('cookie') || '',
        authorization: request.headers.get('authorization') || ''
      }
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = verifySessionToken(token);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roles } = auth.payload;
    if (!roles.includes('super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Super Admin yang berwenang mencabut sertifikat' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const certId = params.certId;

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Revoked by administrator';

    const result = revokeCertificate(certId, reason);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

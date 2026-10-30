import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { generateStudentCertificate } from '@/lib/omakeCertificateStore';

export async function POST(request: Request) {
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

    const { roles, userId, name } = auth.payload;
    const isN5Eligible = roles.includes('siswa_n5') || roles.includes('sensei') || roles.includes('super_admin');
    if (!isN5Eligible) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses untuk menerbitkan sertifikat kelulusan N5' },
        { status: 403 }
      );
    }

    const result = generateStudentCertificate(userId, name);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, progress: result.progress },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: result.certificate
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

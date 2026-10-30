import { NextResponse } from 'next/server';
import { createSessionToken, buildSessionCookie, UserRole } from '@/lib/authCookie';
import { getUserById } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const host = request.headers.get('host') || 'kondangsensei.my.id';
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password harus diisi.' },
        { status: 400 }
      );
    }

    // Determine user roles based on email / test accounts
    let userId = 'usr_siswa_001';
    let name = 'Budi Pratama';
    let roles: UserRole[] = ['siswa_n5'];

    if (email.includes('admin')) {
      userId = 'usr_superadmin_001';
      name = 'Super Admin Kondang';
      roles = ['super_admin'];
    } else if (email.includes('sensei') || email.includes('tanaka')) {
      userId = 'usr_sensei_001';
      name = 'Tanaka Sensei';
      roles = ['sensei'];
    } else if (email.includes('peserta') || email.includes('siti')) {
      userId = 'usr_peserta_001';
      name = 'Siti Rahma';
      roles = ['peserta_jft'];
    } else if (email.includes('bundle') || email.includes('andi')) {
      userId = 'usr_bundle_001';
      name = 'Andi Wijaya';
      roles = ['siswa_n5', 'peserta_jft'];
    }

    const token = createSessionToken({
      userId,
      name,
      email,
      roles
    });

    const cookieString = buildSessionCookie(token, host);

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil! Sesi aktif.',
      data: {
        user: {
          id: userId,
          name,
          email,
          roles
        },
        token
      }
    });

    response.headers.set('Set-Cookie', cookieString);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

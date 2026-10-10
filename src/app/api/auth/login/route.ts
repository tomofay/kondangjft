import { NextResponse } from 'next/server';
import { getStore, registerUserSession } from '../../../../lib/dataStore';
import { User } from '../../../../types';

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();
    const store = getStore();

    // Find user by email or fallback by role
    let user = store.users.find((u: User) => u.email.toLowerCase() === email?.toLowerCase());

    if (!user) {
      if (role === 'admin') {
        user = store.users.find((u: User) => u.role === 'admin');
      } else {
        user = store.users.find((u: User) => u.role === 'user');
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Register single session token on server.
    const { sessionId } = registerUserSession(user.id);

    return NextResponse.json({
      success: true,
      user,
      sessionId,
      message: 'Login berhasil. Sesi tunggal diaktifkan.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

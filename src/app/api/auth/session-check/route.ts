import { NextResponse } from 'next/server';
import { verifyUserSession, getStore } from '../../../../lib/dataStore';
import { User } from '../../../../types';

export async function POST(request: Request) {
  try {
    const { userId, sessionId } = await request.json();

    if (!userId || !sessionId) {
      return NextResponse.json({ valid: true });
    }

    const isValid = verifyUserSession(userId, sessionId);
    const store = getStore();
    const user = store.users.find((u: User) => u.id === userId);

    if (!isValid) {
      return NextResponse.json({
        valid: false,
        reason: 'ACCOUNT_LOGGED_IN_ELSEWHERE',
        message: 'Akun Anda telah diakses melalui perangkat/browser lain. Sesi ini telah diakhiri untuk keamanan.'
      });
    }

    return NextResponse.json({
      valid: true,
      credits: user?.credits || 0
    });
  } catch (error: any) {
    return NextResponse.json({ valid: true }, { status: 200 });
  }
}

import { NextResponse } from 'next/server';
import { verifyUserSession, getStore } from '../../../../lib/dataStore';
import { pool, initDatabase } from '../../../../lib/db';
import { User } from '../../../../types';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
  activeSessionId: string | null;
  credits: number;
}

export async function POST(request: Request) {
  try {
    const { userId, sessionId, activity } = await request.json();

    if (!userId || !sessionId) {
      return NextResponse.json({ valid: true });
    }

    const nowStr = Date.now().toString();

    // 1. Check in MySQL database first
    try {
      await initDatabase();
      const [rows] = await pool.query<UserRow[]>(
        'SELECT id, activeSessionId, credits FROM users WHERE id = ?',
        [userId]
      );
      if (rows && rows.length > 0) {
        const dbUser = rows[0];
        // If MySQL has activeSessionId and it doesn't match client's sessionId, it's invalid!
        if (dbUser.activeSessionId && dbUser.activeSessionId !== sessionId) {
          return NextResponse.json({
            valid: false,
            reason: 'ACCOUNT_LOGGED_IN_ELSEWHERE',
            message: 'Akun Anda telah diakses melalui perangkat/browser lain. Sesi ini telah diakhiri untuk keamanan.'
          });
        }

        // Update lastActiveAt and currentActivity in MySQL
        pool.query(
          'UPDATE users SET lastActiveAt = ?, currentActivity = ?, activeSessionId = ? WHERE id = ?',
          [nowStr, activity ? JSON.stringify(activity) : null, sessionId, userId]
        ).catch(() => {});

        // Sync memory store
        const store = getStore();
        const storeUser = store.users.find((u: User) => u.id === userId);
        if (storeUser) {
          storeUser.activeSessionId = sessionId;
          storeUser.lastActiveAt = nowStr;
          storeUser.currentActivity = activity || null;
        }

        return NextResponse.json({
          valid: true,
          credits: dbUser.credits || 0
        });
      }
    } catch (dbErr) {
      console.warn('MySQL session check fallback to memory store:', dbErr);
    }

    // 2. Fallback to memory store check
    const isValid = verifyUserSession(userId, sessionId);
    const store = getStore();
    const user = store.users.find((u: User) => u.id === userId);

    if (user && isValid) {
      user.lastActiveAt = nowStr;
      user.currentActivity = activity || null;
      user.activeSessionId = sessionId;
    }

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
  } catch {
    return NextResponse.json({ valid: true }, { status: 200 });
  }
}

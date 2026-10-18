import { NextResponse } from 'next/server';
import { kickUserSession } from '../../../../lib/dataStore';
import { pool } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (userId) {
      kickUserSession(userId);
      try {
        await pool.query('UPDATE users SET activeSessionId = NULL WHERE id = ?', [userId]);
      } catch (err) {
        console.warn('MySQL logout session clear fallback:', err);
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User } from '@/types';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  subscriptionExpiresAt: string | null;
  credits: number;
  facePhotoUrl: string | null;
  registrationNumber: string;
  nationality: string;
  dateOfBirth: string;
  sex: string;
  activeSessionId: string | null;
  lastActiveAt: string | null;
}

// POST: Restore user session upon page refresh
export async function POST(request: Request) {
  try {
    await initDatabase();
    const { userId, sessionId } = await request.json();

    if (!userId || !sessionId) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 400 });
    }

    let user: User | null = null;

    // 1. Check in MySQL
    try {
      const [rows] = await pool.query<UserRow[]>(
        'SELECT id, name, email, role, subscriptionExpiresAt, credits, facePhotoUrl, registrationNumber, nationality, dateOfBirth, sex, activeSessionId, lastActiveAt FROM users WHERE id = ?',
        [userId]
      );
      if (rows && rows.length > 0) {
        const u = rows[0];
        // If there is an active session in DB and it doesn't match client sessionId, reject
        if (u.activeSessionId && u.activeSessionId !== sessionId) {
          return NextResponse.json({
            success: false,
            locked: true,
            message: 'Akun Anda telah diakses di perangkat lain.'
          }, { status: 401 });
        }

        // If activeSessionId is null or matches, update/affirm session
        if (!u.activeSessionId) {
          await pool.query('UPDATE users SET activeSessionId = ?, lastActiveAt = ? WHERE id = ?', [
            sessionId,
            new Date().toISOString(),
            userId
          ]);
        }

        user = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          subscriptionExpiresAt: u.subscriptionExpiresAt,
          credits: u.credits,
          facePhotoUrl: u.facePhotoUrl || undefined,
          registrationNumber: u.registrationNumber,
          nationality: u.nationality,
          dateOfBirth: u.dateOfBirth,
          sex: u.sex,
          activeSessionId: sessionId,
          lastActiveAt: u.lastActiveAt || undefined
        };

        // Sync with memory store
        const store = getStore();
        const storeIdx = store.users.findIndex((su) => su.id === userId);
        if (storeIdx !== -1) {
          store.users[storeIdx] = { ...store.users[storeIdx], ...user };
        } else {
          store.users.push(user);
        }
      }
    } catch (err) {
      console.warn('MySQL restore session fallback:', err);
    }

    // 2. Fallback to store
    if (!user) {
      const store = getStore();
      const storeUser = store.users.find((u) => u.id === userId);
      if (storeUser) {
        if (storeUser.activeSessionId && storeUser.activeSessionId !== sessionId) {
          return NextResponse.json({
            success: false,
            locked: true,
            message: 'Akun Anda telah diakses di perangkat lain.'
          }, { status: 401 });
        }
        storeUser.activeSessionId = sessionId;
        user = storeUser;
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      sessionId
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

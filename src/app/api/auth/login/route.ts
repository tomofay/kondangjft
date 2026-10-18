import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getStore, registerUserSession } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User } from '@/types';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password?: string;
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

export async function POST(request: Request) {
  try {
    await initDatabase();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password harus diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Try finding in MySQL
    let user: User | null = null;
    try {
      const [rows] = await pool.query<UserRow[]>(
        'SELECT * FROM users WHERE LOWER(email) = ?',
        [cleanEmail]
      );
      if (rows && rows.length > 0) {
        const u = rows[0];
        // Validate password with bcrypt (or plain text fallback for initial seeds)
        let isMatch = false;
        if (u.password) {
          if (u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$')) {
            isMatch = await bcrypt.compare(cleanPassword, u.password);
          } else {
            isMatch = u.password === cleanPassword;
          }
        }
        if (!isMatch) {
          return NextResponse.json(
            { success: false, message: 'Password salah. Silakan coba lagi.' },
            { status: 401 }
          );
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
          activeSessionId: u.activeSessionId || undefined,
          lastActiveAt: u.lastActiveAt || undefined
        };
      }
    } catch (dbErr) {
      console.warn('MySQL auth check fallback to store:', dbErr);
    }

    // 2. Fallback to in-memory store
    if (!user) {
      const store = getStore();
      const storeUser = store.users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );
      if (storeUser) {
        let isMatch = false;
        if (storeUser.password) {
          if (storeUser.password.startsWith('$2a$') || storeUser.password.startsWith('$2b$') || storeUser.password.startsWith('$2y$')) {
            isMatch = await bcrypt.compare(cleanPassword, storeUser.password);
          } else {
            isMatch = storeUser.password === cleanPassword;
          }
        }
        if (!isMatch) {
          return NextResponse.json(
            { success: false, message: 'Password salah. Silakan coba lagi.' },
            { status: 401 }
          );
        }
        user = storeUser;
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun dengan email ini tidak terdaftar. Gunakan salah satu akun dummy yang tersedia.'
        },
        { status: 404 }
      );
    }

    // Register single session token on server
    const { sessionId } = registerUserSession(user.id);
    user.activeSessionId = sessionId;

    // Update session token in MySQL
    try {
      await pool.query(
        'UPDATE users SET activeSessionId = ?, lastActiveAt = ? WHERE id = ?',
        [sessionId, new Date().toISOString(), user.id]
      );
    } catch (err) {
      console.warn('Could not update activeSessionId in MySQL:', err);
    }

    return NextResponse.json({
      success: true,
      user,
      sessionId,
      message: 'Login berhasil! Sesi tunggal aktif.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

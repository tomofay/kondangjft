import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getStore, registerUserSession } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { User } from '@/types';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap, email, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // 1. Check if email already exists in MySQL
    try {
      const [existing] = await pool.query<UserRow[]>(
        'SELECT id FROM users WHERE LOWER(email) = ?',
        [cleanEmail]
      );
      if (existing && existing.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email sudah terdaftar. Silakan login.' },
          { status: 409 }
        );
      }
    } catch (err) {
      console.warn('MySQL signup check fallback:', err);
    }

    // Check in-memory store
    const store = getStore();
    if (store.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // Create new user with 0 days active (subscriptionExpiresAt = null / expired)
    const newUserId = 'u_' + Date.now();
    const regNo = 'JFT-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    const newUser: User = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'user',
      subscriptionExpiresAt: null, // 0 Hari masa aktif - harus bayar paket dulu untuk kerjakan soal
      credits: 0,
      facePhotoUrl: '',
      registrationNumber: regNo,
      nationality: 'INDONESIA',
      dateOfBirth: '2001/01/01',
      sex: 'MALE',
      activeSessionId: undefined,
      lastActiveAt: new Date().toISOString()
    };

    // Save to store
    store.users.push(newUser);

    // Persist to MySQL
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, password, role, subscriptionExpiresAt, credits, facePhotoUrl, registrationNumber, nationality, dateOfBirth, sex)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newUser.id,
          newUser.name,
          newUser.email,
          hashedPassword,
          newUser.role,
          null,
          0,
          '',
          newUser.registrationNumber,
          newUser.nationality,
          newUser.dateOfBirth,
          newUser.sex
        ]
      );
    } catch (err) {
      console.warn('MySQL insert new user error:', err);
    }

    // Register active session for instant login
    const { sessionId } = registerUserSession(newUser.id);
    newUser.activeSessionId = sessionId;

    return NextResponse.json({
      success: true,
      user: newUser,
      sessionId,
      message: 'Pendaftaran akun berhasil! Silakan pilih paket untuk mengaktifkan akses CBT.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

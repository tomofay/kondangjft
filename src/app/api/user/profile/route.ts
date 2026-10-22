import { NextResponse } from 'next/server';
import { pool, initDatabase } from '@/lib/db';
import { getStore } from '@/lib/dataStore';
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

export async function GET(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'u_1';

    // Try reading from MySQL
    try {
      const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
      if (rows && rows.length > 0) {
        const u = rows[0];
        const user: User = {
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
        return NextResponse.json({ success: true, user, source: 'mysql' });
      }
    } catch (dbErr) {
      console.warn('MySQL fetch fallback to store:', dbErr);
    }

    // Fallback to in-memory store
    const store = getStore();
    const user = store.users.find((u) => u.id === userId) || store.users[0];
    return NextResponse.json({ success: true, user, source: 'store' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const {
      id,
      name,
      registrationNumber,
      nationality,
      dateOfBirth,
      sex,
      facePhotoUrl
    } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, message: 'ID dan Nama harus diisi' }, { status: 400 });
    }

    // 1. Update In-Memory Store
    const store = getStore();
    const userIndex = store.users.findIndex((u) => u.id === id);
    let updatedUser: User;

    if (userIndex !== -1) {
      store.users[userIndex] = {
        ...store.users[userIndex],
        name: name.trim(),
        registrationNumber: registrationNumber ? registrationNumber.trim() : store.users[userIndex].registrationNumber,
        nationality: nationality ? nationality.trim() : store.users[userIndex].nationality,
        dateOfBirth: dateOfBirth ? dateOfBirth.trim() : store.users[userIndex].dateOfBirth,
        sex: sex ? sex.trim() : store.users[userIndex].sex,
        facePhotoUrl: facePhotoUrl !== undefined ? facePhotoUrl : store.users[userIndex].facePhotoUrl
      };
      updatedUser = store.users[userIndex];
    } else {
      updatedUser = {
        id,
        name: name.trim(),
        email: body.email || 'peserta@kondang.com',
        role: 'user',
        registrationNumber: registrationNumber ? registrationNumber.trim() : 'JFT-2026-88912',
        nationality: nationality ? nationality.trim() : 'INDONESIA',
        dateOfBirth: dateOfBirth ? dateOfBirth.trim() : '2001/05/14',
        sex: sex ? sex.trim() : 'MALE',
        facePhotoUrl
      };
      store.users.push(updatedUser);
    }

    // Also update examinee info in previous examResults for this user so current certificate reflects changes immediately
    store.examResults.forEach((res) => {
      if (res.userId === id) {
        res.userName = updatedUser.name;
        res.registrationNumber = updatedUser.registrationNumber;
        res.nationality = updatedUser.nationality;
        res.dateOfBirth = updatedUser.dateOfBirth;
        res.sex = updatedUser.sex;
        res.facePhotoUrl = updatedUser.facePhotoUrl;
      }
    });

    // 2. Persist to MySQL db_kondangsensei
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, role, subscriptionExpiresAt, credits, facePhotoUrl, registrationNumber, nationality, dateOfBirth, sex)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           registrationNumber = VALUES(registrationNumber),
           nationality = VALUES(nationality),
           dateOfBirth = VALUES(dateOfBirth),
           sex = VALUES(sex),
           facePhotoUrl = VALUES(facePhotoUrl);`,
        [
          updatedUser.id,
          updatedUser.name,
          updatedUser.email,
          updatedUser.role,
          updatedUser.subscriptionExpiresAt || null,
          updatedUser.credits || 99,
          updatedUser.facePhotoUrl || null,
          updatedUser.registrationNumber,
          updatedUser.nationality,
          updatedUser.dateOfBirth,
          updatedUser.sex
        ]
      );

      // Also update existing exam_results in MySQL if any
      await pool.query(
        `UPDATE exam_results
         SET userName = ?, registrationNumber = ?
         WHERE userId = ?;`,
        [updatedUser.name, updatedUser.registrationNumber, updatedUser.id]
      );
    } catch (dbErr) {
      console.warn('Could not persist user update to MySQL, updated in store only:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profil peserta dan data sertifikat berhasil diperbarui!',
      user: updatedUser
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

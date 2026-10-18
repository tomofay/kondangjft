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
  createdAt: string;
}

// GET: Fetch all registered users from MySQL database (with memory store sync)
export async function GET() {
  try {
    await initDatabase();
    const store = getStore();

    let dbUsers: User[] = [];
    try {
      const [rows] = await pool.query<UserRow[]>(
        'SELECT id, name, email, role, subscriptionExpiresAt, credits, facePhotoUrl, registrationNumber, nationality, dateOfBirth, sex, activeSessionId, lastActiveAt, createdAt FROM users ORDER BY createdAt DESC'
      );
      if (rows && rows.length > 0) {
        dbUsers = rows.map((u) => ({
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
        }));

        // Keep in-memory store synchronized with DB users
        for (const dbUser of dbUsers) {
          const idx = store.users.findIndex((su) => su.id === dbUser.id || su.email.toLowerCase() === dbUser.email.toLowerCase());
          if (idx !== -1) {
            store.users[idx] = { ...store.users[idx], ...dbUser };
          } else {
            store.users.push(dbUser);
          }
        }
      }
    } catch (err) {
      console.warn('MySQL admin users fetch error, falling back to memory store:', err);
    }

    // If DB returned users, return dbUsers. Otherwise return store.users
    const finalUsers = dbUsers.length > 0 ? dbUsers : store.users;

    return NextResponse.json({
      success: true,
      users: finalUsers
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST: Perform user admin actions (kick session, add subscription days, change role, delete user)
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { action, userId, days, role } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: 'action and userId are required' },
        { status: 400 }
      );
    }

    const store = getStore();
    const storeUser = store.users.find((u) => u.id === userId);

    if (action === 'kick') {
      // 1. Clear activeSessionId in MySQL
      try {
        await pool.query('UPDATE users SET activeSessionId = NULL WHERE id = ?', [userId]);
      } catch (err) {
        console.warn('MySQL kick session update error:', err);
      }
      // 2. Clear in memory store
      if (storeUser) {
        storeUser.activeSessionId = undefined;
      }

      return NextResponse.json({
        success: true,
        message: 'Sesi aktif berhasil di-kick (perangkat dikeluarkan).'
      });
    }

    if (action === 'add_subscription') {
      const addDays = Number(days) || 7;
      let newExpiryIso: string;

      // Check current subscription expiry from DB or store
      try {
        const [rows] = await pool.query<UserRow[]>(
          'SELECT subscriptionExpiresAt FROM users WHERE id = ?',
          [userId]
        );
        const currentExp = rows?.[0]?.subscriptionExpiresAt;
        const baseTime = currentExp && new Date(currentExp).getTime() > Date.now()
          ? new Date(currentExp).getTime()
          : Date.now();
        newExpiryIso = new Date(baseTime + addDays * 86400000).toISOString();

        await pool.query(
          'UPDATE users SET subscriptionExpiresAt = ? WHERE id = ?',
          [newExpiryIso, userId]
        );
      } catch (err) {
        console.warn('MySQL add subscription error, fallback:', err);
        const baseTime = storeUser?.subscriptionExpiresAt && new Date(storeUser.subscriptionExpiresAt).getTime() > Date.now()
          ? new Date(storeUser.subscriptionExpiresAt).getTime()
          : Date.now();
        newExpiryIso = new Date(baseTime + addDays * 86400000).toISOString();
      }

      if (storeUser) {
        storeUser.subscriptionExpiresAt = newExpiryIso;
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan ${addDays} hari masa aktif.`,
        subscriptionExpiresAt: newExpiryIso
      });
    }

    if (action === 'change_role') {
      const targetRole = role === 'admin' ? 'admin' : 'user';
      try {
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [targetRole, userId]);
      } catch (err) {
        console.warn('MySQL change role error:', err);
      }
      if (storeUser) {
        storeUser.role = targetRole;
      }

      return NextResponse.json({
        success: true,
        message: `Role berhasil diubah menjadi ${targetRole}.`,
        role: targetRole
      });
    }

    if (action === 'delete') {
      try {
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      } catch (err) {
        console.warn('MySQL delete user error:', err);
      }
      const storeIdx = store.users.findIndex((u) => u.id === userId);
      if (storeIdx !== -1) {
        store.users.splice(storeIdx, 1);
      }

      return NextResponse.json({
        success: true,
        message: 'Pengguna berhasil dihapus dari sistem.'
      });
    }

    return NextResponse.json(
      { success: false, message: `Aksi ${action} tidak dikenali.` },
      { status: 400 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

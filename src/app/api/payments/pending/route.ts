import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { Transaction } from '@/types';
import { RowDataPacket } from 'mysql2';

interface TxRow extends RowDataPacket {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  amount: number;
  paymentMethod: string;
  paymentCode: string | null;
  howToPayUrl: string | null;
  expiredAt: string | null;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  createdAt: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID wajib diisi' }, { status: 400 });
    }

    const now = Date.now();
    const store = getStore();

    // 1. Auto-cancel / Auto-expire transaksi yang sudah lebih dari 1 jam (60 menit)
    try {
      const [allPending] = await pool.query<TxRow[]>(
        'SELECT id, createdAt, expiredAt FROM transactions WHERE userId = ? AND status = "PENDING"',
        [userId]
      );
      if (allPending && allPending.length > 0) {
        const expiredIds: string[] = [];
        for (const row of allPending) {
          const ageMs = now - new Date(row.createdAt).getTime();
          const isPastExpiry = row.expiredAt ? new Date(row.expiredAt).getTime() <= now : false;
          if (ageMs >= 60 * 60 * 1000 || isPastExpiry) {
            expiredIds.push(row.id);
          }
        }
        if (expiredIds.length > 0) {
          const placeholders = expiredIds.map(() => '?').join(',');
          await pool.query(
            `UPDATE transactions SET status = 'EXPIRED' WHERE id IN (${placeholders})`,
            expiredIds
          );
        }
      }
    } catch (err) {
      console.warn('Auto expire query fallback:', err);
    }

    // Update memory store expiry as well
    for (const tx of store.transactions) {
      if (tx.userId === userId && tx.status === 'PENDING') {
        const txAgeMs = now - new Date(tx.createdAt).getTime();
        const isPastExpiry = tx.expiredAt ? new Date(tx.expiredAt).getTime() <= now : false;
        if (txAgeMs >= 60 * 60 * 1000 || isPastExpiry) {
          tx.status = 'FAILED';
        }
      }
    }

    let pendingTransactions: Transaction[] = [];

    // 2. Fetch pending from MySQL
    try {
      const [rows] = await pool.query<TxRow[]>(
        'SELECT * FROM transactions WHERE userId = ? AND status = "PENDING" ORDER BY createdAt DESC',
        [userId]
      );
      if (rows && rows.length > 0) {
        pendingTransactions = rows
          .filter((r) => {
            const ageMs = now - new Date(r.createdAt).getTime();
            return ageMs < 60 * 60 * 1000;
          })
          .map((r) => {
            const codeMatch = r.paymentMethod.match(/-\s*([0-9A-Za-z]+)$/);
            const paymentCode = r.paymentCode || (codeMatch ? codeMatch[1] : undefined);

            let exp = r.expiredAt;
            if (exp && typeof exp === 'string' && /^\d{14}$/.test(exp)) {
              const y = exp.substring(0, 4);
              const m = exp.substring(4, 6);
              const d = exp.substring(6, 8);
              const h = exp.substring(8, 10);
              const min = exp.substring(10, 12);
              const s = exp.substring(12, 14);
              const dObj = new Date(`${y}-${m}-${d}T${h}:${min}:${s}+07:00`);
              if (!isNaN(dObj.getTime())) {
                exp = dObj.toISOString();
              }
            }

            return {
              id: r.id,
              userId: r.userId,
              userName: r.userName,
              packageId: r.packageId,
              packageName: r.packageName,
              amount: r.amount,
              paymentMethod: r.paymentMethod,
              paymentCode,
              howToPayUrl: r.howToPayUrl || undefined,
              expiredAt: exp || new Date(new Date(r.createdAt).getTime() + 60 * 60 * 1000).toISOString(),
              status: r.status as 'PENDING',
              createdAt: r.createdAt
            };
          });
      }
    } catch (dbErr) {
      console.warn('MySQL pending tx fetch warning:', dbErr);
    }

    // Fallback/merge with memory store
    const storePending = store.transactions.filter(
      (t) => t.userId === userId && t.status === 'PENDING' && (now - new Date(t.createdAt).getTime() < 60 * 60 * 1000)
    );

    const map = new Map<string, Transaction>();
    for (const t of pendingTransactions) {
      map.set(t.id, t);
    }
    for (const t of storePending) {
      if (!map.has(t.id)) {
        map.set(t.id, t);
      } else {
        const existing = map.get(t.id)!;
        if (t.paymentCode) existing.paymentCode = t.paymentCode;
        if (t.howToPayUrl) existing.howToPayUrl = t.howToPayUrl;
        if (t.expiredAt) existing.expiredAt = t.expiredAt;
      }
    }

    const result = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, pendingTransactions: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

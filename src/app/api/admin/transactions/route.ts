import { NextResponse } from 'next/server';
import { pool, initDatabase } from '@/lib/db';
import { getStore } from '@/lib/dataStore';
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

// GET: Fetch all transactions from MySQL database
export async function GET() {
  try {
    await initDatabase();
    const store = getStore();

    let dbTransactions: Transaction[] = [];
    try {
      const [rows] = await pool.query<TxRow[]>(
        'SELECT id, userId, userName, packageId, packageName, amount, paymentMethod, paymentCode, howToPayUrl, expiredAt, status, createdAt FROM transactions ORDER BY createdAt DESC'
      );
      if (rows && rows.length > 0) {
        dbTransactions = rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userName: r.userName,
          packageId: r.packageId,
          packageName: r.packageName,
          amount: Number(r.amount),
          paymentMethod: r.paymentMethod,
          paymentCode: r.paymentCode || undefined,
          howToPayUrl: r.howToPayUrl || undefined,
          expiredAt: r.expiredAt || undefined,
          status: r.status,
          createdAt: r.createdAt
        }));

        // Keep in-memory store in sync
        for (const tx of dbTransactions) {
          const idx = store.transactions.findIndex((t) => t.id === tx.id);
          if (idx !== -1) {
            store.transactions[idx] = tx;
          } else {
            store.transactions.unshift(tx);
          }
        }
      }
    } catch (err) {
      console.warn('MySQL admin transactions fetch error, fallback:', err);
    }

    const finalTransactions = dbTransactions.length > 0 ? dbTransactions : store.transactions;

    return NextResponse.json({
      success: true,
      transactions: finalTransactions
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

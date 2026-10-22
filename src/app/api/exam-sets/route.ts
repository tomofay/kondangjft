import { NextResponse } from 'next/server';
import { pool, initDatabase, syncExamSetsToDatabase } from '@/lib/db';
import { getStore, EXAM_SETS } from '@/lib/dataStore';
import { ExamSet } from '@/types';
import { RowDataPacket } from 'mysql2';

interface ExamSetRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
  description: string;
  totalQuestions: number;
}

export const dynamic = 'force-dynamic';

// GET: Ambil semua daftar paket ujian dari MySQL (fallback ke memory store)
export async function GET() {
  try {
    await initDatabase();
    await syncExamSetsToDatabase();

    try {
      const [rows] = await pool.query<ExamSetRow[]>('SELECT * FROM exam_sets ORDER BY id ASC');
      if (rows && rows.length > 0) {
        const examSets: ExamSet[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          description: r.description,
          totalQuestions: r.totalQuestions
        }));
        const store = getStore();
        store.examSets = examSets;
        return NextResponse.json({ success: true, examSets });
      }
    } catch (dbErr) {
      console.warn('MySQL fetch examSets fallback:', dbErr);
    }

    const store = getStore();
    return NextResponse.json({ success: true, examSets: store.examSets || EXAM_SETS });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// POST: Buat / Perbarui Paket Ujian Baru
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const store = getStore();

    let id = Number(body.id);
    if (!id || isNaN(id)) {
      const existingIds = (store.examSets || []).map((s) => s.id);
      id = existingIds.length > 0 ? Math.max(...existingIds, 4) + 1 : 5;
    }

    const name = body.name?.trim() || `Paket Ujian #${id} (Simulasi JFT-Basic)`;
    const code = body.code?.trim() || `JFT-SET-${String.fromCharCode(64 + id)}`;
    const description = body.description?.trim() || `Paket simulasi hasil impor dokumen PDF lengkap.`;
    const totalQuestions = Number(body.totalQuestions) || 50;

    const newSet: ExamSet = { id, name, code, description, totalQuestions };

    // Simpan ke MySQL
    try {
      await pool.query(
        `INSERT INTO exam_sets (id, name, code, description, totalQuestions)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           code = VALUES(code),
           description = VALUES(description),
           totalQuestions = VALUES(totalQuestions)`,
        [newSet.id, newSet.name, newSet.code, newSet.description, newSet.totalQuestions]
      );
    } catch (dbErr) {
      console.warn('MySQL save exam_set error:', dbErr);
    }

    // Simpan ke Store
    const idx = store.examSets.findIndex((s) => s.id === id);
    if (idx !== -1) {
      store.examSets[idx] = newSet;
    } else {
      store.examSets.push(newSet);
    }

    return NextResponse.json({
      success: true,
      examSet: newSet,
      examSets: store.examSets,
      message: `Paket Ujian #${newSet.id} ('${newSet.name}') berhasil dibuat dan langsung muncul di halaman depan!`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// PUT: Update Paket Ujian (alias to POST)
export async function PUT(request: Request) {
  return POST(request);
}

// DELETE: Hapus Paket Ujian & Soal Terkait
export async function DELETE(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID paket ujian tidak valid.' },
        { status: 400 }
      );
    }

    try {
      await pool.query('DELETE FROM exam_sets WHERE id = ?', [id]);
      await pool.query('DELETE FROM questions WHERE packageId = ?', [id]);
    } catch (dbErr) {
      console.warn('MySQL delete exam_set error:', dbErr);
    }

    const store = getStore();
    store.examSets = store.examSets.filter((s) => s.id !== id);
    store.questions = store.questions.filter((q) => (q.packageId || 1) !== id);

    return NextResponse.json({
      success: true,
      examSets: store.examSets,
      message: `Paket #${id} beserta seluruh soal di dalamnya berhasil dihapus.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

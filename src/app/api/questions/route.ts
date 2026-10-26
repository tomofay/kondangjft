import { NextResponse } from 'next/server';
import { pool, initDatabase, syncQuestionsToDatabase } from '@/lib/db';
import { getStore } from '@/lib/dataStore';
import { Question } from '@/types';
import { RowDataPacket } from 'mysql2';

interface QuestionRow extends RowDataPacket {
  id: number;
  packageId: number;
  section: 'S1' | 'S2' | 'S3' | 'S4';
  sectionTitle: string;
  number: number;
  questionText: string;
  readingPassage: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  options: string | { key: string; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

// GET: Ambil semua soal dari MySQL (dengan fallback ke memory store)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packageIdParam = searchParams.get('packageId');
  const syncParam = searchParams.get('sync');

  try {
    try {
      await initDatabase();
      if (syncParam === 'true') {
        await syncQuestionsToDatabase(undefined, true);
      }
      let query = 'SELECT * FROM questions';
      const params: any[] = [];

      if (packageIdParam) {
        query += ' WHERE packageId = ?';
        params.push(Number(packageIdParam));
      }
      query += ' ORDER BY id ASC';

      const [rows] = await pool.query<QuestionRow[]>(query, params);

      if (rows && rows.length > 0) {
        const questions: Question[] = rows.map((r) => ({
          id: r.id,
          packageId: r.packageId,
          section: r.section,
          sectionTitle: r.sectionTitle,
          number: r.number,
          questionText: r.questionText,
          readingPassage: r.readingPassage || undefined,
          imageUrl: r.imageUrl || undefined,
          audioUrl: r.audioUrl || undefined,
          options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options,
          correctAnswer: r.correctAnswer,
          explanation: r.explanation
        }));

        // Also update memory store
        const store = getStore();
        if (!packageIdParam) {
          store.questions = questions;
        }

        return NextResponse.json({ success: true, questions });
      }
    } catch (dbErr) {
      console.warn('MySQL fetch questions fallback:', dbErr);
    }

    // Fallback to store
    const store = getStore();
    let questions = store.questions;
    if (packageIdParam) {
      questions = questions.filter((q) => q.packageId === Number(packageIdParam));
    }

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    const store = getStore();
    let questions = store.questions || [];
    if (packageIdParam) {
      questions = questions.filter((q) => q.packageId === Number(packageIdParam));
    }
    return NextResponse.json({ success: true, questions });
  }
}

// POST: Simpan / Perbarui / Tambah Soal (Tunggal atau Batch) ke MySQL & Memory Store
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();

    // Check if batch questions array
    const questionsToSave: Question[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.questions)
      ? body.questions
      : body && body.id
      ? [body]
      : [];

    if (questionsToSave.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data soal tidak valid atau kosong.' },
        { status: 400 }
      );
    }

    const store = getStore();

    // 1. Simpan ke MySQL (bisa single atau batch)
    try {
      for (const question of questionsToSave) {
        if (!question.id || !question.questionText || !question.correctAnswer) continue;

        await pool.query(
          `INSERT INTO questions 
           (id, packageId, section, sectionTitle, number, questionText, readingPassage, imageUrl, audioUrl, options, correctAnswer, explanation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             packageId = VALUES(packageId),
             section = VALUES(section),
             sectionTitle = VALUES(sectionTitle),
             number = VALUES(number),
             questionText = VALUES(questionText),
             readingPassage = VALUES(readingPassage),
             imageUrl = VALUES(imageUrl),
             audioUrl = VALUES(audioUrl),
             options = VALUES(options),
             correctAnswer = VALUES(correctAnswer),
             explanation = VALUES(explanation)`,
          [
            question.id,
            question.packageId || 1,
            question.section,
            question.sectionTitle,
            question.number,
            question.questionText,
            question.readingPassage || null,
            question.imageUrl || null,
            question.audioUrl || null,
            JSON.stringify(question.options),
            question.correctAnswer,
            question.explanation
          ]
        );

        // Update memory store
        const idx = store.questions.findIndex((q) => q.id === question.id);
        if (idx !== -1) {
          store.questions[idx] = question;
        } else {
          store.questions.push(question);
        }
      }
    } catch (dbErr) {
      console.warn('MySQL save questions batch error:', dbErr);
    }

    return NextResponse.json({
      success: true,
      count: questionsToSave.length,
      message: `Berhasil menyimpan ${questionsToSave.length} soal ke database MySQL.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE: Hapus Soal dari MySQL & Memory Store
export async function DELETE(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ success: false, message: 'ID soal diperlukan.' }, { status: 400 });
    }

    const questionId = Number(idParam);

    // 1. Hapus dari MySQL
    try {
      await pool.query('DELETE FROM questions WHERE id = ?', [questionId]);
    } catch (dbErr) {
      console.warn('MySQL delete question error:', dbErr);
    }

    // 2. Hapus dari memory store
    const store = getStore();
    store.questions = store.questions.filter((q) => q.id !== questionId);

    return NextResponse.json({ success: true, message: 'Soal berhasil dihapus dari database MySQL.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

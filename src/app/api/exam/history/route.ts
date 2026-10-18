import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { ExamResult } from '@/types';
import { RowDataPacket } from 'mysql2';

interface ExamResultRow extends RowDataPacket {
  id: string;
  userId: string;
  userName: string;
  registrationNumber: string;
  testDate: string;
  testLocation: string;
  totalScore: number;
  assessmentResult: string;
  isPassed: number | boolean;
  sectionScores: string | object;
  answers: string | object;
  totalTimeSpentSeconds: number;
}

export async function GET(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Parameter userId wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Try fetching from MySQL
    try {
      const [rows] = await pool.query<ExamResultRow[]>(
        'SELECT * FROM exam_results WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );

      if (rows && rows.length > 0) {
        const results: ExamResult[] = rows.map((r) => {
          let sectionScores = r.sectionScores;
          if (typeof sectionScores === 'string') {
            try {
              sectionScores = JSON.parse(sectionScores);
            } catch {
              sectionScores = { S1: 0, S2: 0, S3: 0, S4: 0 };
            }
          }

          let answers = r.answers;
          if (typeof answers === 'string') {
            try {
              answers = JSON.parse(answers);
            } catch {
              answers = [];
            }
          }

          return {
            id: r.id,
            userId: r.userId,
            userName: r.userName,
            registrationNumber: r.registrationNumber,
            testDate: r.testDate,
            testLocation: r.testLocation,
            totalScore: r.totalScore,
            assessmentResult: r.assessmentResult as ExamResult['assessmentResult'],
            isPassed: Boolean(r.isPassed),
            sectionScores: sectionScores as any,
            answers: answers as any,
            totalTimeSpentSeconds: r.totalTimeSpentSeconds
          };
        });

        return NextResponse.json({
          success: true,
          results,
          source: 'mysql'
        });
      }
    } catch (dbErr) {
      console.warn('MySQL exam history fetch fallback to store:', dbErr);
    }

    // 2. Fallback to in-memory store filtered by userId
    const store = getStore();
    const userResults = store.examResults.filter((r) => r.userId === userId);

    return NextResponse.json({
      success: true,
      results: userResults,
      source: 'store'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

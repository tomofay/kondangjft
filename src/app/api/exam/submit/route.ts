import { NextResponse } from 'next/server';
import { getStore, calculateJFTScore } from '../../../../lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { ExamResult, User } from '../../../../types';

export async function POST(request: Request) {
  try {
    await initDatabase();
    const { userId, answers, timeSpentSeconds } = await request.json();
    const store = getStore();

    const user = store.users.find((u: User) => u.id === userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Verify active subscription (unlimited tryouts during active period)
    const isSubActive = user.role === 'admin' || (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > Date.now());
    if (!isSubActive) {
      return NextResponse.json({ success: false, message: 'Masa aktif langganan Anda telah habis. Silakan perpanjang paket.' }, { status: 403 });
    }

    const { totalScore, assessmentResult, isPassed, sectionScores } = calculateJFTScore(answers);

    const examResult: ExamResult = {
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.id,
      userName: user.name,
      registrationNumber: user.registrationNumber || 'JFT-2026-88912',
      nationality: user.nationality || 'INDONESIA',
      dateOfBirth: user.dateOfBirth || '2001/05/14',
      sex: user.sex || 'MALE',
      facePhotoUrl: user.facePhotoUrl,
      testDate: new Date().toISOString().split('T')[0],
      testLocation: 'CBT Online Simulator',
      totalScore,
      assessmentResult,
      isPassed,
      sectionScores,
      answers,
      totalTimeSpentSeconds: timeSpentSeconds || 3600
    };

    store.examResults.unshift(examResult);

    // Save to MySQL db_kondangsensei
    try {
      await pool.query(
        `INSERT INTO exam_results (id, userId, userName, registrationNumber, testDate, testLocation, totalScore, assessmentResult, isPassed, sectionScores, answers, totalTimeSpentSeconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          examResult.id,
          examResult.userId,
          examResult.userName,
          examResult.registrationNumber,
          examResult.testDate,
          examResult.testLocation,
          examResult.totalScore,
          examResult.assessmentResult,
          examResult.isPassed ? 1 : 0,
          JSON.stringify(examResult.sectionScores),
          JSON.stringify(examResult.answers),
          examResult.totalTimeSpentSeconds
        ]
      );
    } catch (dbErr) {
      console.warn('Could not save exam result to MySQL:', dbErr);
    }

    return NextResponse.json({
      success: true,
      result: examResult,
      remainingCredits: user.credits
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

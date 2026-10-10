import { NextResponse } from 'next/server';
import { getStore, calculateJFTScore } from '../../../../lib/dataStore';
import { ExamResult, User } from '../../../../types';

export async function POST(request: Request) {
  try {
    const { userId, answers, timeSpentSeconds } = await request.json();
    const store = getStore();

    const user = store.users.find((u: User) => u.id === userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Deduct 1 credit if not admin
    if (user.role !== 'admin' && user.credits > 0) {
      user.credits = Math.max(0, user.credits - 1);
    }

    const { totalScore, assessmentResult, isPassed, sectionScores } = calculateJFTScore(answers);

    const examResult: ExamResult = {
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.id,
      userName: user.name,
      registrationNumber: user.registrationNumber || 'JFT-2026-88912',
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

    return NextResponse.json({
      success: true,
      result: examResult,
      remainingCredits: user.credits
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

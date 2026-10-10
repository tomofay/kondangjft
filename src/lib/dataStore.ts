import { User, ExamResult, Transaction, TryoutPackage, Question, PDFQuestionDraft, UserAnswer } from '../types';
import { JFT_QUESTIONS_BANK } from './jftQuestions';

declare global {
  var __kondangStore: {
    users: User[];
    questions: Question[];
    examResults: ExamResult[];
    packages: TryoutPackage[];
    transactions: Transaction[];
    pdfDrafts: PDFQuestionDraft[];
  } | undefined;
}

// In-Memory Global State (persisted across request handlers in Next.js Node process)
globalThis.__kondangStore = globalThis.__kondangStore || {
  users: [
    {
      id: 'u_1',
      name: 'Budi Pratama',
      email: 'peserta@kondang.com',
      role: 'user',
      credits: 3,
      facePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      registrationNumber: 'JFT-2026-88912',
      nationality: 'Indonesia',
      dateOfBirth: '2001/05/14',
      sex: 'Male',
      activeSessionId: undefined,
      lastActiveAt: new Date().toISOString()
    },
    {
      id: 'u_admin',
      name: 'Super Admin Kondang',
      email: 'admin@kondang.com',
      role: 'admin',
      credits: 999,
      facePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      registrationNumber: 'ADM-2026-00001',
      nationality: 'Indonesia',
      dateOfBirth: '1995/10/20',
      sex: 'Male',
      activeSessionId: undefined,
      lastActiveAt: new Date().toISOString()
    }
  ],

  questions: [...JFT_QUESTIONS_BANK],

  examResults: [],

  packages: [
    {
      id: 'pkg_1',
      name: 'Paket Single Tryout',
      description: 'Akses 1x Simulasi Ujian JFT-Basic 50 Soal Lengkap + Pembahasan & Rapor Resmi',
      tryoutCount: 1,
      price: 35000,
      popular: false
    },
    {
      id: 'pkg_3',
      name: 'Paket Intensive 3x',
      description: 'Akses 3x Simulasi Ujian JFT-Basic + Pembahasan Detail + Grafik Perkembangan',
      tryoutCount: 3,
      price: 90000,
      popular: true
    },
    {
      id: 'pkg_unlimited',
      name: 'Paket VIP Master 30 Hari',
      description: 'Akses Tanpa Batas (Unlimited Tryout) Selama 1 Bulan + Bank Soal PDF Parser',
      tryoutCount: 99,
      price: 199000,
      popular: false
    }
  ],

  transactions: [
    {
      id: 'tx_init_101',
      userId: 'u_1',
      userName: 'Budi Pratama',
      packageId: 'pkg_3',
      packageName: 'Paket Intensive 3x',
      amount: 90000,
      paymentMethod: 'QRIS Instant',
      status: 'PAID',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],

  pdfDrafts: []
};

export const getStore = () => globalThis.__kondangStore!;

// Single Session Manager Utilities
export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export function registerUserSession(userId: string): { user: User; sessionId: string } {
  const store = getStore();
  const user = store.users.find((u: User) => u.id === userId);
  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  const newSessionId = generateSessionId();
  user.activeSessionId = newSessionId;
  user.lastActiveAt = new Date().toISOString();

  return { user, sessionId: newSessionId };
}

export function verifyUserSession(userId: string, clientSessionId: string): boolean {
  const store = getStore();
  const user = store.users.find((u: User) => u.id === userId);
  if (!user) return false;

  // Verify that current client's session ID matches active session on server
  if (!user.activeSessionId) return true; // If no session locked yet
  return user.activeSessionId === clientSessionId;
}

export function kickUserSession(userId: string): void {
  const store = getStore();
  const user = store.users.find((u: User) => u.id === userId);
  if (user) {
    user.activeSessionId = undefined;
  }
}

// Exam & Scoring Algorithm (JFT Standard 10 - 250 Score Mapping)
export function calculateJFTScore(userAnswers: { questionId: number; selectedOption: 'A' | 'B' | 'C' | 'D' | null }[]): {
  totalScore: number;
  assessmentResult: 'A1' | 'A2.1' | 'A2.2' | 'Tidak Lulus (Below A1)';
  isPassed: boolean;
  sectionScores: ExamResult['sectionScores'];
} {
  const store = getStore();
  const questions = store.questions;

  let s1Correct = 0, s1Total = 0;
  let s2Correct = 0, s2Total = 0;
  let s3Correct = 0, s3Total = 0;
  let s4Correct = 0, s4Total = 0;

  questions.forEach((q: Question) => {
    const ua = userAnswers.find((a) => a.questionId === q.id);
    const isCorrect = ua ? ua.selectedOption === q.correctAnswer : false;

    if (q.section === 'S1') {
      s1Total++;
      if (isCorrect) s1Correct++;
    } else if (q.section === 'S2') {
      s2Total++;
      if (isCorrect) s2Correct++;
    } else if (q.section === 'S3') {
      s3Total++;
      if (isCorrect) s3Correct++;
    } else if (q.section === 'S4') {
      s4Total++;
      if (isCorrect) s4Correct++;
    }
  });

  const totalCorrect = s1Correct + s2Correct + s3Correct + s4Correct;
  const totalQuestions = questions.length || 50;
  const rawRatio = totalCorrect / totalQuestions;

  // JFT official score range is 10 - 250.
  // Passing score A1 is 145, A2.1 is 175, A2.2 is 200.
  const totalScore = Math.round(10 + rawRatio * 240);

  let assessmentResult: ExamResult['assessmentResult'] = 'Tidak Lulus (Below A1)';
  let isPassed = false;

  if (totalScore >= 200) {
    assessmentResult = 'A2.2';
    isPassed = true;
  } else if (totalScore >= 175) {
    assessmentResult = 'A2.1';
    isPassed = true;
  } else if (totalScore >= 145) {
    assessmentResult = 'A1';
    isPassed = true;
  }

  const calcSec = (correct: number, max: number) => ({
    score: correct,
    maxScore: max,
    percentage: max > 0 ? Math.round((correct / max) * 100) : 0
  });

  return {
    totalScore,
    assessmentResult,
    isPassed,
    sectionScores: {
      S1: calcSec(s1Correct, s1Total),
      S2: calcSec(s2Correct, s2Total),
      S3: calcSec(s3Correct, s3Total),
      S4: calcSec(s4Correct, s4Total)
    }
  };
}

// PDF Parser Helper for Question Extraction
export function parsePdfTextToQuestions(pdfText: string): PDFQuestionDraft[] {
  const blocks = pdfText.split(/(?=Soal\s*\d+|Q\d+|\[S[1-4]\])/i);
  const drafts: PDFQuestionDraft[] = [];

  blocks.forEach((block, idx) => {
    if (!block.trim()) return;

    let section: Question['section'] = 'S1';
    if (/Chokai|聴解|S3/i.test(block)) section = 'S3';
    else if (/Kaiwa|会話|S2/i.test(block)) section = 'S2';
    else if (/Dokkai|読解|S4/i.test(block)) section = 'S4';

    // Extract options
    const optA = block.match(/A[\.\:\)]\s*([^\n\r]+)/i)?.[1]?.trim() || 'Opsi A';
    const optB = block.match(/B[\.\:\)]\s*([^\n\r]+)/i)?.[1]?.trim() || 'Opsi B';
    const optC = block.match(/C[\.\:\)]\s*([^\n\r]+)/i)?.[1]?.trim() || 'Opsi C';
    const optD = block.match(/D[\.\:\)]\s*([^\n\r]+)/i)?.[1]?.trim() || 'Opsi D';

    const correctMatch = block.match(/(?:Kunci|Jawaban|Correct)\s*[\:\=]\s*([A-D])/i);
    const correctAnswer = (correctMatch?.[1]?.toUpperCase() ?? 'A') as 'A' | 'B' | 'C' | 'D';

    const explanationMatch = block.match(/(?:Pembahasan|Penjelasan|Insight)\s*[\:\=]\s*([^\n\r]+)/i);
    const explanation = explanationMatch?.[1]?.trim() || 'Pembahasan draf dari impor PDF.';

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const questionText = lines[0] || `Pertanyaan draf #${idx + 1}`;

    drafts.push({
      id: 'draft_' + Math.random().toString(36).substring(2, 9),
      rawText: block,
      section,
      questionText,
      options: [
        { key: 'A', text: optA },
        { key: 'B', text: optB },
        { key: 'C', text: optC },
        { key: 'D', text: optD }
      ],
      correctAnswer,
      explanation,
      status: 'DRAFT'
    });
  });

  return drafts;
}

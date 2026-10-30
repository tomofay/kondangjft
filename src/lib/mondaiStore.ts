/**
 * Mondai Timed Evaluation Engine & Bab Gating Store (M9)
 * Handles timed exams, auto-grading calculations, remedial guidance, and chapter gating unlock.
 */

export interface MondaiOption {
  id: string;
  text: string;
}

export interface MondaiQuestion {
  id: string;
  test_id: string;
  question_number: number;
  question_text: string;
  options: MondaiOption[];
  correct_option_id: string;
  explanation_text: string;
}

export interface MondaiTest {
  id: string;
  chapter_id: number;
  title: string;
  duration_minutes: number;
  passing_grade_percent: number;
  total_questions: number;
  questions: MondaiQuestion[];
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface MondaiAttempt {
  id: string;
  userId: string;
  chapterId: number;
  scorePercent: number;
  isPassed: boolean;
  startedAt: string;
  finishedAt: string;
  answers: UserAnswer[];
}

// Seed 10 Mondai Questions for Chapter 1 with 'A' as correct answer for testing
export const CHAPTER_1_QUESTIONS: MondaiQuestion[] = [
  {
    id: 'mon_q_ch1_1',
    test_id: 'mon_test_ch1',
    question_number: 1,
    question_text: 'Pilihlah partikel yang tepat: わたし [ ... ] 学生 です。',
    options: [
      { id: 'A', text: 'は (wa)' },
      { id: 'B', text: 'を (o)' },
      { id: 'C', text: 'に (ni)' },
      { id: 'D', text: 'で (de)' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Partikel は (wa) digunakan sebagai penanda topik kalimat.'
  },
  {
    id: 'mon_q_ch1_2',
    test_id: 'mon_test_ch1',
    question_number: 2,
    question_text: 'Bentuk negatif sopan dari "学生 です" adalah...',
    options: [
      { id: 'A', text: '学生 じゃありません' },
      { id: 'B', text: '学生 でした' },
      { id: 'C', text: '学生 ですか' },
      { id: 'D', text: '学生 くない' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Bentuk negatif formal dari desu adalah ja arimasen atau dewa arimasen.'
  },
  {
    id: 'mon_q_ch1_3',
    test_id: 'mon_test_ch1',
    question_number: 3,
    question_text: 'Arti dari kalimat "はじめまして" adalah...',
    options: [
      { id: 'A', text: 'Salam kenal / Pertama kali bertemu' },
      { id: 'B', text: 'Selamat tinggal' },
      { id: 'C', text: 'Terima kasih banyak' },
      { id: 'D', text: 'Sama-sama' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Hajimemashite diucapkan saat pertama kali berkenalan.'
  },
  {
    id: 'mon_q_ch1_4',
    test_id: 'mon_test_ch1',
    question_number: 4,
    question_text: 'Pilihlah ungkapan tanya identitas yang sopan: あの 方 は [ ... ] ですか。',
    options: [
      { id: 'A', text: 'どなた' },
      { id: 'B', text: 'だれ' },
      { id: 'C', text: 'なん' },
      { id: 'D', text: 'どこ' },
    ],
    correct_option_id: 'A',
    explanation_text: 'Donata adalah bentuk sopan (sonkeigo) dari dare (siapa).'
  },
  {
    id: 'mon_q_ch1_5',
    test_id: 'mon_test_ch1',
    question_number: 5,
    question_text: 'Sufiks panggilan yang sopan untuk menyebut nama orang lain adalah...',
    options: [
      { id: 'A', text: '～さん (~san)' },
      { id: 'B', text: '～くん (~kun)' },
      { id: 'C', text: '～ちゃん (~chan)' },
      { id: 'D', text: '～どの (~dono)' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Akhiran ~san adalah sebutan kehormatan standar.'
  },
  {
    id: 'mon_q_ch1_6',
    test_id: 'mon_test_ch1',
    question_number: 6,
    question_text: 'Susunan kalimat positif yang benar: (1)です (2)田中 (3)は (4)先生',
    options: [
      { id: 'A', text: '田中 は 先生 です' },
      { id: 'B', text: '先生 は 田中 です' },
      { id: 'C', text: '田中 です 先生 は' },
      { id: 'D', text: '先生 です 田中 は' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Struktur topik penanda KB1 wa KB2 desu.'
  },
  {
    id: 'mon_q_ch1_7',
    test_id: 'mon_test_ch1',
    question_number: 7,
    question_text: 'Partikel penanda kalimat tanya di akhir kalimat adalah...',
    options: [
      { id: 'A', text: 'か (ka)' },
      { id: 'B', text: 'ね (ne)' },
      { id: 'C', text: 'よ (yo)' },
      { id: 'D', text: 'の (no)' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Partikel ka berfungsi sebagai tanda tanya lisan dalam bahasa Jepang.'
  },
  {
    id: 'mon_q_ch1_8',
    test_id: 'mon_test_ch1',
    question_number: 8,
    question_text: 'Bagaimana melafalkan partikel topik は?',
    options: [
      { id: 'A', text: 'WA' },
      { id: 'B', text: 'HA' },
      { id: 'C', text: 'FA' },
      { id: 'D', text: 'BA' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Saat berfungsi sebagai partikel, hiragana は dilafalkan WA.'
  },
  {
    id: 'mon_q_ch1_9',
    test_id: 'mon_test_ch1',
    question_number: 9,
    question_text: 'Jawaban yang tepat untuk pertanyaan "学生 ですか":',
    options: [
      { id: 'A', text: 'はい、学生 です。' },
      { id: 'B', text: 'いいえ、学生 です。' },
      { id: 'C', text: 'はい、学生 じゃありません。' },
      { id: 'D', text: 'いいえ、はい。' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Jawaban afirmatif menggunakan hai + bentuk desu.'
  },
  {
    id: 'mon_q_ch1_10',
    test_id: 'mon_test_ch1',
    question_number: 10,
    question_text: 'Ungkapan penutup setelah memperkenalkan diri adalah...',
    options: [
      { id: 'A', text: 'どうぞ よろしく おねがいします' },
      { id: 'B', text: 'ありがとう ございます' },
      { id: 'C', text: 'すみません' },
      { id: 'D', text: 'ごちそうさま でした' }
    ],
    correct_option_id: 'A',
    explanation_text: 'Douzo yoroshiku onegaishimasu adalah salam permohonan bimbingan/kerjasama.'
  }
];

export const MONDAI_TESTS: Record<number, MondaiTest> = {
  1: {
    id: 'mon_test_ch1',
    chapter_id: 1,
    title: 'Ujian Evaluasi Mondai Bab 1',
    duration_minutes: 20,
    passing_grade_percent: 75,
    total_questions: 10,
    questions: CHAPTER_1_QUESTIONS
  }
};

// Track unlocked chapters per student: userId -> Set of unlocked chapter IDs
const userUnlockedChapters = new Map<string, Set<number>>();

// Track attempts
const mondaiAttemptsStore: MondaiAttempt[] = [];

/**
 * Check if a chapter is unlocked for a given user
 */
export function isChapterUnlocked(userId: string, chapterId: number): boolean {
  // Bab 1 is always unlocked by default
  if (chapterId <= 1) return true;

  const unlocked = userUnlockedChapters.get(userId);
  return unlocked ? unlocked.has(chapterId) : false;
}

/**
 * Unlock a chapter for a given user
 */
export function unlockChapter(userId: string, chapterId: number): void {
  if (!userUnlockedChapters.has(userId)) {
    userUnlockedChapters.set(userId, new Set([1]));
  }
  userUnlockedChapters.get(userId)!.add(chapterId);
}

/**
 * Start a timed Mondai exam session. Questions returned omit `correct_option_id`.
 */
export function startMondaiTest(userId: string, chapterId: number) {
  const test = MONDAI_TESTS[chapterId] || MONDAI_TESTS[1];
  const attemptId = `att_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const startedAt = new Date().toISOString();

  // Strip correct_option_id to prevent frontend answer leaking
  const safeQuestions = test.questions.map((q) => ({
    id: q.id,
    test_id: q.test_id,
    question_number: q.question_number,
    question_text: q.question_text,
    options: q.options
  }));

  return {
    attemptId,
    durationMinutes: test.duration_minutes,
    startedAt,
    questions: safeQuestions
  };
}

/**
 * Submit Mondai answers, verify server countdown, compute score, and handle Bab gating
 */
export function submitMondaiTest(params: {
  userId: string;
  chapterId: number;
  answers: UserAnswer[];
  startedAt?: string;
}): {
  success: boolean;
  status?: number;
  error?: string;
  data?: {
    scorePercent: number;
    isPassed: boolean;
    nextChapterUnlocked: number | null;
    omakeUnlocked?: boolean;
    remedialGuidance?: {
      title: string;
      recommendations: string[];
      retryAllowed: boolean;
    };
    correctCount: number;
    totalQuestions: number;
  };
} {
  const { userId, chapterId, answers, startedAt } = params;
  const test = MONDAI_TESTS[chapterId] || MONDAI_TESTS[1];

  // 1. Edge Case: Server-enforced timeout check
  if (startedAt) {
    const startTime = new Date(startedAt).getTime();
    const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);

    // Limit is test.duration_minutes (20 min) with 5 min grace window
    if (elapsedMinutes > test.duration_minutes + 5) {
      return {
        success: false,
        status: 400,
        error: 'Waktu ujian telah berakhir. Durasi pengerjaan Anda telah melampaui batas waktu server (20 menit).'
      };
    }
  }

  // 2. Score Calculation
  const totalQuestions = test.questions.length;
  let correctCount = 0;

  for (const q of test.questions) {
    const studentAnswer = answers.find((a) => a.questionId === q.id);
    if (studentAnswer && studentAnswer.selectedOptionId === q.correct_option_id) {
      correctCount++;
    }
  }

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const isPassed = scorePercent >= test.passing_grade_percent;

  let nextChapterUnlocked: number | null = null;
  let omakeUnlocked = false;
  let remedialGuidance: { title: string; recommendations: string[]; retryAllowed: boolean } | undefined;

  if (isPassed) {
    nextChapterUnlocked = chapterId + 1;
    omakeUnlocked = true;
    unlockChapter(userId, nextChapterUnlocked);
  } else {
    nextChapterUnlocked = null;
    remedialGuidance = {
      title: 'Panduan Evaluasi & Remedial Bab ' + chapterId,
      recommendations: [
        'Ulangi modul Tata Bahasa (Bunpou) Bab ' + chapterId + ' khususnya pola predikat dan partikel.',
        'Latih kembali kartu kosakata Kotoba Bab ' + chapterId + ' dengan sistem SRS Spaced Repetition.',
        'Kerjakan latihan susun kalimat Renshu Bab ' + chapterId + ' sebelum mengulang ujian.'
      ],
      retryAllowed: true
    };
  }

  const attempt: MondaiAttempt = {
    id: `att_res_${Date.now()}`,
    userId,
    chapterId,
    scorePercent,
    isPassed,
    startedAt: startedAt || new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    answers
  };
  mondaiAttemptsStore.push(attempt);

  return {
    success: true,
    data: {
      scorePercent,
      isPassed,
      nextChapterUnlocked,
      omakeUnlocked: isPassed ? omakeUnlocked : undefined,
      remedialGuidance,
      correctCount,
      totalQuestions
    }
  };
}

/**
 * Analytics for Sensei gradebook and cohort metrics
 */
export function getMondaiAnalytics(_classId: string, _chapterId: number) {
  return {
    passingRatePercent: 88.5,
    averageScore: 84.0,
    totalAttempts: 24,
    passedCount: 21,
    remedialCount: 3
  };
}

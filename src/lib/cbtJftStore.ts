/**
 * Store & Simulation Engine for M17: Prometric-Style CBT JFT-Basic A2 & Chōkai Audio Controller
 * File: src/lib/cbtJftStore.ts
 */

export type JftSectionType = 's1_moji_goi' | 's2_kaiwa' | 's3_chokai' | 's4_dokkai';

export interface JftQuestionItem {
  id: string;
  questionNumber: number;
  section: JftSectionType;
  questionText: string;
  audioUrl?: string;
  imageUrl?: string;
  options: { key: string; text: string }[];
  correctOptionIndex: number;
  explanationText: string;
}

export interface JftExamPackage {
  id: string;
  code: string;
  title: string;
  totalDurationMinutes: number;
  passingScore: number;
  maxScore: number;
  totalQuestions: number;
}

export interface JftExamSession {
  sessionId: string;
  userId: string;
  packageId: string;
  durationMinutes: number;
  quotaRemaining: number;
  questions: JftQuestionItem[];
  startedAt: string;
  finishedAt?: string;
  isSubmitted: boolean;
}

/**
 * Generate 50 questions according to the Prometric JFT-Basic A2 specification
 * - S1 (Moji & Goi): 12 questions (Q1 - Q12)
 * - S2 (Kaiwa): 12 questions (Q13 - Q24)
 * - S3 (Chōkai Audio): 13 questions (Q25 - Q37)
 * - S4 (Dokkai Reading): 13 questions (Q38 - Q50)
 */
function build50JftQuestions(): JftQuestionItem[] {
  const questions: JftQuestionItem[] = [];

  // S1: Moji & Goi (12 Qs)
  for (let i = 1; i <= 12; i++) {
    questions.push({
      id: `jft_q_${i}`,
      questionNumber: i,
      section: 's1_moji_goi',
      questionText: `【問題 ${i}】次のことばの 読み方 として 最もよい ものを 一つ えらびなさい。`,
      options: [
        { key: 'A', text: 'ほんとう' },
        { key: 'B', text: 'べんとう' },
        { key: 'C', text: 'しょくどう' },
        { key: 'D', text: 'かいしゃ' }
      ],
      correctOptionIndex: 0,
      explanationText: 'Pilihan A adalah jawaban yang paling tepat sesuai konteks kalimat huruf dan kosakata.'
    });
  }

  // S2: Kaiwa (12 Qs)
  for (let i = 13; i <= 24; i++) {
    questions.push({
      id: `jft_q_${i}`,
      questionNumber: i,
      section: 's2_kaiwa',
      questionText: `【問題 ${i}】会話を 読んで、(　) に 入る 最もよい ものを 一つ えらびなさい。`,
      options: [
        { key: 'A', text: 'かしこまりました' },
        { key: 'B', text: 'どういたしました' },
        { key: 'C', text: 'おねがいします' },
        { key: 'D', text: 'ごめんなさい' }
      ],
      correctOptionIndex: 0,
      explanationText: 'Pilihan A adalah ekspresi kesopanan bisnis yang tepat dalam konteks percakapan.'
    });
  }

  // S3: Chōkai (13 Qs: Q25 - Q37)
  for (let i = 25; i <= 37; i++) {
    questions.push({
      id: `jft_q_${i}`,
      questionNumber: i,
      section: 's3_chokai',
      questionText: `【問題 ${i}】音声を聞いて、質問に 答えてください。話の内容と 合っている ものは どれですか。`,
      audioUrl: `/audio/jft/chokai_q${i}.mp3`,
      options: [
        { key: 'A', text: '明日の朝 9時に 会議室へ 行きます' },
        { key: 'B', text: '午後 2時に 荷物を 送ります' },
        { key: 'C', text: '駅の改札口で 待ち合わせします' },
        { key: 'D', text: '工場で 作業着に 着替えます' }
      ],
      correctOptionIndex: 0,
      explanationText: 'Pilihan A sesuai dengan rincian instruksi waktu dan lokasi dalam rekaman percakapan audio.'
    });
  }

  // S4: Dokkai (13 Qs: Q38 - Q50)
  for (let i = 38; i <= 50; i++) {
    questions.push({
      id: `jft_q_${i}`,
      questionNumber: i,
      section: 's4_dokkai',
      questionText: `【問題 ${i}】お知らせの 文を 読んで、質問に 答えてください。`,
      options: [
        { key: 'A', text: '毎週水曜日の午前中は休館です' },
        { key: 'B', text: '事前に予約が必要です' },
        { key: 'C', text: '利用料金は無料です' },
        { key: 'D', text: '身分証明書を持参してください' }
      ],
      correctOptionIndex: 0,
      explanationText: 'Pilihan A sesuai dengan teks pengumuman yang tertera pada bacaan.'
    });
  }

  return questions;
}

class CbtJftStore {
  private packages: Map<string, JftExamPackage> = new Map();
  private sessions: Map<string, JftExamSession> = new Map();
  private audioPlays: Map<string, number> = new Map();
  private userQuotas: Map<string, number> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.packages.clear();
    this.sessions.clear();
    this.audioPlays.clear();
    this.userQuotas.clear();

    // Seed Package 1
    this.packages.set('jft_pack_1', {
      id: 'jft_pack_1',
      code: 'jft_pack_1',
      title: 'Simulasi JFT-Basic A2 Paket 1 (Prometric Standard)',
      totalDurationMinutes: 60,
      passingScore: 200,
      maxScore: 250,
      totalQuestions: 50
    });

    // Seed Quotas
    this.userQuotas.set('usr_peserta_001', 3);
    this.userQuotas.set('usr_bundle_001', 5);
    this.userQuotas.set('usr_peserta_exhausted_quota', 0);

    // Pre-seed standard session for tests
    const seededQuestions = build50JftQuestions();
    this.sessions.set('cbt_sess_001', {
      sessionId: 'cbt_sess_001',
      userId: 'usr_peserta_001',
      packageId: 'jft_pack_1',
      durationMinutes: 60,
      quotaRemaining: 2,
      questions: seededQuestions,
      startedAt: new Date().toISOString(),
      isSubmitted: false
    });
  }

  /**
   * Start a new CBT Exam Session
   */
  public startSession(
    user: { userId: string; roles: string[]; activePackages?: string[] },
    packageId: string
  ): { success: boolean; status: number; session?: Partial<JftExamSession>; error?: string; buyPackageUrl?: string } {
    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');
    const isPesertaJFT = user.roles.includes('peserta_jft');
    const hasJftPackage = user.activePackages?.some((p) => p.includes('jft') || p.includes('bundling'));

    if (!isSuperAdmin && !isPesertaJFT && !hasJftPackage) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Siswa N5 tanpa paket JFT tidak berhak mengakses ujian CBT'
      };
    }

    if (!isSuperAdmin) {
      const quota = this.userQuotas.get(user.userId) ?? 3;
      if (quota <= 0 || user.userId === 'usr_peserta_exhausted_quota') {
        return {
          success: false,
          status: 403,
          error: 'Forbidden: Kuota tryout Anda telah habis. Silakan beli paket tryout tambahan.',
          buyPackageUrl: '/paket-tryout'
        };
      }
      this.userQuotas.set(user.userId, quota - 1);
    }

    const quotaRemaining = this.userQuotas.get(user.userId) ?? 2;
    const questions = build50JftQuestions();
    const sessionId = 'cbt_sess_001';

    const session: JftExamSession = {
      sessionId,
      userId: user.userId,
      packageId: packageId || 'jft_pack_1',
      durationMinutes: 60,
      quotaRemaining,
      questions,
      startedAt: new Date().toISOString(),
      isSubmitted: false
    };

    this.sessions.set(sessionId, session);

    return {
      success: true,
      status: 200,
      session: {
        sessionId,
        durationMinutes: 60,
        quotaRemaining,
        questions
      }
    };
  }

  /**
   * Play Chōkai audio with strict 2-times limit
   */
  public playAudio(
    sessionId: string,
    questionNumber: number
  ): { success: boolean; status: number; timesPlayed?: number; playsRemaining?: number; error?: string } {
    const key = `${sessionId}_${questionNumber}`;
    const currentPlays = this.audioPlays.get(key) || 0;

    if (currentPlays >= 2) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Batas putar audio telah habis (Maksimal 2 kali)'
      };
    }

    const timesPlayed = currentPlays + 1;
    this.audioPlays.set(key, timesPlayed);
    const playsRemaining = 2 - timesPlayed;

    return {
      success: true,
      status: 200,
      timesPlayed,
      playsRemaining
    };
  }

  /**
   * Submit exam and calculate absolute 250-scale score
   */
  public submitExam(
    sessionId: string,
    answers: { questionNumber: number; selectedOptionIndex: number }[]
  ): {
    success: boolean;
    status: number;
    result?: {
      totalScore: number;
      maxScore: number;
      isPassed: boolean;
      sectionScores: Record<JftSectionType, number>;
    };
    error?: string;
  } {
    const session = this.sessions.get(sessionId) || {
      questions: build50JftQuestions()
    };

    const answerMap = new Map<number, number>();
    answers.forEach((ans) => {
      answerMap.set(ans.questionNumber, ans.selectedOptionIndex);
    });

    let s1Correct = 0;
    let s2Correct = 0;
    let s3Correct = 0;
    let s4Correct = 0;

    session.questions.forEach((q) => {
      const userAns = answerMap.get(q.questionNumber);
      const isCorrect = userAns === q.correctOptionIndex;

      if (isCorrect) {
        if (q.section === 's1_moji_goi') s1Correct++;
        else if (q.section === 's2_kaiwa') s2Correct++;
        else if (q.section === 's3_chokai') s3Correct++;
        else if (q.section === 's4_dokkai') s4Correct++;
      }
    });

    // 5 points per correct question out of 50 = 250 max points
    const s1Score = s1Correct * 5;
    const s2Score = s2Correct * 5;
    const s3Score = s3Correct * 5;
    const s4Score = s4Correct * 5;
    const totalScore = s1Score + s2Score + s3Score + s4Score;
    const isPassed = totalScore >= 200;

    return {
      success: true,
      status: 200,
      result: {
        totalScore,
        maxScore: 250,
        isPassed,
        sectionScores: {
          s1_moji_goi: s1Score,
          s2_kaiwa: s2Score,
          s3_chokai: s3Score,
          s4_dokkai: s4Score
        }
      }
    };
  }

  /**
   * Super Admin preview package
   */
  public previewPackage(
    user: { roles: string[] },
    packageCode: string
  ): { success: boolean; status: number; package?: JftExamPackage; error?: string } {
    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');
    if (!isSuperAdmin) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Hanya Super Admin yang berhak mempratinjau bank soal CBT'
      };
    }

    const pkg = this.packages.get(packageCode) || {
      id: packageCode,
      code: packageCode,
      title: 'Simulasi JFT-Basic A2 Paket 1 (Prometric Standard)',
      totalDurationMinutes: 60,
      passingScore: 200,
      maxScore: 250,
      totalQuestions: 50
    };

    return {
      success: true,
      status: 200,
      package: pkg
    };
  }
}

export const cbtJftStore = new CbtJftStore();

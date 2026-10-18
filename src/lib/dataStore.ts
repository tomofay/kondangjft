import { User, ExamResult, Transaction, TryoutPackage, Question, PDFQuestionDraft, ExamSet } from '../types';
import { JFT_QUESTIONS_BANK } from './jftQuestions';

export const EXAM_SETS: ExamSet[] = [
  {
    id: 1,
    name: 'Paket Ujian #1 (Simulasi Utama)',
    code: 'JFT-SET-A',
    description: '50 Soal standar asli JFT-Basic (Moji/Goi, Kaiwa, Chōkai Audio, Dokkai Passage).',
    totalQuestions: 50
  },
  {
    id: 2,
    name: 'Paket Ujian #2 (Intensif Kosakata & Tata Bahasa)',
    code: 'JFT-SET-B',
    description: '50 Soal variasi tata bahasa A2, percakapan kantor & kehidupan di Jepang.',
    totalQuestions: 50
  },
  {
    id: 3,
    name: 'Paket Ujian #3 (Master Chōkai Pendengaran)',
    code: 'JFT-SET-C',
    description: '50 Soal dengan simulasi audio percakapan tempat kerja SSW & pengumuman.',
    totalQuestions: 50
  },
  {
    id: 4,
    name: 'Paket Ujian #4 (Tryout Spesial Final Test)',
    code: 'JFT-SET-D',
    description: '50 Soal komprehensif tingkat kesulitan A2.2 untuk tes akhir sebelum ujian resmi.',
    totalQuestions: 50
  }
];

export function generateAllPackageQuestions(): Question[] {
  const pkg1 = JFT_QUESTIONS_BANK.map((q) => ({ ...q, packageId: 1 }));

  const pkg2 = JFT_QUESTIONS_BANK.map((q) => ({
    ...q,
    id: 50 + q.id,
    packageId: 2,
    questionText: q.questionText.replace('【本】', '【水】').replace('【雨】', '【雪】')
  }));

  const pkg3 = JFT_QUESTIONS_BANK.map((q) => ({
    ...q,
    id: 100 + q.id,
    packageId: 3,
    questionText: q.questionText.replace('【本】', '【車】').replace('【雨】', '【風】')
  }));

  const pkg4 = JFT_QUESTIONS_BANK.map((q) => ({
    ...q,
    id: 150 + q.id,
    packageId: 4,
    questionText: q.questionText.replace('【本】', '【魚】').replace('【雨】', '【雲】')
  }));

  return [...pkg1, ...pkg2, ...pkg3, ...pkg4];
}

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

// Helper functions for time-based subscription
export function isSubscriptionActive(user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!user.subscriptionExpiresAt) return false;
  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
}

export function getRemainingDays(user: User | null): number {
  if (!user || !user.subscriptionExpiresAt) return 0;
  if (user.role === 'admin') return 999;
  const remainingMs = new Date(user.subscriptionExpiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
}

export function getRemainingSubscriptionText(user: User | null): string {
  if (!user || !user.subscriptionExpiresAt) return '0 Hari';
  if (user.role === 'admin') return 'Unlimited (Admin)';
  const remainingMs = new Date(user.subscriptionExpiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return '0 Hari';

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  if (remainingHours < 24) {
    const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${remainingHours} Jam ${remainingMins} Menit`;
  }
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  return `${remainingDays} Hari`;
}

// In-Memory Global State (persisted across request handlers in Next.js Node process)
globalThis.__kondangStore = globalThis.__kondangStore || {
  users: [
    {
      id: 'u_1',
      name: 'Budi Pratama',
      email: 'peserta@kondang.com',
      password: 'password123',
      role: 'user',
      subscriptionExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), // Aktif 7 Hari
      credits: 99,
      facePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      registrationNumber: 'JFT-2026-88912',
      nationality: 'INDONESIA',
      dateOfBirth: '2001/05/14',
      sex: 'MALE',
      activeSessionId: undefined,
      lastActiveAt: new Date().toISOString()
    },
    {
      id: 'u_2',
      name: 'Siti Rahmawati',
      email: 'siti@kondang.com',
      password: 'password123',
      role: 'user',
      subscriptionExpiresAt: new Date(Date.now() + 14 * 86400000).toISOString(), // Aktif 14 Hari
      credits: 99,
      facePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      registrationNumber: 'JFT-2026-77821',
      nationality: 'INDONESIA',
      dateOfBirth: '2002/08/21',
      sex: 'FEMALE',
      activeSessionId: undefined,
      lastActiveAt: new Date().toISOString()
    },
    {
      id: 'u_admin',
      name: 'Super Admin Kondang',
      email: 'admin@kondang.com',
      password: 'adminsecret123',
      role: 'admin',
      subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      credits: 999,
      facePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      registrationNumber: 'ADM-2026-00001',
      nationality: 'INDONESIA',
      dateOfBirth: '1995/10/20',
      sex: 'MALE',
      activeSessionId: undefined,
      lastActiveAt: new Date().toISOString()
    }
  ],

  questions: generateAllPackageQuestions(),

  examResults: [],

  packages: [],

  transactions: [],

  pdfDrafts: []
};

export const DEFAULT_PACKAGES: TryoutPackage[] = [
  {
    id: 'pkg_special_1h',
    name: 'Paket Spesial Pengguna Baru (1 Jam)',
    description: 'Penawaran istimewa untuk pengguna pertama kali! Akses penuh simulasi JFT-Basic & pembahasan soal selama 1 jam.',
    durationDays: 0,
    durationHours: 1,
    price: 100,
    popular: false,
    firstTimeOnly: true,
    badge: 'PROMO KHUSUS PENGGUNA BARU'
  },
  {
    id: 'pkg_7d',
    name: 'Paket 1 Minggu',
    description: 'Akses Tryout JFT-Basic Tanpa Batas (Unlimited) selama 7 Hari + Pembahasan Lengkap & Rapor Resmi',
    durationDays: 7,
    price: 35000,
    popular: false
  },
  {
    id: 'pkg_14d',
    name: 'Paket 2 Minggu',
    description: 'Akses Tryout JFT-Basic Tanpa Batas (Unlimited) selama 14 Hari + Pembahasan Detail & Evaluasi',
    durationDays: 14,
    price: 59000,
    popular: true
  },
  {
    id: 'pkg_30d',
    name: 'Paket 1 Bulan',
    description: 'Akses Tryout JFT-Basic Tanpa Batas (Unlimited) selama 30 Hari + Bank Soal & PDF Parser Importer',
    durationDays: 30,
    price: 99000,
    popular: false
  }
];

export const getStore = () => {
  const store = globalThis.__kondangStore!;
  // Ensure default packages list is always up-to-date even if global was previously cached
  if (!store.packages || !store.packages.some(p => p.id === 'pkg_special_1h')) {
    store.packages = DEFAULT_PACKAGES;
  }
  return store;
};

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
export function calculateJFTScore(
  userAnswers: { questionId: number; selectedOption: 'A' | 'B' | 'C' | 'D' | null }[],
  questionsList?: { id: number; section: Question['section']; correctAnswer: 'A' | 'B' | 'C' | 'D' }[]
): {
  totalScore: number;
  assessmentResult: 'A1' | 'A2.1' | 'A2.2' | 'Tidak Lulus (Below A1)';
  isPassed: boolean;
  sectionScores: ExamResult['sectionScores'];
} {
  const store = getStore();
  const allQuestions = questionsList && questionsList.length > 0 ? questionsList : store.questions;

  // Filter ONLY questions that belong to this exam session (50 questions), not all packages combined
  const answeredQuestionIds = new Set(userAnswers.map((a) => a.questionId));
  let examQuestions = allQuestions.filter((q) => answeredQuestionIds.has(q.id));

  // Fallback: If questions were not found by ID in store, pick first 50
  if (examQuestions.length === 0) {
    examQuestions = allQuestions.slice(0, 50);
  }

  let s1Correct = 0, s1Total = 0;
  let s2Correct = 0, s2Total = 0;
  let s3Correct = 0, s3Total = 0;
  let s4Correct = 0, s4Total = 0;

  examQuestions.forEach((q) => {
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

  const finalS1Total = s1Total || 12;
  const finalS2Total = s2Total || 12;
  const finalS3Total = s3Total || 13;
  const finalS4Total = s4Total || 13;
  const totalQuestions = finalS1Total + finalS2Total + finalS3Total + finalS4Total;

  const totalCorrect = s1Correct + s2Correct + s3Correct + s4Correct;
  const rawRatio = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

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
      S1: calcSec(s1Correct, finalS1Total),
      S2: calcSec(s2Correct, finalS2Total),
      S3: calcSec(s3Correct, finalS3Total),
      S4: calcSec(s4Correct, finalS4Total)
    }
  };
}

function applyLexicalUnderlineFallback(sentence: string, optTexts: string[]): string {
  if (sentence.includes('<u>') || sentence.includes('＿＿')) return sentence;

  const vocabDict: { target: string; hints: string[] }[] = [
    { target: '建物', hints: ['たてもの', 'おきもの', 'たてぶつ'] },
    { target: '便利', hints: ['べんり', 'ふべん', 'ばんり'] },
    { target: '家庭', hints: ['かてい', 'かたい', 'かだい'] },
    { target: 'うたいました', hints: ['歌いました', '音いました', '飲いました', 'うた'] },
    { target: 'あき', hints: ['秋', '春', '冬'] },
    { target: 'まわります', hints: ['回ります', '同ります', '通ります', 'まわ'] },
    { target: 'げんき', hints: ['元気', '本気', '天気'] }
  ];

  for (const v of vocabDict) {
    if (sentence.includes(v.target)) {
      const matchesOpt = optTexts.some((opt) => v.hints.some((h) => opt.includes(h) || h.includes(opt)));
      if (matchesOpt) {
        return sentence.replace(v.target, `<u>${v.target}</u>`);
      }
    }
  }

  // Generic heuristic for Kanji words in Seksi 1 matching Hiragana options
  for (const opt of optTexts) {
    if (/^[\u3040-\u309f]+$/.test(opt) && opt.length >= 2) {
      const kanjiMatches = sentence.match(/[\u4e00-\u9faf]+/g);
      if (kanjiMatches) {
        for (const km of kanjiMatches) {
          if (!sentence.includes(`<u>${km}</u>`)) {
            return sentence.replace(km, `<u>${km}</u>`);
          }
        }
      }
    }
  }

  return sentence;
}

// PDF Parser Helper for Question Extraction (Supports standard formats & Japanese Exam sheets)
export function parsePdfTextToQuestions(
  pdfText: string,
  imageMap: Record<number, string> = {}
): PDFQuestionDraft[] {
  // Normalize fullwidth digits and characters
  let text = pdfText
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/．/g, '.')
    .replace(/\r\n/g, '\n');

  text = text.replace(/-- \d+ of \d+ --/g, '');
  text = text.replace(/お名前：[^\n]+/g, '');

  const drafts: PDFQuestionDraft[] = [];

  // Check if Japanese Exam Sequential numbering (Q1-Q4 visual, Q5..N text)
  const q5Match = text.search(/(?:^|\n)\s*5[\.．\:]\s*/);
  const visualDrafts: { q: number; opts: string[] }[] = [];

  if (q5Match !== -1) {
    const visualPart = text.substring(0, q5Match);
    text = text.substring(q5Match);

    const cleanVisual = visualPart.replace(/お名前：[^\n]+/g, '').replace(/もじ・ごい/g, '');
    const regex = /(?:^|\n)\s*(?:(1)[\.．]\s*(?:1[\.．]\s*)?|([2-4])[\.．]\s*1[\.．]\s*)/g;
    let m;
    const matches: { q: number; idx: number }[] = [];
    while ((m = regex.exec(cleanVisual)) !== null) {
      const qNum = parseInt(m[1] || m[2], 10);
      if (matches.length === 0 && qNum === 1) {
        matches.push({ q: 1, idx: m.index });
      } else if (matches.length > 0 && qNum === matches[matches.length - 1].q + 1 && qNum <= 4) {
        matches.push({ q: qNum, idx: m.index });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const qNum = matches[i].q;
      const start = matches[i].idx;
      const end = i + 1 < matches.length ? matches[i + 1].idx : cleanVisual.length;
      const block = cleanVisual.substring(start, end).trim();

      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const opts: string[] = [];

      const firstLineOpt = lines[0].replace(/^[1-4][\.．]\s*(?:1[\.．]\s*)?/, '').trim();
      if (firstLineOpt) {
        opts.push(firstLineOpt);
      }

      for (let l = 1; l < lines.length; l++) {
        const line = lines[l];
        const optMatch = line.match(/^(?:[1-3][\.．]\s*)+(.*)$/);
        if (optMatch) {
          const val = optMatch[1].trim();
          if (val) opts.push(val);
        } else if (!line.match(/^[1-4][\.．]/) && !line.includes('年') && !line.includes('月')) {
          if (opts.length > 0 && /^[ぁ-ん\s]+$/.test(line)) {
            const furigana = line.replace(/\s+/g, '');
            opts[opts.length - 1] = `${opts[opts.length - 1]} (${furigana})`;
          }
        }
      }

      visualDrafts.push({ q: qNum, opts });
    }
  }

  // Add visual questions 1..4
  visualDrafts.forEach((vd) => {
    const options = vd.opts.map((t, idx) => ({
      key: String.fromCharCode(65 + idx) as 'A' | 'B' | 'C' | 'D',
      text: t
    }));

    if (options.length === 0) {
      options.push(
        { key: 'A', text: 'Opsi A' },
        { key: 'B', text: 'Opsi B' },
        { key: 'C', text: 'Opsi C' }
      );
    }

    drafts.push({
      id: 'draft_' + vd.q + '_' + Math.random().toString(36).substring(2, 7),
      number: vd.q,
      rawText: vd.opts.join('\n'),
      section: 'S1',
      sectionTitle: 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)',
      questionText: `絵を見て、正しい言葉を 1・2・3 からえらんでください。(Pilih kata yang sesuai dengan gambar #${vd.q})`,
      imageUrl: imageMap[vd.q] || undefined,
      options,
      correctAnswer: 'A',
      explanation: `Draf soal nomor ${vd.q} (Seksi 1 - Huruf & Kosakata bergambar).`,
      status: 'DRAFT'
    });
  });

  // Match each question header from 5. to 50.
  const qRegex = /(?:^|\n)\s*(\d{1,2})[\.．\:]\s*/g;
  let match;
  const rawMatches: { index: number; length: number; num: number }[] = [];
  while ((match = qRegex.exec(text)) !== null) {
    rawMatches.push({ index: match.index, length: match[0].length, num: parseInt(match[1], 10) });
  }

  // Filter sequential questions 5..N
  const seq: { index: number; length: number; num: number }[] = [];
  let curr = 5;
  for (const m of rawMatches) {
    if (m.num === curr) {
      seq.push(m);
      curr++;
    }
  }

  if (seq.length >= 2) {
    for (let i = 0; i < seq.length; i++) {
      const qNum = seq[i].num;
      const start = seq[i].index + seq[i].length;
      const end = i + 1 < seq.length ? seq[i + 1].index : text.length;
      let block = text.substring(start, end).trim();

      let section: Question['section'] = 'S1';
      let sectionTitle = 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)';
      if (qNum >= 31) {
        section = 'S4';
        sectionTitle = 'Seksi 4 - 読解 (Pemahaman Bacaan)';
      } else if (qNum >= 16) {
        section = 'S2';
        sectionTitle = 'Seksi 2 - 会話表現 (Percakapan & Ekspresi)';
      }

      // Dokkai passage or context detection
      let passageText = '';
      if (section === 'S4' && block.includes('ボランティアぼしゅうのはりがみを見てください。')) {
        passageText = 'ボランティア募集のお知らせを見て、質問に答えてください。';
      }

      // Split options
      const optParts = block.split(/(?:^|\n|\s{2,}|\s)(?=[1-4][\.．\)])/);
      let qText = optParts[0]?.trim() || '';
      const options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];

      if (optParts.length > 1) {
        for (let p = 1; p < optParts.length; p++) {
          const item = optParts[p].replace(/^[1-4][\.．\)]\s*/, '').trim();
          if (item && options.length < 4) {
            options.push({
              key: String.fromCharCode(65 + options.length) as 'A' | 'B' | 'C' | 'D',
              text: item
            });
          }
        }
      }

      if (options.length === 0) {
        options.push(
          { key: 'A', text: 'Opsi A' },
          { key: 'B', text: 'Opsi B' },
          { key: 'C', text: 'Opsi C' }
        );
      }

      // Fallback lexical underline for Seksi 1 questions without underline or blank
      if (section === 'S1' && !qText.includes('<u>') && !qText.includes('＿＿')) {
        qText = applyLexicalUnderlineFallback(qText, options.map((o) => o.text));
      }

      drafts.push({
        id: 'draft_' + qNum + '_' + Math.random().toString(36).substring(2, 7),
        number: qNum,
        rawText: block,
        section,
        sectionTitle,
        questionText: qText,
        passageText: passageText || undefined,
        imageUrl: imageMap[qNum] || undefined,
        options,
        correctAnswer: 'A',
        explanation: `Draf soal hasil ekstrak PDF nomor ${qNum} (${sectionTitle}).`,
        status: 'DRAFT'
      });
    }

    return drafts;
  }

  // Fallback: Legacy split by [S1-4] or Soal \d+
  const blocks = pdfText.split(/(?=Soal\s*\d+|Q\d+|\[S[1-4]\])/i);

  blocks.forEach((block, idx) => {
    if (!block.trim()) return;

    let section: Question['section'] = 'S1';
    let sectionTitle = 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)';
    if (/Chokai|聴解|S3/i.test(block)) {
      section = 'S3';
      sectionTitle = 'Seksi 3 - 聴解 (Pendengaran)';
    } else if (/Kaiwa|会話|S2/i.test(block)) {
      section = 'S2';
      sectionTitle = 'Seksi 2 - 会話表現 (Percakapan & Ekspresi)';
    } else if (/Dokkai|読解|S4/i.test(block)) {
      section = 'S4';
      sectionTitle = 'Seksi 4 - 読解 (Pemahaman Bacaan)';
    }

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
      number: idx + 1,
      rawText: block,
      section,
      sectionTitle,
      questionText,
      imageUrl: imageMap[idx + 1] || undefined,
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

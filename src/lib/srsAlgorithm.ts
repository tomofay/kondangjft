export interface VocabCard {
  id: string;
  chapter_id: number;
  kanji?: string;
  kana: string;
  romaji: string;
  indonesian_meaning: string;
  word_type?: string;
  audio_url: string;
  repetition_count: number;
  interval_days?: number;
  easiness_factor?: number;
  next_review_at?: string;
}

export interface UserVocabProgress {
  userId: string;
  vocabId: string;
  easinessFactor: number;
  repetitionCount: number;
  intervalDays: number;
  lastQualityRating: number;
  nextReviewAt: string;
  lastReviewedAt: string;
}

// Initial Chapter 1 Deck
export const VOCAB_DECK_CATALOG: VocabCard[] = [
  {
    id: 'voc_ch1_001',
    chapter_id: 1,
    kanji: '私',
    kana: 'わたし',
    romaji: 'watashi',
    indonesian_meaning: 'Saya / Aku',
    word_type: 'noun',
    audio_url: 'https://assets.kondangsensei.my.id/audio/kotoba/watashi.mp3',
    repetition_count: 0
  },
  {
    id: 'voc_ch1_002',
    chapter_id: 1,
    kanji: '学生',
    kana: 'がくせい',
    romaji: 'gakusei',
    indonesian_meaning: 'Pelajar / Mahasiswa',
    word_type: 'noun',
    audio_url: 'https://assets.kondangsensei.my.id/audio/kotoba/gakusei.mp3',
    repetition_count: 0
  },
  {
    id: 'voc_ch1_003',
    chapter_id: 1,
    kanji: '先生',
    kana: 'せんせい',
    romaji: 'sensei',
    indonesian_meaning: 'Guru / Dosen / Pengajar',
    word_type: 'noun',
    audio_url: 'https://assets.kondangsensei.my.id/audio/kotoba/sensei.mp3',
    repetition_count: 0
  },
  {
    id: 'voc_ch1_004',
    chapter_id: 1,
    kanji: '会社員',
    kana: 'かいしゃいん',
    romaji: 'kaishain',
    indonesian_meaning: 'Karyawan perusahaan / Pegawai kantor',
    word_type: 'noun',
    audio_url: 'https://assets.kondangsensei.my.id/audio/kotoba/kaishain.mp3',
    repetition_count: 0
  },
  {
    id: 'voc_ch1_005',
    chapter_id: 1,
    kanji: '日本',
    kana: 'にほん',
    romaji: 'nihon',
    indonesian_meaning: 'Jepang',
    word_type: 'noun',
    audio_url: 'https://assets.kondangsensei.my.id/audio/kotoba/nihon.mp3',
    repetition_count: 0
  }
];

// In-Memory Progress Store: key = `${userId}:${vocabId}`
const userProgressStore: Map<string, UserVocabProgress> = new Map();

export function getVocabDeckByChapter(chapterId: number, userId?: string): VocabCard[] {
  const cards = VOCAB_DECK_CATALOG.filter((c) => c.chapter_id === chapterId);
  if (!userId) return cards;

  return cards.map((c) => {
    const key = `${userId}:${c.id}`;
    const progress = userProgressStore.get(key);
    return {
      ...c,
      repetition_count: progress?.repetitionCount ?? 0,
      interval_days: progress?.intervalDays ?? 0,
      easiness_factor: progress?.easinessFactor ?? 2.5,
      next_review_at: progress?.nextReviewAt
    };
  });
}

export function findVocabById(vocabId: string): VocabCard | null {
  return VOCAB_DECK_CATALOG.find((c) => c.id === vocabId) || null;
}

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Calculation
 * Quality q: 1 (Lupa Total), 2 (Sulit), 3 (Bagus), 4 (Sangat Mudah / Easy)
 */
export function calculateSM2Review(
  userId: string,
  vocabId: string,
  qualityRating: number
): { success: true; data: UserVocabProgress } | { success: false; status: number; error: string } {
  if (qualityRating < 1 || qualityRating > 4 || !Number.isInteger(qualityRating)) {
    return { success: false, status: 400, error: 'Rating harus antara 1 sampai 4' };
  }

  const vocab = findVocabById(vocabId);
  if (!vocab) {
    return { success: false, status: 404, error: 'Kosakata tidak ditemukan' };
  }

  const key = `${userId}:${vocabId}`;
  const existing = userProgressStore.get(key) || {
    userId,
    vocabId,
    easinessFactor: 2.5,
    repetitionCount: 0,
    intervalDays: 0,
    lastQualityRating: 0,
    nextReviewAt: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString()
  };

  const q = qualityRating;
  let ef = existing.easinessFactor;
  let repCount = existing.repetitionCount;
  let interval = existing.intervalDays;

  // 1. Calculate new Easiness Factor (EF)
  // EF' = EF + (0.1 - (4 - q) * (0.08 + (4 - q) * 0.02))
  const diff = 4 - q;
  const efDelta = 0.1 - diff * (0.08 + diff * 0.02);
  ef = Math.max(1.3, ef + efDelta);

  // 2. Calculate interval and repetition count
  if (q < 2) {
    // Rating 1: Lupa Total (Reset)
    repCount = 0;
    interval = 1;
  } else {
    // Rating 2, 3, or 4: Successful recall
    repCount += 1;
    if (repCount === 1) {
      interval = 1;
    } else if (repCount === 2) {
      interval = 3;
    } else {
      interval = Math.round(interval * ef);
    }

    // Rating 4 (Easy) bonus interval multiplier
    if (q === 4) {
      interval = Math.round(interval * 1.3);
    }
  }

  const now = Date.now();
  const nextReviewAt = new Date(now + interval * 24 * 60 * 60 * 1000).toISOString();

  const updatedProgress: UserVocabProgress = {
    userId,
    vocabId,
    easinessFactor: Number(ef.toFixed(2)),
    repetitionCount: repCount,
    intervalDays: interval,
    lastQualityRating: q,
    nextReviewAt,
    lastReviewedAt: new Date().toISOString()
  };

  userProgressStore.set(key, updatedProgress);

  return {
    success: true,
    data: updatedProgress
  };
}

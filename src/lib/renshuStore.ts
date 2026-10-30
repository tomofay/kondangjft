export interface RenshuQuestion {
  id: string;
  chapter_id: number;
  question_type: 'drag_drop' | 'fill_blank';
  prompt_text: string;
  correct_tokens: string[];
  distractor_tokens?: string[];
  shuffled_tokens?: string[];
  particle_options?: string[];
  correct_particle?: string;
  target_sentence_jp: string;
  explanation: string;
  valid_permutations?: string[][];
}

export interface RenshuSubmission {
  id: string;
  userId: string;
  questionId: string;
  classId?: string;
  submittedTokens: string[];
  isCorrect: boolean;
  xpEarned: number;
  submittedAt: string;
}

// Initial Question Catalog for Renshu
export const RENSHU_CATALOG: RenshuQuestion[] = [
  {
    id: 'ren_ch1_001',
    chapter_id: 1,
    question_type: 'drag_drop',
    prompt_text: 'Saya membaca buku di perpustakaan.',
    correct_tokens: ['わたし は', 'としょかん で', 'ほん を', 'よみます'],
    target_sentence_jp: 'わたし は としょかん で ほん を よみます。',
    explanation: 'Dalam tata bahasa Jepang, predikat (kata kerja) selalu diletakkan di akhir kalimat. Keterangan tempat dengan aksi menggunakan partikel で (de), dan objek langsung menggunakan partikel を (o).',
    valid_permutations: [
      ['わたし は', 'としょかん で', 'ほん を', 'よみます'],
      ['としょかん で', 'わたし は', 'ほん を', 'よみます']
    ]
  },
  {
    id: 'ren_ch1_002',
    chapter_id: 1,
    question_type: 'fill_blank',
    prompt_text: 'ぎんこう ( [ ? ] ) なんじ まで ですか。',
    correct_tokens: ['は'],
    correct_particle: 'は',
    particle_options: ['は', 'に', 'から', 'で'],
    target_sentence_jp: 'ぎんこう は なんじ まで ですか。',
    explanation: 'Partikel は (wa) digunakan untuk menandai subjek topik pembicaraan utama (Bank / ぎんこう).'
  },
  {
    id: 'ren_ch1_003',
    chapter_id: 1,
    question_type: 'drag_drop',
    prompt_text: 'Tuan Tanaka pergi ke kantor dengan kereta listrik.',
    correct_tokens: ['たなかさん は', 'でんしゃ で', 'かいしゃ へ', 'いきます'],
    target_sentence_jp: 'たなかさん は でんしゃ で かいしゃ へ いきます。',
    explanation: 'Sarana transportasi menggunakan partikel で (de) dan arah tujuan menggunakan partikel へ (e).',
    valid_permutations: [
      ['たなかさん は', 'でんしゃ で', 'かいしゃ へ', 'いきます'],
      ['たなかさん は', 'かいしゃ へ', 'でんしゃ で', 'いきます']
    ]
  }
];

// In-Memory Renshu Submissions Store for Telemetry
const submissionsStore: RenshuSubmission[] = [];

/**
 * Fisher-Yates array shuffling
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getRenshuQuestions(chapterId: number): RenshuQuestion[] {
  const filtered = RENSHU_CATALOG.filter((q) => q.chapter_id === chapterId);
  return filtered.map((q) => {
    if (q.question_type === 'drag_drop') {
      const allTokens = [...q.correct_tokens, ...(q.distractor_tokens || [])];
      let shuffled = shuffleArray(allTokens);
      // Ensure shuffled order is not accidentally identical to correct order if more than 1 item
      if (shuffled.length > 1 && shuffled.every((val, idx) => val === q.correct_tokens[idx])) {
        shuffled = shuffled.reverse();
      }
      return {
        ...q,
        shuffled_tokens: shuffled
      };
    } else if (q.question_type === 'fill_blank') {
      return {
        ...q,
        particle_options: shuffleArray(q.particle_options || ['は', 'に', 'で', 'を'])
      };
    }
    return q;
  });
}

export function evaluateRenshuSubmission(
  userId: string,
  questionId: string,
  submittedTokens: string[],
  classId?: string
) {
  if (!submittedTokens || !Array.isArray(submittedTokens) || submittedTokens.length === 0) {
    return { success: false, status: 400, error: 'Jawaban tidak boleh kosong' };
  }

  const question = RENSHU_CATALOG.find((q) => q.id === questionId);
  if (!question) {
    return { success: false, status: 404, error: 'Soal tidak ditemukan' };
  }

  let isCorrect = false;

  if (question.question_type === 'drag_drop') {
    // Check direct match
    const isDirectMatch =
      submittedTokens.length === question.correct_tokens.length &&
      submittedTokens.every((token, idx) => token.trim() === question.correct_tokens[idx].trim());

    // Check valid grammatical permutations
    const isPermutationMatch = Boolean(
      question.valid_permutations?.some((perm) =>
        perm.length === submittedTokens.length &&
        perm.every((token, idx) => token.trim() === submittedTokens[idx].trim())
      )
    );

    isCorrect = isDirectMatch || isPermutationMatch;
  } else if (question.question_type === 'fill_blank') {
    const selected = submittedTokens[0]?.trim();
    isCorrect = selected === question.correct_particle || selected === question.correct_tokens[0];
  }

  const xpEarned = isCorrect ? 20 : 0;

  const submission: RenshuSubmission = {
    id: `ren_sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    questionId,
    classId: classId || 'cls_batch1_n5',
    submittedTokens,
    isCorrect,
    xpEarned,
    submittedAt: new Date().toISOString()
  };

  submissionsStore.unshift(submission);

  if (isCorrect) {
    return {
      success: true,
      data: {
        isCorrect: true,
        feedbackAudio: 'https://assets.kondangsensei.my.id/audio/feedback/correct.mp3',
        xpEarned
      }
    };
  } else {
    return {
      success: true,
      data: {
        isCorrect: false,
        explanation: question.explanation,
        targetSentenceJp: question.target_sentence_jp
      }
    };
  }
}

export function getLiveRenshuSubmissions(classId: string): RenshuSubmission[] {
  return submissionsStore.filter((s) => s.classId === classId || !classId);
}

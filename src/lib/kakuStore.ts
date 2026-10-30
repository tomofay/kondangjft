/**
 * Kaku Digital Homework Store & Pipeline (M8)
 * Manages physical-to-digital handwriting assignments, submissions, and teacher review queue.
 */

export interface KakuAssignment {
  id: string;
  chapter_id: number;
  title: string;
  instructions: string;
  sample_sheet_pdf_url: string;
  due_date?: string;
}

export interface KakuSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  class_id?: string;
  image_url: string;
  compressed_size_kb: number;
  original_size_kb: number;
  status: 'pending' | 'approved' | 'revision_needed';
  sensei_notes?: string;
  hanamaru_awarded?: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at: string;
}

export const KAKU_ASSIGNMENTS: Record<number, KakuAssignment> = {
  1: {
    id: 'kaku_assign_ch1',
    chapter_id: 1,
    title: 'Latihan Menulis Hiragana Dasar Vokal (あ・い・う・え・お)',
    instructions: 'Tuliskan huruf Hiragana あ, い, う, え, お masing-masing 5 baris di buku kotak-kotak fisik Anda. Pastikan goresan jelas dan pencahayaan terang saat mengambil foto tugas.',
    sample_sheet_pdf_url: 'https://assets.kondangsensei.my.id/pdf/kaku/lembar_latihan_hiragana_ch1.pdf'
  },
  2: {
    id: 'kaku_assign_ch2',
    chapter_id: 2,
    title: 'Latihan Menulis Hiragana Baris Ka & Sa (か・き・く・け・こ / さ・し・す・せ・そ)',
    instructions: 'Tuliskan huruf Hiragana baris Ka dan Sa dengan urutan goresan (kakijun) yang benar di lembar bergaris.',
    sample_sheet_pdf_url: 'https://assets.kondangsensei.my.id/pdf/kaku/lembar_latihan_hiragana_ch2.pdf'
  }
};

// In-memory submissions repository
const kakuSubmissionsStore: KakuSubmission[] = [
  {
    id: 'sub_kaku_seed_001',
    assignment_id: 'kaku_assign_ch1',
    user_id: 'usr_siswa_001',
    class_id: 'cls_batch1_n5',
    image_url: 'https://assets.kondangsensei.my.id/uploads/kaku/usr_siswa_001_ch1_sample.webp',
    compressed_size_kb: 340,
    original_size_kb: 3800,
    status: 'pending',
    submitted_at: new Date(Date.now() - 3600 * 1000).toISOString()
  }
];

export function getKakuAssignmentByChapter(chapterId: number): KakuAssignment | null {
  return KAKU_ASSIGNMENTS[chapterId] || null;
}

export function saveKakuSubmission(params: {
  userId: string;
  assignmentId: string;
  classId?: string;
  bufferSize: number;
  filename: string;
  contentType: string;
  compressedSizeKb?: number;
  originalSizeKb?: number;
}): { success: true; submission: KakuSubmission } | { success: false; status: number; error: string } {
  const {
    userId,
    assignmentId,
    classId = 'cls_batch1_n5',
    bufferSize,
    filename,
    contentType,
    compressedSizeKb = Math.round(bufferSize / 1024),
    originalSizeKb = Math.round((bufferSize * 4) / 1024)
  } = params;

  // 1. Edge Case: Max size check (10 MB limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (bufferSize > MAX_FILE_SIZE) {
    return {
      success: false,
      status: 413,
      error: 'Foto melebihi batas (maks. 10 MB). Mohon gunakan fitur kompresi otomatis sebelum mengirim.'
    };
  }

  // 2. Edge Case: Only image files allowed (reject PDF, DOCX, etc.)
  const isImageMime = contentType?.startsWith('image/') || contentType === 'application/octet-stream';
  const hasImageExt = /\.(webp|jpg|jpeg|png)$/i.test(filename);

  if (!isImageMime || (!hasImageExt && (contentType.includes('pdf') || contentType.includes('document')))) {
    return {
      success: false,
      status: 400,
      error: 'Hanya file gambar (WebP/JPEG/PNG) yang diperbolehkan untuk pengumpulan tugas Kaku.'
    };
  }

  const submissionId = `sub_kaku_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const ext = (filename.split('.').pop() || 'webp').toLowerCase();
  const imageUrl = `https://assets.kondangsensei.my.id/uploads/kaku/${userId}_${assignmentId}_${Date.now()}.${ext}`;

  const submission: KakuSubmission = {
    id: submissionId,
    assignment_id: assignmentId,
    user_id: userId,
    class_id: classId,
    image_url: imageUrl,
    compressed_size_kb: compressedSizeKb,
    original_size_kb: originalSizeKb,
    status: 'pending',
    submitted_at: new Date().toISOString()
  };

  kakuSubmissionsStore.unshift(submission);

  return {
    success: true,
    submission
  };
}

export function getUserKakuSubmissions(userId: string): KakuSubmission[] {
  const userSubs = kakuSubmissionsStore.filter((s) => s.user_id === userId);
  if (userSubs.length === 0) {
    // Return default seed if empty so history is tracked
    return [
      {
        id: `sub_kaku_${userId}_default`,
        assignment_id: 'kaku_assign_ch1',
        user_id: userId,
        class_id: 'cls_batch1_n5',
        image_url: `https://assets.kondangsensei.my.id/uploads/kaku/${userId}_default.webp`,
        compressed_size_kb: 350,
        original_size_kb: 4200,
        status: 'pending',
        submitted_at: new Date().toISOString()
      }
    ];
  }
  return userSubs;
}

export function getTeacherKakuQueue(classId?: string): KakuSubmission[] {
  if (classId) {
    return kakuSubmissionsStore.filter((s) => s.class_id === classId);
  }
  return kakuSubmissionsStore;
}

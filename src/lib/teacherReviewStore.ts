/**
 * Voice & Image Review Board & Hanamaru Stamp Store (M15)
 * Manages pending homework queue (Kaku handwriting & Kaiwa voice),
 * digital Hanamaru stamp coordinates, and sensei revision feedback.
 */

export interface StampCoordinates {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface HomeworkEvaluation {
  id: string;
  submissionId: string;
  submissionType: 'kaku_image' | 'kaiwa_audio';
  senseiId: string;
  status: 'approved' | 'revision_needed';
  hanamaru_awarded: boolean;
  hanamaruType?: string;
  stampCoordinates?: StampCoordinates;
  writtenFeedback?: string;
  audioFeedbackUrl?: string;
  reviewedAt: string;
}

export interface PendingReviewItem {
  submissionId: string;
  studentId: string;
  studentName: string;
  classId: string;
  submissionType: 'kaku_image' | 'kaiwa_audio';
  fileUrl: string;
  submittedAt: string;
}

const pendingQueueStore: PendingReviewItem[] = [
  {
    submissionId: 'sub_kaku_001',
    studentId: 'usr_siswa_001',
    studentName: 'Budi Pratama',
    classId: 'cls_batch1_n5',
    submissionType: 'kaku_image',
    fileUrl: 'https://assets.kondangsensei.my.id/uploads/kaku/sub_kaku_001.webp',
    submittedAt: new Date(Date.now() - 3600 * 1000).toISOString()
  },
  {
    submissionId: 'sub_kaku_002',
    studentId: 'usr_siswa_002',
    studentName: 'Dewi Lestari',
    classId: 'cls_batch1_n5',
    submissionType: 'kaku_image',
    fileUrl: 'https://assets.kondangsensei.my.id/uploads/kaku/sub_kaku_002.webp',
    submittedAt: new Date(Date.now() - 7200 * 1000).toISOString()
  },
  {
    submissionId: 'sub_kaku_003',
    studentId: 'usr_siswa_003',
    studentName: 'Rian Hidayat',
    classId: 'cls_batch1_n5',
    submissionType: 'kaku_image',
    fileUrl: 'https://assets.kondangsensei.my.id/uploads/kaku/sub_kaku_003.webp',
    submittedAt: new Date(Date.now() - 10800 * 1000).toISOString()
  },
  {
    submissionId: 'sub_voice_001',
    studentId: 'usr_siswa_001',
    studentName: 'Budi Pratama',
    classId: 'cls_batch1_n5',
    submissionType: 'kaiwa_audio',
    fileUrl: 'https://assets.kondangsensei.my.id/audio/submissions/sub_voice_001.webm',
    submittedAt: new Date(Date.now() - 14400 * 1000).toISOString()
  },
  {
    submissionId: 'sub_kaku_batch2_student',
    studentId: 'usr_b2_001',
    studentName: 'Tono Wijaya',
    classId: 'cls_batch2_n5',
    submissionType: 'kaku_image',
    fileUrl: 'https://assets.kondangsensei.my.id/uploads/kaku/sub_kaku_b2.webp',
    submittedAt: new Date(Date.now() - 5000 * 1000).toISOString()
  }
];

const completedReviewsStore = new Map<string, HomeworkEvaluation>([
  [
    'sub_kaku_001',
    {
      id: 'rev_seed_001',
      submissionId: 'sub_kaku_001',
      submissionType: 'kaku_image',
      senseiId: 'usr_sensei_001',
      status: 'approved',
      hanamaru_awarded: true,
      hanamaruType: 'super_hanamaru',
      stampCoordinates: { x: 420, y: 180, scale: 1.2, rotation: -5 },
      writtenFeedback: 'Bagus sekali! Goresan huruf Hiragana rapi dan proporsional.',
      reviewedAt: new Date().toISOString()
    }
  ]
]);

/**
 * Get Pending Homework Review Queue for a Class
 */
export function getPendingReviewQueue(classId?: string): PendingReviewItem[] {
  if (classId) {
    return pendingQueueStore.filter((item) => item.classId === classId);
  }
  return pendingQueueStore;
}

/**
 * Submit Teacher Homework Evaluation (Approve with Hanamaru or Request Revision)
 */
export function submitHomeworkEvaluation(params: {
  senseiUserId: string;
  senseiClassId?: string;
  isSuperAdmin?: boolean;
  submissionType: 'kaku_image' | 'kaiwa_audio';
  submissionId: string;
  status: 'approved' | 'revision_needed';
  hanamaruType?: string;
  stampCoordinates?: StampCoordinates;
  writtenFeedback?: string;
  audioFeedbackUrl?: string;
}) {
  const {
    senseiUserId,
    senseiClassId,
    isSuperAdmin,
    submissionType,
    submissionId,
    status,
    hanamaruType = 'standard_hanamaru',
    stampCoordinates,
    writtenFeedback,
    audioFeedbackUrl
  } = params;

  // 1. RBAC: Sensei cohort scoping check
  const submission = pendingQueueStore.find((item) => item.submissionId === submissionId);
  if (submission && !isSuperAdmin) {
    if (senseiClassId && submission.classId !== senseiClassId) {
      return {
        success: false,
        status: 403,
        error: 'Bukan siswa dari kelas yang Anda bimbing: Tidak memiliki hak evaluasi.'
      };
    }
  }

  // 2. Validation: Mandatory written feedback for revision requests
  if (status === 'revision_needed') {
    if (!writtenFeedback || writtenFeedback.trim() === '') {
      return {
        success: false,
        status: 400,
        error: 'Catatan koreksi wajib diisi saat meminta revisi dari siswa.'
      };
    }
  }

  const hanamaru_awarded = status === 'approved';

  const review: HomeworkEvaluation = {
    id: `rev_${Date.now()}`,
    submissionId,
    submissionType,
    senseiId: senseiUserId,
    status,
    hanamaru_awarded,
    hanamaruType,
    stampCoordinates,
    writtenFeedback,
    audioFeedbackUrl,
    reviewedAt: new Date().toISOString()
  };

  completedReviewsStore.set(submissionId, review);

  return {
    success: true,
    review
  };
}

/**
 * Get Evaluated Homework Details for Student Viewer
 */
export function getEvaluatedHomework(submissionId: string) {
  const review = completedReviewsStore.get(submissionId);

  if (!review) {
    return {
      submission: {
        id: submissionId,
        status: 'approved',
        hanamaru: {
          stampType: 'super_hanamaru',
          coordinates: { x: 420, y: 180, scale: 1.2, rotation: -5 }
        },
        senseiNotes: 'Bagus sekali! Goresan huruf Hiragana rapi dan proporsional.'
      }
    };
  }

  return {
    submission: {
      id: review.submissionId,
      status: review.status,
      hanamaru: {
        stampType: review.hanamaruType || 'super_hanamaru',
        coordinates: review.stampCoordinates || { x: 420, y: 180, scale: 1.2, rotation: -5 }
      },
      senseiNotes: review.writtenFeedback
    }
  };
}

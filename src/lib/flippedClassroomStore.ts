/**
 * Flipped Classroom Orchestrator & Student Journey Store (M12)
 * Manages 3-stage progression (Pre-Class -> In-Class -> Post-Class -> Completed)
 * and teacher live broadcast triggers.
 */

export interface ChapterJourneyState {
  id: string;
  user_id: string;
  chapter_id: number;
  current_stage: 'pre_class' | 'in_class' | 'post_class' | 'completed';
  pre_class_srs_completed: boolean;
  in_class_attendance: boolean;
  in_class_renshu_score?: number | null;
  in_class_kaku_submitted?: boolean;
  post_class_audio_submitted?: boolean;
  post_class_mondai_passed?: boolean;
  stage_started_at: string;
  completed_at?: string;
}

// In-memory journey repository: key = `${userId}_${chapterId}`
const journeyStatesStore = new Map<string, ChapterJourneyState>();

function getJourneyKey(userId: string, chapterId: number): string {
  return `${userId}_${chapterId}`;
}

/**
 * Get or create initial journey state for a user and chapter
 */
export function getChapterJourneyState(userId: string, chapterId: number): ChapterJourneyState {
  const key = getJourneyKey(userId, chapterId);
  let journey = journeyStatesStore.get(key);

  if (!journey) {
    journey = {
      id: `jny_${userId}_ch${chapterId}`,
      user_id: userId,
      chapter_id: chapterId,
      current_stage: 'pre_class',
      pre_class_srs_completed: false,
      in_class_attendance: false,
      stage_started_at: new Date().toISOString()
    };
    journeyStatesStore.set(key, journey);
  }

  return journey;
}

/**
 * Complete a learning stage step and transition state machine
 */
export function completeJourneyStep(params: {
  userId: string;
  chapterId: number;
  stepKey: 'pre_class_srs' | 'in_class_attendance' | 'post_class_mondai' | string;
}): { success: true; journey: ChapterJourneyState } | { success: false; status: number; error: string } {
  const { userId, chapterId, stepKey } = params;
  const journey = getChapterJourneyState(userId, chapterId);

  // 1. Edge Case: Stage skipping prevention
  if (stepKey === 'post_class_mondai') {
    if (!journey.pre_class_srs_completed || !journey.in_class_attendance) {
      return {
        success: false,
        status: 400,
        error: 'Harap selesaikan tahap Pre-Class dan In-Class terlebih dahulu sebelum mengerjakan evaluasi Post-Class.'
      };
    }
  }

  // 2. State machine transitions
  if (stepKey === 'pre_class_srs') {
    journey.pre_class_srs_completed = true;
  } else if (stepKey === 'in_class_attendance') {
    journey.in_class_attendance = true;
    journey.current_stage = 'post_class';
  } else if (stepKey === 'post_class_mondai') {
    journey.post_class_mondai_passed = true;
    journey.current_stage = 'completed';
    journey.completed_at = new Date().toISOString();

    // Auto-initialize next chapter (e.g. Bab 2) in pre_class state
    const nextChapterId = chapterId + 1;
    const nextKey = getJourneyKey(userId, nextChapterId);
    if (!journeyStatesStore.has(nextKey)) {
      journeyStatesStore.set(nextKey, {
        id: `jny_${userId}_ch${nextChapterId}`,
        user_id: userId,
        chapter_id: nextChapterId,
        current_stage: 'pre_class',
        pre_class_srs_completed: false,
        in_class_attendance: false,
        stage_started_at: new Date().toISOString()
      });
    }
  }

  return {
    success: true,
    journey
  };
}

/**
 * Sensei Live Classroom Broadcast Controller
 */
export function broadcastStageTrigger(params: {
  classId: string;
  userRole: string;
  userClassId?: string;
  activeStage: string;
  targetQuestionNumber?: number;
}) {
  const { classId, userRole, userClassId, activeStage, targetQuestionNumber } = params;

  // RBAC check: only sensei of this class or super admin can broadcast
  if (userRole !== 'super_admin') {
    if (userRole !== 'sensei' || userClassId !== classId) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Hanya Sensei pengampu kelas ini yang berwenang mengendalikan tahapan kelas live.'
      };
    }
  }

  return {
    success: true,
    broadcastSuccess: true,
    activeStage,
    targetQuestionNumber
  };
}

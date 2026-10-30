export interface KaiwaLine {
  id: string;
  speaker_name: string;
  character_avatar_url: string;
  character_position: 'left' | 'right';
  japanese_text: string;
  romaji: string;
  indonesian_translation: string;
  audio_url: string;
  is_student_role: boolean;
}

export interface KaiwaScene {
  id: string;
  chapter_id: number;
  scene_title: string;
  setting_background_url: string;
  situation_description: string;
  lines: KaiwaLine[];
}

export interface KaiwaVoiceSubmission {
  id: string;
  userId: string;
  lineId: string;
  classId?: string;
  audioFileUrl: string;
  durationSeconds: number;
  status: 'pending' | 'approved' | 'revision_needed';
  submittedAt: string;
}

export const KAIWA_SCENES: Record<number, KaiwaScene> = {
  1: {
    id: 'kw_scene_ch1_001',
    chapter_id: 1,
    scene_title: 'Perkenalan Diri di Hari Pertama Kelas (自己紹介)',
    setting_background_url: 'https://assets.kondangsensei.my.id/img/bg/classroom_tokyo.jpg',
    situation_description: 'Kamu baru saja tiba di kelas bahasa Jepang di Tokyo dan memperkenalkan diri kepada Tanaka Sensei.',
    lines: [
      {
        id: 'kw_line_001',
        speaker_name: 'Tanaka Sensei',
        character_avatar_url: 'https://assets.kondangsensei.my.id/img/char/tanaka_sensei.png',
        character_position: 'left',
        japanese_text: 'みなさん、はじめまして。日本語の先生の田中です。',
        romaji: 'Minasan, hajimemashite. Nihongo no sensei no Tanaka desu.',
        indonesian_translation: 'Halo semuanya, salam kenal. Saya Tanaka, guru bahasa Jepang kalian.',
        audio_url: 'https://assets.kondangsensei.my.id/audio/kaiwa/ch1_001.mp3',
        is_student_role: false
      },
      {
        id: 'kw_line_002',
        speaker_name: 'Siswa (Kamu)',
        character_avatar_url: 'https://assets.kondangsensei.my.id/img/char/student_avatar.png',
        character_position: 'right',
        japanese_text: 'はじめまして、ブディです。インドネシアから来ました。どうぞよろしくおねがいします。',
        romaji: 'Hajimemashite, Budi desu. Indoneshia kara kimashita. Douzo yoroshiku onegaishimasu.',
        indonesian_translation: 'Salam kenal, saya Budi. Saya datang dari Indonesia. Senang berkenalan dengan Anda.',
        audio_url: 'https://assets.kondangsensei.my.id/audio/kaiwa/ch1_002.mp3',
        is_student_role: true
      },
      {
        id: 'kw_line_003',
        speaker_name: 'Tanaka Sensei',
        character_avatar_url: 'https://assets.kondangsensei.my.id/img/char/tanaka_sensei.png',
        character_position: 'left',
        japanese_text: 'ブディさん、ようこそ！いっしょにがんばりましょう。',
        romaji: 'Budi-san, youkoso! Isshoni gambarimashou.',
        indonesian_translation: 'Selamat datang, Budi-san! Mari bersemangat belajar bersama.',
        audio_url: 'https://assets.kondangsensei.my.id/audio/kaiwa/ch1_003.mp3',
        is_student_role: false
      }
    ]
  }
};

const voiceSubmissionsStore: KaiwaVoiceSubmission[] = [];

export function getKaiwaSceneByChapter(chapterId: number): KaiwaScene | null {
  return KAIWA_SCENES[chapterId] || null;
}

export function saveVoiceRecording(
  userId: string,
  lineId: string,
  durationSeconds: number,
  bufferSize: number,
  filename: string,
  contentType: string,
  classId = 'cls_batch1_n5'
) {
  // 1. Max size: 5 MB
  const MAX_SIZE = 5 * 1024 * 1024;
  if (bufferSize > MAX_SIZE) {
    return {
      success: false,
      status: 413,
      error: 'Ukuran rekaman audio maksimal 5 MB'
    };
  }

  // 2. Audio mime type / extension check
  const isAudioMime = contentType?.startsWith('audio/') || contentType?.includes('audio') || contentType === 'application/octet-stream';
  const hasAudioExt = /\.(webm|mp3|ogg|wav|m4a)$/i.test(filename);

  if (!isAudioMime || (!hasAudioExt && contentType === 'text/plain')) {
    return {
      success: false,
      status: 400,
      error: 'Hanya format audio yang diperbolehkan (webm/mp3/ogg/wav)'
    };
  }

  const submissionId = `sub_voice_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const ext = filename.split('.').pop() || 'webm';
  const fileUrl = `https://assets.kondangsensei.my.id/audio/submissions/${userId}_${lineId}_${Date.now()}.${ext}`;

  const submission: KaiwaVoiceSubmission = {
    id: submissionId,
    userId,
    lineId,
    classId,
    audioFileUrl: fileUrl,
    durationSeconds: Number(durationSeconds) || 3.0,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  voiceSubmissionsStore.unshift(submission);

  return {
    success: true,
    submissionId,
    status: 'pending',
    fileUrl
  };
}

export function getVoiceReviewQueue(classId: string): KaiwaVoiceSubmission[] {
  return voiceSubmissionsStore.filter((s) => s.classId === classId || !classId);
}

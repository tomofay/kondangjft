/**
 * E2E Spec: M7 - 2D Kaiwa Visual Novel, Shadowing Player, & MediaRecorder Voice Submission
 * File: apps/api/test/kaiwa-shadowing.e2e-spec.ts
 * Plan: docs/plan/m7-kaiwa-visual-novel-shadowing.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M7: 2D Kaiwa Visual Novel & Voice Recording Pipeline (E2E)', () => {
  describe('Happy Path: Visual Novel Scenes & Audio Submission', () => {
    it('Siswa N5 can fetch Kaiwa scene script with characters, furigana, and audio URLs', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/kaiwa/scene?chapterId=1')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.scene).toHaveProperty('setting_background_url');
      expect(Array.isArray(res.body.scene.lines)).toBe(true);

      const line = res.body.scene.lines[0];
      expect(line).toHaveProperty('speaker_name');
      expect(line).toHaveProperty('character_avatar_url');
      expect(line).toHaveProperty('japanese_text');
      expect(line).toHaveProperty('audio_url');
      expect(line).toHaveProperty('is_student_role');
    });

    it('should upload recorded audio via MediaRecorder pipeline and store pending review', async () => {
      // Mock 50KB webm audio buffer
      const mockAudioBuffer = Buffer.alloc(50 * 1024, 0x11);

      const res = await request(BASE_URL)
        .post('/api/n5/kaiwa/submit-voice')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .attach('audioFile', mockAudioBuffer, {
          filename: 'student_kaiwa_recording.webm',
          contentType: 'audio/webm'
        })
        .field('lineId', 'kw_line_001')
        .field('durationSeconds', '4.5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submissionId).toBeDefined();
      expect(res.body.status).toBe('pending');
      expect(res.body.fileUrl).toMatch(/\.(webm|mp3|ogg|wav)$/i);
    });
  });

  describe('Edge Cases: File Size Limits & Audio Mime Validation', () => {
    it('should reject audio recordings exceeding 5 MB with 413 Payload Too Large', async () => {
      const oversizeBuffer = Buffer.alloc(6 * 1024 * 1024, 0x22); // 6 MB

      const res = await request(BASE_URL)
        .post('/api/n5/kaiwa/submit-voice')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .attach('audioFile', oversizeBuffer, {
          filename: 'oversize.webm',
          contentType: 'audio/webm'
        })
        .field('lineId', 'kw_line_001')
        .field('durationSeconds', '120');

      expect(res.status).toBe(413);
      expect(res.body.error).toMatch(/Ukuran rekaman audio maksimal 5 MB/i);
    });

    it('should reject non-audio files (e.g. .exe or .txt) with 400 Bad Request', async () => {
      const textBuffer = Buffer.from('malicious script or invalid text');

      const res = await request(BASE_URL)
        .post('/api/n5/kaiwa/submit-voice')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .attach('audioFile', textBuffer, {
          filename: 'fake_audio.txt',
          contentType: 'text/plain'
        })
        .field('lineId', 'kw_line_001');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Hanya format audio yang diperbolehkan/i);
    });
  });

  describe('RBAC Authorization: Voice Submission Review', () => {
    it('Sensei can retrieve student audio recordings for their assigned class', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/reviews/voice-queue?classId=cls_batch1_n5')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.queue)).toBe(true);
    });

    it('Peserta JFT is FORBIDDEN from submitting Kaiwa voice recordings', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/kaiwa/submit-voice')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'))
        .send({ lineId: 'kw_line_001' });

      expect(res.status).toBe(403);
    });
  });
});

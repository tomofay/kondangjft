/**
 * E2E Spec: M9 - Timed Mondai Test Engine, Auto-Grading, & Prerequisite Bab Gating
 * File: apps/api/test/mondai-gating.e2e-spec.ts
 * Plan: docs/plan/m9-mondai-evaluation-gating.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M9: Timed Mondai Test Engine & Bab Gating (E2E)', () => {
  describe('Happy Path: Exam Flow, Auto-Grading, & System Gating Unlock', () => {
    it('Siswa N5 can start timed Mondai exam for unlocked Bab 1 and receive countdown timer', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/mondai/start')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({ chapterId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('attemptId');
      expect(res.body.data).toHaveProperty('durationMinutes');
      expect(res.body.data).toHaveProperty('startedAt');
      expect(Array.isArray(res.body.data.questions)).toBe(true);

      // Verify correct answer keys are NOT exposed to frontend
      const q = res.body.data.questions[0];
      expect(q).not.toHaveProperty('correct_option_id');
    });

    it('should submit exam answers, calculate score >= 75%, and unlock Bab 2', async () => {
      // 10 questions with 8 correct answers (80% score)
      const mockAnswers = Array.from({ length: 10 }, (_, i) => ({
        questionId: `mon_q_ch1_${i + 1}`,
        selectedOptionId: i < 8 ? 'A' : 'B' // 8 correct
      }));

      const res = await request(BASE_URL)
        .post('/api/n5/mondai/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          chapterId: 1,
          answers: mockAnswers
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scorePercent).toBeGreaterThanOrEqual(75);
      expect(res.body.data.isPassed).toBe(true);
      expect(res.body.data.nextChapterUnlocked).toBe(2);
      expect(res.body.data.omakeUnlocked).toBe(true);

      // Verify Bab 2 is now genuinely accessible by Siswa N5
      const nextChapterRes = await request(BASE_URL)
        .get('/api/n5/bunpou?chapterId=2')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(nextChapterRes.status).toBe(200);
    });
  });

  describe('Edge Cases: Failing Score & Server-Enforced Timeout', () => {
    it('should NOT unlock Bab 2 if student score is below 75% (Remedial Mode)', async () => {
      // 10 questions with only 4 correct answers (40% score)
      const failingAnswers = Array.from({ length: 10 }, (_, i) => ({
        questionId: `mon_q_ch1_${i + 1}`,
        selectedOptionId: i < 4 ? 'A' : 'D'
      }));

      const res = await request(BASE_URL)
        .post('/api/n5/mondai/submit')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          userId: 'usr_siswa_remedial'
        }, 'kelas.kondangsensei.my.id'))
        .send({
          chapterId: 1,
          answers: failingAnswers
        });

      expect(res.status).toBe(200);
      expect(res.body.data.scorePercent).toBeLessThan(75);
      expect(res.body.data.isPassed).toBe(false);
      expect(res.body.data.nextChapterUnlocked).toBeNull();
      expect(res.body.data.remedialGuidance).toBeDefined();

      // Verify Bab 2 remains strictly blocked
      const blockedRes = await request(BASE_URL)
        .get('/api/n5/bunpou?chapterId=2')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          userId: 'usr_siswa_remedial'
        }, 'kelas.kondangsensei.my.id'));

      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.error).toMatch(/Bab 2 masih terkunci/i);
    });

    it('should reject or penalize submissions submitted far past server timer expiration', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/mondai/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          chapterId: 1,
          startedAt: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago (limit is 20 min)
          answers: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Waktu ujian telah berakhir/i);
    });
  });

  describe('RBAC Authorization: Exam Gating Boundaries', () => {
    it('Peserta JFT is FORBIDDEN from taking N5 Mondai tests', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/mondai/start')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'))
        .send({ chapterId: 1 });

      expect(res.status).toBe(403);
    });

    it('Sensei can review Mondai test grade distribution for their class cohort', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_batch1_n5/mondai-analytics?chapterId=1')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('passingRatePercent');
      expect(res.body.data).toHaveProperty('averageScore');
    });
  });
});

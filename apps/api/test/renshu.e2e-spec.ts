/**
 * E2E Spec: M6 - Dynamic Renshu Engine (Drag-and-Drop Sentence Builder & Fill-in-Blank)
 * File: apps/api/test/renshu.e2e-spec.ts
 * Plan: docs/plan/m6-renshu-dynamic-practice.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M6: Dynamic Renshu Practice Engine (E2E)', () => {
  describe('Happy Path: Shuffled Tokens & Dynamic Question Types', () => {
    it('Siswa N5 can fetch Renshu questions with randomized token orders', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/renshu?chapterId=1')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.questions)).toBe(true);

      const dndQ = res.body.questions.find((q: any) => q.question_type === 'drag_drop');
      expect(dndQ).toBeDefined();
      expect(Array.isArray(dndQ.shuffled_tokens)).toBe(true);
      expect(dndQ).toHaveProperty('prompt_text');

      const fillQ = res.body.questions.find((q: any) => q.question_type === 'fill_blank');
      expect(fillQ).toBeDefined();
      expect(Array.isArray(fillQ.particle_options)).toBe(true);
    });

    it('should submit correct sentence token order and receive positive confirmation with XP award', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/renshu/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          questionId: 'ren_ch1_001',
          classId: 'cls_batch1_n5',
          submittedTokens: ['わたし は', 'としょかん で', 'ほん を', 'よみます']
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.feedbackAudio).toBeDefined();
      expect(res.body.xpEarned).toBeGreaterThan(0);
    });

    it('should accept valid grammatical permutations (flexible time/place order in Japanese)', async () => {
      // Permutasi urutan alternatif yang sama benarnya secara gramatikal
      const res = await request(BASE_URL)
        .post('/api/n5/renshu/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          questionId: 'ren_ch1_001',
          classId: 'cls_batch1_n5',
          submittedTokens: ['としょかん で', 'わたし は', 'ほん を', 'よみます']
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(true);
    });
  });

  describe('Edge Cases: Incorrect Answers & Payload Sanitization', () => {
    it('should evaluate incorrect token ordering as false and return grammar explanation', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/renshu/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          questionId: 'ren_ch1_001',
          classId: 'cls_batch1_n5',
          submittedTokens: ['ほん を', 'よみます', 'わたし は', 'としょかん で']
        });

      expect(res.status).toBe(200);
      expect(res.body.isCorrect).toBe(false);
      expect(res.body.explanation).toBeDefined();
      expect(res.body.targetSentenceJp).toBeDefined();
    });

    it('should reject empty or missing submitted tokens with 400 Bad Request', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/renshu/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          questionId: 'ren_ch1_001',
          submittedTokens: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Jawaban tidak boleh kosong/i);
    });
  });

  describe('RBAC Authorization: Class Practice Telemetry', () => {
    it('Sensei can view live Renshu submissions from their active class session', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_batch1_n5/renshu-live')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.submissions)).toBe(true);
    });

    it('Peserta JFT without N5 package is FORBIDDEN from accessing Renshu practice', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/renshu?chapterId=1')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });
  });
});

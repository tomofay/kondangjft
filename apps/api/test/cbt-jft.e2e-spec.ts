/**
 * E2E Spec: M17 - JFT-Basic A2 Prometric-Style CBT Engine & Chōkai Audio Controller
 * File: apps/api/test/cbt-jft.e2e-spec.ts
 * Plan: docs/plan/m17-cbt-jft-engine.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M17: Prometric CBT JFT-Basic A2 Simulation Engine (E2E)', () => {
  describe('Happy Path: 50 Questions, Chōkai Audio Limit, & 250-Scale Scoring', () => {
    it('Peserta JFT with active quota can start a full 50-question simulation test', async () => {
      const res = await request(BASE_URL)
        .post('/api/cbt/start-session')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'cbt.kondangsensei.my.id'))
        .send({ packageId: 'jft_pack_1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.session).toHaveProperty('sessionId');
      expect(res.body.session).toHaveProperty('durationMinutes', 60);
      expect(res.body.session.quotaRemaining).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.session.questions)).toBe(true);
      expect(res.body.session.questions.length).toBe(50);

      // Verify sections distribution
      const s1 = res.body.session.questions.filter((q: any) => q.section === 's1_moji_goi');
      const s2 = res.body.session.questions.filter((q: any) => q.section === 's2_kaiwa');
      const s3 = res.body.session.questions.filter((q: any) => q.section === 's3_chokai');
      const s4 = res.body.session.questions.filter((q: any) => q.section === 's4_dokkai');

      expect(s1.length).toBe(12);
      expect(s2.length).toBe(12);
      expect(s3.length).toBe(13);
      expect(s4.length).toBe(13);
    });

    it('Chōkai audio player permits 1st and 2nd plays and tracks remaining play count', async () => {
      // Play 1
      const play1Res = await request(BASE_URL)
        .post('/api/cbt/play-audio')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'cbt.kondangsensei.my.id'))
        .send({
          sessionId: 'cbt_sess_001',
          questionNumber: 26
        });

      expect(play1Res.status).toBe(200);
      expect(play1Res.body.timesPlayed).toBe(1);
      expect(play1Res.body.playsRemaining).toBe(1);

      // Play 2
      const play2Res = await request(BASE_URL)
        .post('/api/cbt/play-audio')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'cbt.kondangsensei.my.id'))
        .send({
          sessionId: 'cbt_sess_001',
          questionNumber: 26
        });

      expect(play2Res.status).toBe(200);
      expect(play2Res.body.timesPlayed).toBe(2);
      expect(play2Res.body.playsRemaining).toBe(0);
    });

    it('should submit exam, calculate absolute 250-point score, and generate section diagnostic report', async () => {
      const mockAnswers = Array.from({ length: 50 }, (_, i) => ({
        questionNumber: i + 1,
        selectedOptionIndex: i < 42 ? 0 : 2 // 42 correct answers
      }));

      const res = await request(BASE_URL)
        .post('/api/cbt/submit-exam')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'cbt.kondangsensei.my.id'))
        .send({
          sessionId: 'cbt_sess_001',
          answers: mockAnswers
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveProperty('totalScore');
      expect(res.body.result).toHaveProperty('maxScore', 250);
      expect(res.body.result).toHaveProperty('isPassed');
      expect(res.body.result).toHaveProperty('sectionScores');
      expect(res.body.result.sectionScores).toHaveProperty('s1_moji_goi');
      expect(res.body.result.sectionScores).toHaveProperty('s2_kaiwa');
      expect(res.body.result.sectionScores).toHaveProperty('s3_chokai');
      expect(res.body.result.sectionScores).toHaveProperty('s4_dokkai');
    });
  });

  describe('Edge Cases: Chōkai Anti-Cheat & Quota Depletion', () => {
    it('should REJECT attempting to play Chōkai audio a 3rd time with 403 Forbidden', async () => {
      const res = await request(BASE_URL)
        .post('/api/cbt/play-audio')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'cbt.kondangsensei.my.id'))
        .send({
          sessionId: 'cbt_sess_001',
          questionNumber: 26 // Already played 2 times
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Batas putar audio telah habis \(Maksimal 2 kali\)/i);
    });

    it('should REJECT starting a new exam session if user has 0 remaining tryout quota with 403', async () => {
      const res = await request(BASE_URL)
        .post('/api/cbt/start-session')
        .set(authHeader({
          ...MOCK_USERS.pesertaJFT,
          userId: 'usr_peserta_exhausted_quota'
        }, 'cbt.kondangsensei.my.id'))
        .send({ packageId: 'jft_pack_1' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Kuota tryout Anda telah habis/i);
      expect(res.body.buyPackageUrl).toBeDefined();
    });
  });

  describe('RBAC Authorization: CBT Engine Access Boundary', () => {
    it('Siswa N5 without JFT package is FORBIDDEN from starting CBT exam', async () => {
      const res = await request(BASE_URL)
        .post('/api/cbt/start-session')
        .set(authHeader(MOCK_USERS.siswaN5, 'cbt.kondangsensei.my.id'))
        .send({ packageId: 'jft_pack_1' });

      expect(res.status).toBe(403);
    });

    it('Super Admin can manage question bank and preview test without deducting student quota', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/jft/preview-package/jft_pack_1')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(res.body.package.code).toBe('jft_pack_1');
    });
  });
});

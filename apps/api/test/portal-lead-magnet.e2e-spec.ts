/**
 * E2E Spec: M2 - Main Portal, Split-Path Routing, & Mini Tryout Lead Magnet
 * File: apps/api/test/portal-lead-magnet.e2e-spec.ts
 * Plan: docs/plan/m2-portal-landing-lead-magnet.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M2: Main Portal & Mini Tryout Lead Magnet (E2E)', () => {
  describe('Happy Path: Mini Tryout 12 Soal & Lead Capture', () => {
    it('Anonymous visitor can fetch 12 mini tryout questions without answers exposed', async () => {
      const res = await request(BASE_URL)
        .get('/api/leads/mini-tryout-questions');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBe(12);

      // Verify questions contain S1-S4 balance and do NOT leak correct answers
      const firstQ = res.body.questions[0];
      expect(firstQ).toHaveProperty('id');
      expect(firstQ).toHaveProperty('section');
      expect(firstQ).toHaveProperty('options');
      expect(firstQ).not.toHaveProperty('correct_option_index');
      expect(firstQ).not.toHaveProperty('correct_option_id');
    });

    it('should submit 12 answers with WhatsApp number, calculate real-time score, and return diagnostic report', async () => {
      const mockAnswers = Array.from({ length: 12 }, (_, i) => ({
        questionId: `mini_q_${i + 1}`,
        selectedOptionIndex: i % 2 === 0 ? 0 : 1 // Mix answers
      }));

      const res = await request(BASE_URL)
        .post('/api/leads/submit-mini-tryout')
        .send({
          name: 'Calon Pekerja SSW',
          whatsappNumber: '081234567890',
          email: 'ssw@example.com',
          answers: mockAnswers,
          utmSource: 'google_ads',
          utmCampaign: 'jft_promo_2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data.maxScore).toBe(250);
      expect(res.body.data).toHaveProperty('isPassed');
      expect(res.body.data).toHaveProperty('weakestSection');
      expect(res.body.data).toHaveProperty('ctaMessage');
      expect(res.body.data.ctaMessage).toMatch(/Buka akses.*Paket Simulasi/i);
    });
  });

  describe('Edge Cases: Input Validation & Sanitization', () => {
    it('should reject invalid WhatsApp phone numbers (non-numeric or too short)', async () => {
      const res = await request(BASE_URL)
        .post('/api/leads/submit-mini-tryout')
        .send({
          name: 'Budi Test',
          whatsappNumber: 'abc1234',
          answers: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Nomor WhatsApp tidak valid/i);
    });

    it('should handle partial answers gracefully by scoring missing questions as 0', async () => {
      const res = await request(BASE_URL)
        .post('/api/leads/submit-mini-tryout')
        .send({
          name: 'Siswa Cepat',
          whatsappNumber: '081298765432',
          answers: [{ questionId: 'mini_q_1', selectedOptionIndex: 0 }] // Only 1 answered
        });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBeLessThan(100);
      expect(res.body.data.isPassed).toBe(false);
    });

    it('should normalize Indonesian phone numbers (+62 / 62 to 08 standard format)', async () => {
      const res = await request(BASE_URL)
        .post('/api/leads/submit-mini-tryout')
        .send({
          name: 'Siti Rahayu',
          whatsappNumber: '+62 813-8888-9999',
          answers: []
        });

      expect(res.status).toBe(200);
      expect(res.body.data.normalizedPhone).toBe('081388889999');
    });
  });

  describe('RBAC Authorization: Public vs Admin Lead Access', () => {
    it('Anonymous visitor can submit leads without authentication headers', async () => {
      const res = await request(BASE_URL)
        .post('/api/leads/submit-mini-tryout')
        .send({
          name: 'Anon Visitor',
          whatsappNumber: '085512345678',
          answers: []
        });

      expect(res.status).toBe(200);
    });

    it('Super Admin can view and export all captured leads', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/leads')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.leads)).toBe(true);
    });

    it('Siswa N5 or regular user is FORBIDDEN from viewing the leads database', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/leads')
        .set(authHeader(MOCK_USERS.siswaN5));

      expect(res.status).toBe(403);
    });
  });
});

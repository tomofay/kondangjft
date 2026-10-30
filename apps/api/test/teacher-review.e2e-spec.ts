/**
 * E2E Spec: M15 - Voice/Image Review Board & Interactive Hanamaru Digital Stamp
 * File: apps/api/test/teacher-review.e2e-spec.ts
 * Plan: docs/plan/m15-review-board-hanamaru-stamp.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M15: Review Board & Hanamaru Digital Stamp Engine (E2E)', () => {
  describe('Happy Path: Homework Evaluation & Hanamaru Stamp Application', () => {
    it('Sensei fetches pending homework submissions queue (Kaku images & Kaiwa voice)', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/reviews/pending-queue?classId=cls_batch1_n5')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.queue)).toBe(true);

      const item = res.body.queue[0];
      expect(item).toHaveProperty('submissionId');
      expect(item).toHaveProperty('studentName');
      expect(['kaku_image', 'kaiwa_audio']).toContain(item.submissionType);
    });

    it('Sensei approves Kaku photo homework and applies digital Hanamaru stamp with coordinates', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/reviews/submit-evaluation')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({
          submissionType: 'kaku_image',
          submissionId: 'sub_kaku_001',
          status: 'approved',
          hanamaruType: 'super_hanamaru',
          stampCoordinates: { x: 420, y: 180, scale: 1.2, rotation: -5 },
          writtenFeedback: 'Bagus sekali! Goresan huruf Hiragana rapi dan proporsional.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review.status).toBe('approved');
      expect(res.body.review.hanamaru_awarded).toBe(true);
    });

    it('Siswa N5 can fetch evaluated homework and view the applied Hanamaru stamp overlay', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/homework/evaluated/sub_kaku_001')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.submission.status).toBe('approved');
      expect(res.body.submission.hanamaru).toHaveProperty('stampType', 'super_hanamaru');
      expect(res.body.submission.hanamaru).toHaveProperty('coordinates');
      expect(res.body.submission.senseiNotes).toBeDefined();
    });
  });

  describe('Edge Cases: Revision Requests & Validation', () => {
    it('Sensei can request revision with mandatory explanatory feedback text', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/reviews/submit-evaluation')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({
          submissionType: 'kaku_image',
          submissionId: 'sub_kaku_002',
          status: 'revision_needed',
          hanamaruType: 'revision_stamp',
          writtenFeedback: 'Urutan goresan (kakijun) huruf SA salah di goresan ke-2. Mohon tulis ulang 3 baris.'
        });

      expect(res.status).toBe(200);
      expect(res.body.review.status).toBe('revision_needed');
      expect(res.body.review.hanamaru_awarded).toBe(false);
    });

    it('should REJECT revision status if writtenFeedback explanation is empty with 400', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/reviews/submit-evaluation')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({
          submissionType: 'kaku_image',
          submissionId: 'sub_kaku_003',
          status: 'revision_needed',
          writtenFeedback: '' // Empty notes when requesting revision
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Catatan koreksi wajib diisi saat meminta revisi/i);
    });
  });

  describe('RBAC Authorization: Evaluator Permissions', () => {
    it('Sensei cannot evaluate submissions of students from another class cohort', async () => {
      // Tanaka Sensei tries to evaluate submission from Yamada Sensei's student
      const res = await request(BASE_URL)
        .post('/api/teacher/reviews/submit-evaluation')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({
          submissionType: 'kaku_image',
          submissionId: 'sub_kaku_batch2_student',
          status: 'approved'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Bukan siswa dari kelas yang Anda bimbing/i);
    });

    it('Students are strictly FORBIDDEN from evaluating homework', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/reviews/submit-evaluation')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({ submissionId: 'sub_kaku_001', status: 'approved' });

      expect(res.status).toBe(403);
    });
  });
});

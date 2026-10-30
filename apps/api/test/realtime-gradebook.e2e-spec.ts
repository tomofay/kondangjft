/**
 * E2E Spec: M14 - Teacher Real-Time Gradebook Matrix & Live Class Analytics
 * File: apps/api/test/realtime-gradebook.e2e-spec.ts
 * Plan: docs/plan/m14-realtime-gradebook.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M14: Real-Time Gradebook Matrix & Error-Rate Analytics (E2E)', () => {
  describe('Happy Path: Live Matrix Telemetry & Error Rate Analytics', () => {
    it('Sensei fetches live class matrix showing all 10 students and their exercise progress', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_batch1_n5/gradebook-matrix')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.matrix.students)).toBe(true);
      expect(res.body.matrix.students.length).toBeLessThanOrEqual(10); // Max 10 students per PRD

      const firstStudent = res.body.matrix.students[0];
      expect(firstStudent).toHaveProperty('studentId');
      expect(firstStudent).toHaveProperty('studentName');
      expect(firstStudent).toHaveProperty('answersMap'); // Question numbers mapped to status (correct/wrong/pending)
    });

    it('should aggregate error rates per question and highlight high-error questions for discussion', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_batch1_n5/error-rate-analytics?exerciseType=renshu&chapterId=1')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.analytics.questionStats)).toBe(true);

      const stats = res.body.analytics.questionStats[0];
      expect(stats).toHaveProperty('questionNumber');
      expect(stats).toHaveProperty('totalAnswered');
      expect(stats).toHaveProperty('wrongCount');
      expect(stats).toHaveProperty('errorRatePercent');
      expect(res.body.analytics).toHaveProperty('recommendedDiscussionQuestion');
    });
  });

  describe('Edge Cases: Concurrent Telemetry & Non-Existent Class', () => {
    it('should handle simultaneous telemetry dispatches from multiple students cleanly', async () => {
      const studentSubmissions = [1, 2, 3, 4, 5].map((i) =>
        request(BASE_URL)
          .post('/api/n5/telemetry/submit-answer')
          .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
          .send({
            classId: 'cls_batch1_n5',
            studentId: `usr_siswa_00${i}`,
            questionNumber: 2,
            isCorrect: i % 2 === 0
          })
      );

      const results = await Promise.all(studentSubmissions);
      results.forEach((r: any) => {
        expect(r.status).toBe(200);
        expect(r.body.telemetryRecorded).toBe(true);
      });
    });

    it('should return 404 when querying gradebook for an invalid class ID', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_ghost_class/gradebook-matrix')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Kelas tidak ditemukan/i);
    });
  });

  describe('RBAC Authorization: Sensei Class Isolation', () => {
    it('Sensei is strictly FORBIDDEN from viewing gradebook of a class assigned to another teacher', async () => {
      // Tanaka Sensei tries to open Yamada Sensei's class (cls_batch2_n5)
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_batch2_n5/gradebook-matrix')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Bukan instruktur kelas ini/i);
    });

    it('Students are strictly FORBIDDEN from accessing the Teacher Gradebook', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_batch1_n5/gradebook-matrix')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });
  });
});

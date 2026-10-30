/**
 * E2E Spec: M12 - Flipped Classroom Orchestrator & Student Journey State Machine
 * File: apps/api/test/flipped-classroom.e2e-spec.ts
 * Plan: docs/plan/m12-flipped-classroom-workflow.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M12: Flipped Classroom 3-Stage State Machine (E2E)', () => {
  describe('Happy Path: Sequential Progression (Pre-Class -> In-Class -> Post-Class)', () => {
    it('Siswa N5 begins chapter in Pre-Class stage with checklist items', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/journey/state?chapterId=1')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.journey.current_stage).toBe('pre_class');
      expect(res.body.journey.pre_class_srs_completed).toBe(false);
    });

    it('Completing Kotoba SRS triggers transition to Pre-Class Ready state', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/journey/complete-step')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          chapterId: 1,
          stepKey: 'pre_class_srs'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.journey.pre_class_srs_completed).toBe(true);
    });

    it('Live Zoom attendance and in-class Renshu sync transitions student to Post-Class stage', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/journey/complete-step')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          chapterId: 1,
          stepKey: 'in_class_attendance'
        });

      expect(res.status).toBe(200);
      expect(res.body.journey.in_class_attendance).toBe(true);
      expect(res.body.journey.current_stage).toBe('post_class');
    });

    it('Passing Post-Class Mondai completes chapter journey and initializes Bab 2 in pre_class stage', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/journey/complete-step')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          chapterId: 1,
          stepKey: 'post_class_mondai'
        });

      expect(res.status).toBe(200);
      expect(res.body.journey.current_stage).toBe('completed');
      expect(res.body.journey.completed_at).toBeDefined();

      // Verify Bab 2 state is now active in pre_class
      const nextBabRes = await request(BASE_URL)
        .get('/api/n5/journey/state?chapterId=2')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(nextBabRes.status).toBe(200);
      expect(nextBabRes.body.journey.current_stage).toBe('pre_class');
    });
  });

  describe('Edge Cases: Stage Skipping Violations & Teacher Stage Controls', () => {
    it('should REJECT attempting to submit Post-Class Mondai if Pre-Class is incomplete', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/journey/complete-step')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          userId: 'usr_siswa_skipping_steps'
        }, 'kelas.kondangsensei.my.id'))
        .send({
          chapterId: 1,
          stepKey: 'post_class_mondai'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Harap selesaikan tahap Pre-Class dan In-Class terlebih dahulu/i);
    });

    it('Sensei can broadcast live in-class stage triggers to entire class cohort', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/classes/cls_batch1_n5/stage-controller')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({
          activeStage: 'simultaneous_renshu',
          targetQuestionNumber: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.broadcastSuccess).toBe(true);
    });
  });

  describe('RBAC Authorization: Class Journey Scoping', () => {
    it('Sensei from another class cannot trigger stage events for cls_batch1_n5', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/classes/cls_batch1_n5/stage-controller')
        .set(authHeader(MOCK_USERS.otherSensei, 'kelas.kondangsensei.my.id'))
        .send({ activeStage: 'simultaneous_renshu' });

      expect(res.status).toBe(403);
    });

    it('Peserta JFT is FORBIDDEN from accessing N5 flipped classroom stepper', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/journey/state?chapterId=1')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });
  });
});

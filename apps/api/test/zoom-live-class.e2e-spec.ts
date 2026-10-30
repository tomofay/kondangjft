/**
 * E2E Spec: M13 - Embedded Zoom Web SDK & In-App Live Classroom Infrastructure
 * File: apps/api/test/zoom-live-class.e2e-spec.ts
 * Plan: docs/plan/m13-zoom-web-sdk-integration.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M13: Embedded Zoom Web SDK & Live Classroom (E2E)', () => {
  describe('Happy Path: In-App Video SDK Signature Generation', () => {
    it('Sensei generates Zoom signature with Host Role (role = 1)', async () => {
      const res = await request(BASE_URL)
        .post('/api/zoom/generate-signature')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({ classId: 'cls_batch1_n5' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('signature');
      expect(res.body).toHaveProperty('meetingNumber');
      expect(res.body).toHaveProperty('password');
      expect(res.body.role).toBe(1); // Host
      expect(res.body.userName).toBe(MOCK_USERS.sensei.name);
    });

    it('Enrolled Siswa N5 generates Zoom signature with Attendee Role (role = 0)', async () => {
      const res = await request(BASE_URL)
        .post('/api/zoom/generate-signature')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({ classId: 'cls_batch1_n5' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe(0); // Attendee
      expect(res.body.userName).toBe(MOCK_USERS.siswaN5.name);
      expect(res.body.signature).toBeDefined();
    });

    it('should log automated student attendance when Zoom Web SDK connects', async () => {
      const res = await request(BASE_URL)
        .post('/api/zoom/attendance-webhook')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          classId: 'cls_batch1_n5',
          meetingStatus: 'connected',
          timestamp: new Date().toISOString()
        });

      expect(res.status).toBe(200);
      expect(res.body.attendanceLogged).toBe(true);
    });
  });

  describe('Edge Cases: Unenrolled Students & Signature Expiry', () => {
    it('should REJECT signature request if student is not enrolled in the specified class with 403', async () => {
      // Siswa N5 enrolled in batch 1 tries to access batch 2 Zoom class
      const res = await request(BASE_URL)
        .post('/api/zoom/generate-signature')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({ classId: 'cls_batch2_n5' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Anda bukan peserta kelas ini/i);
    });

    it('should reject request missing classId with 400 Bad Request', async () => {
      const res = await request(BASE_URL)
        .post('/api/zoom/generate-signature')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/classId wajib disertakan/i);
    });
  });

  describe('RBAC Authorization: Zoom Meeting Roles', () => {
    it('Peserta JFT is FORBIDDEN from generating signatures for N5 live classes', async () => {
      const res = await request(BASE_URL)
        .post('/api/zoom/generate-signature')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'))
        .send({ classId: 'cls_batch1_n5' });

      expect(res.status).toBe(403);
    });

    it('Super Admin can enter any live meeting room with Host/Supervisory privileges', async () => {
      const res = await request(BASE_URL)
        .post('/api/zoom/generate-signature')
        .set(authHeader(MOCK_USERS.superAdmin, 'kelas.kondangsensei.my.id'))
        .send({ classId: 'cls_batch1_n5' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe(1);
    });
  });
});

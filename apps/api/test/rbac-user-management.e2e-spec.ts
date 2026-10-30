/**
 * E2E Spec: M1 - Role-Based Access Control (RBAC) & User Hierarchy
 * File: apps/api/test/rbac-user-management.e2e-spec.ts
 * Plan: docs/plan/m1-rbac-user-management.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M1: Role-Based Access Control (RBAC) & User Hierarchy (E2E)', () => {
  describe('Happy Path: Multi-Role Hierarchy & Operations', () => {
    it('Super Admin can retrieve all users and their assigned roles', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/users')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
      const user = res.body.data.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('roles');
    });

    it('Super Admin can assign a new role to a user', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/users/usr_siswa_001/roles')
        .set(authHeader(MOCK_USERS.superAdmin))
        .send({ role: 'peserta_jft', activeDays: 30 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toContain('peserta_jft');
    });

    it('Bundling user with multi-roles can access both LMS and CBT modules', async () => {
      const lmsRes = await request(BASE_URL)
        .get('/api/n5/materials')
        .set(authHeader(MOCK_USERS.bundlingUser, 'kelas.kondangsensei.my.id'));
      expect(lmsRes.status).toBe(200);

      const cbtRes = await request(BASE_URL)
        .get('/api/cbt/simulations')
        .set(authHeader(MOCK_USERS.bundlingUser, 'cbt.kondangsensei.my.id'));
      expect(cbtRes.status).toBe(200);
    });
  });

  describe('Edge Cases: Role Validation & Boundaries', () => {
    it('should reject invalid role string assignment with 400 Bad Request', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/users/usr_siswa_001/roles')
        .set(authHeader(MOCK_USERS.superAdmin))
        .send({ role: 'super_hacker_role' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid role|Allowed roles/i);
    });

    it('Sensei cannot access or modify classes belonging to another Sensei', async () => {
      // Tanaka Sensei (cls_batch1_n5) tries to access Yamada Sensei's class (cls_batch2_n5)
      const res = await request(BASE_URL)
        .get('/api/teacher/classes/cls_batch2_n5/students')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|Bukan instruktur kelas ini/i);
    });

    it('should reject access if user account has been suspended or expired', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/materials')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          token: 'mock_jwt_suspended_user_token'
        }, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Account suspended|Subscription expired/i);
    });
  });

  describe('RBAC Authorization: Strict Role Isolation', () => {
    it('Sensei is strictly FORBIDDEN from accessing financial & payment records', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/payments')
        .set(authHeader(MOCK_USERS.sensei));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized role|Forbidden/i);
    });

    it('Sensei is strictly FORBIDDEN from accessing CBT JFT exam question bank editor', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/jft-bank')
        .set(authHeader(MOCK_USERS.sensei));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|Hanya Super Admin/i);
    });

    it('Siswa N5 is FORBIDDEN from accessing Teacher Gradebook endpoint', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/gradebook/cls_batch1_n5')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });

    it('Peserta JFT is FORBIDDEN from accessing N5 LMS chapters', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/chapter/1')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });
  });
});

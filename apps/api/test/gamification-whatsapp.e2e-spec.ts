/**
 * E2E Spec: M10 - Daily Streak, XP Engine, Leaderboard, & WhatsApp Automation
 * File: apps/api/test/gamification-whatsapp.e2e-spec.ts
 * Plan: docs/plan/m10-gamification-streak-whatsapp.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M10: Daily Streak, XP Engine, & WhatsApp Re-engagement (E2E)', () => {
  describe('Happy Path: Streak Accumulation & Leaderboard', () => {
    it('Siswa N5 daily heartbeat records login, updates streak, and awards daily XP', async () => {
      const res = await request(BASE_URL)
        .post('/api/gamification/heartbeat')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('currentStreak');
      expect(res.body.data).toHaveProperty('totalXp');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data.currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('Siswa N5 can fetch Class Leaderboard with ranked peers and medals', async () => {
      const res = await request(BASE_URL)
        .get('/api/gamification/leaderboard?classId=cls_batch1_n5')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.leaderboard)).toBe(true);

      const topUser = res.body.leaderboard[0];
      expect(topUser).toHaveProperty('rank');
      expect(topUser).toHaveProperty('name');
      expect(topUser).toHaveProperty('totalXp');
      expect(topUser).toHaveProperty('currentStreak');
      expect(topUser.rank).toBe(1);
    });

    it('System cron job detects students inactive >= 2 days and dispatches WhatsApp reminder', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/cron/whatsapp-reengagement')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('remindersSentCount');
      expect(Array.isArray(res.body.data.recipients)).toBe(true);
    });
  });

  describe('Edge Cases: Streak Reset & WhatsApp Spam Prevention', () => {
    it('should NOT increment streak twice on the same calendar day', async () => {
      const firstRes = await request(BASE_URL)
        .post('/api/gamification/heartbeat')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      const firstStreak = firstRes.body.data.currentStreak;

      // Second heartbeat on the same day
      const secondRes = await request(BASE_URL)
        .post('/api/gamification/heartbeat')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.data.currentStreak).toBe(firstStreak);
    });

    it('should reset current streak to 1 if user missed more than 1 day, while preserving longest streak', async () => {
      const res = await request(BASE_URL)
        .post('/api/gamification/heartbeat')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          userId: 'usr_siswa_inactive_3days'
        }, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.longestStreak).toBeGreaterThanOrEqual(1);
      expect(res.body.data.streakResetNotice).toBe(true);
    });

    it('WhatsApp scheduler must NOT send duplicate reminders within a 48-hour cooldown window', async () => {
      // Run the cron again immediately
      const res = await request(BASE_URL)
        .post('/api/admin/cron/whatsapp-reengagement')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      // Recipients should be 0 because all inactive users were already reminded
      expect(res.body.data.remindersSentCount).toBe(0);
    });
  });

  describe('RBAC Authorization: Automation & Leaderboard Privacy', () => {
    it('Regular students or Sensei are FORBIDDEN from triggering admin WhatsApp cron runner', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/cron/whatsapp-reengagement')
        .set(authHeader(MOCK_USERS.siswaN5));

      expect(res.status).toBe(403);
    });

    it('Students cannot spy on leaderboard of other classes they do not belong to', async () => {
      const res = await request(BASE_URL)
        .get('/api/gamification/leaderboard?classId=cls_batch2_n5')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Bukan anggota kelas ini/i);
    });
  });
});

/**
 * E2E Spec: M5 - Kotoba Flashcards & Spaced Repetition System (SM-2 SRS)
 * File: apps/api/test/kotoba-srs.e2e-spec.ts
 * Plan: docs/plan/m5-kotoba-flashcard-srs.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M5: Kotoba Flashcards & Spaced Repetition System (E2E)', () => {
  describe('Happy Path: Flashcard Deck & SM-2 Review Progression', () => {
    it('Siswa N5 can fetch vocabulary deck for Chapter 1 with audio and furigana', async () => {
      const res = await request(BASE_URL)
        .get('/api/srs/deck?chapterId=1')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.cards)).toBe(true);

      const card = res.body.cards[0];
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('kana');
      expect(card).toHaveProperty('romaji');
      expect(card).toHaveProperty('indonesian_meaning');
      expect(card).toHaveProperty('audio_url');
      expect(card).toHaveProperty('repetition_count');
    });

    it('should submit rating 3 (Good) and calculate next review interval according to SM-2', async () => {
      const res = await request(BASE_URL)
        .post('/api/srs/review')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          vocabId: 'voc_ch1_001',
          qualityRating: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repetitionCount).toBeGreaterThan(0);
      expect(res.body.data.intervalDays).toBeGreaterThanOrEqual(1);
      expect(new Date(res.body.data.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should submit rating 4 (Easy) and apply bonus interval multiplier', async () => {
      const res = await request(BASE_URL)
        .post('/api/srs/review')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          vocabId: 'voc_ch1_002',
          qualityRating: 4
        });

      expect(res.status).toBe(200);
      expect(res.body.data.easinessFactor).toBeGreaterThan(2.5); // Initial EF is 2.5
    });
  });

  describe('Edge Cases: SM-2 Reset on Failure & Quality Rating Boundaries', () => {
    it('should reset interval to 1 day and repetition count to 0 when rating is 1 (Lupa Total)', async () => {
      const res = await request(BASE_URL)
        .post('/api/srs/review')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          vocabId: 'voc_ch1_003',
          qualityRating: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.data.repetitionCount).toBe(0);
      expect(res.body.data.intervalDays).toBe(1);
    });

    it('should reject invalid quality ratings (< 1 or > 4) with 400 Bad Request', async () => {
      const res = await request(BASE_URL)
        .post('/api/srs/review')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          vocabId: 'voc_ch1_001',
          qualityRating: 5
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Rating harus antara 1 sampai 4/i);
    });

    it('should return 404 if reviewing a non-existent vocab ID', async () => {
      const res = await request(BASE_URL)
        .post('/api/srs/review')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          vocabId: 'voc_ghost_not_found',
          qualityRating: 3
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Kosakata tidak ditemukan/i);
    });
  });

  describe('RBAC Authorization: Access Scoping', () => {
    it('Peserta JFT is FORBIDDEN from accessing SRS vocabulary deck', async () => {
      const res = await request(BASE_URL)
        .get('/api/srs/deck?chapterId=1')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });

    it('User cannot submit review record for another user', async () => {
      // Budi tries to review Siti's cards
      const res = await request(BASE_URL)
        .post('/api/srs/review')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          vocabId: 'voc_ch1_001',
          targetUserId: MOCK_USERS.pesertaJFT.userId,
          qualityRating: 3
        });

      // API must ignore targetUserId and enforce current session's userId
      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(MOCK_USERS.siswaN5.userId);
    });
  });
});

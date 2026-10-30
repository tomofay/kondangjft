/**
 * E2E Spec: M4 - Zero-Video Bunpou Architecture & Color-Coded Grammar Block Engine
 * File: apps/api/test/bunpou.e2e-spec.ts
 * Plan: docs/plan/m4-bunpou-color-coded-engine.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M4: Zero-Video Bunpou & Color-Coded Grammar Block Engine (E2E)', () => {
  describe('Happy Path: Color-Coded Structure & Interactive Assets', () => {
    it('Siswa N5 can fetch Chapter 1 Bunpou lesson with complete Color-Coded Blocks', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/bunpou?chapterId=1')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.patterns)).toBe(true);

      const pattern = res.body.data.patterns[0];
      expect(pattern).toHaveProperty('pattern_code');
      expect(pattern).toHaveProperty('formula_blocks');
      expect(pattern).toHaveProperty('key_points');
      expect(pattern).toHaveProperty('example_sentences');
      expect(pattern).toHaveProperty('nuance_accordion');

      // Verify color types in formula blocks
      const blockTypes = pattern.formula_blocks.map((b: any) => b.type);
      expect(blockTypes).toContain('topic');
      expect(blockTypes).toContain('particle');
      expect(blockTypes).toContain('predicate');

      // Verify example sentence includes Furigana and audio
      const example = pattern.example_sentences[0];
      expect(example).toHaveProperty('japanese');
      expect(example).toHaveProperty('romaji');
      expect(example).toHaveProperty('indonesian');
      expect(example).toHaveProperty('audio_url');
    });

    it('Sensei can request clean presentation view data without sidebar overhead', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/bunpou/presentation?chapterId=1')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.data.presentationMode).toBe(true);
      expect(res.body.data.slides).toBeDefined();
    });
  });

  describe('Edge Cases: Validation & Unlocked Chapters', () => {
    it('should return 404 when requesting a non-existent chapter (e.g. Chapter 999)', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/bunpou?chapterId=999')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Bab tidak ditemukan/i);
    });

    it('Super Admin can validate new Bunpou JSON payload structure during CRUD', async () => {
      const invalidPayload = {
        chapter_id: 1,
        title: 'Pola Rusak',
        formula_blocks: [{ type: 'invalid_color_type', text: 'error' }] // Invalid type
      };

      const res = await request(BASE_URL)
        .post('/api/admin/bunpou')
        .set(authHeader(MOCK_USERS.superAdmin))
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/type harus topic, particle, atau predicate/i);
    });
  });

  describe('RBAC Authorization: Chapter Gating & Student Restrictions', () => {
    it('Siswa N5 is BLOCKED from accessing Bab 5 Bunpou if prerequisite Bab 4 has not been completed', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/bunpou?chapterId=5')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/terkunci|lulus Ujian Mondai Bab sebelumnya/i);
    });

    it('Sensei can inspect any chapter regardless of student progression gating', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/bunpou?chapterId=5')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
    });

    it('Peserta JFT is FORBIDDEN from viewing N5 Bunpou modules', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/bunpou?chapterId=1')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });
  });
});

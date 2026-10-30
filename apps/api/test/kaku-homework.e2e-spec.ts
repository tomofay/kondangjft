/**
 * E2E Spec: M8 - Kaku Assignment Pipeline, Client-Side Image Compression, & Submission Tracking
 * File: apps/api/test/kaku-homework.e2e-spec.ts
 * Plan: docs/plan/m8-kaku-digital-homework.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M8: Kaku Assignment Pipeline & Photo Homework (E2E)', () => {
  describe('Happy Path: Assignment Retrieval & Compressed Photo Submission', () => {
    it('Siswa N5 can fetch Kaku writing assignment instructions and sample sheet', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/kaku/assignment?chapterId=1')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.assignment).toHaveProperty('title');
      expect(res.body.assignment).toHaveProperty('instructions');
      expect(res.body.assignment).toHaveProperty('sample_sheet_pdf_url');
    });

    it('should upload compressed handwriting photo (WebP format) and set status to pending review', async () => {
      // Mock 350 KB WebP image buffer (client-compressed)
      const mockWebpBuffer = Buffer.alloc(350 * 1024, 0x88);

      const res = await request(BASE_URL)
        .post('/api/n5/kaku/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .attach('homeworkPhoto', mockWebpBuffer, {
          filename: 'kaku_hiragana_homework.webp',
          contentType: 'image/webp'
        })
        .field('assignmentId', 'kaku_assign_ch1')
        .field('classId', 'cls_batch1_n5')
        .field('compressedSizeKb', '350')
        .field('originalSizeKb', '4200');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.status).toBe('pending');
      expect(res.body.submission.image_url).toMatch(/\.(webp|jpg|jpeg|png)$/i);
    });

    it('Siswa N5 can track their homework submission history and review status', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/kaku/my-submissions')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.submissions)).toBe(true);
      const sub = res.body.submissions[0];
      expect(['pending', 'approved', 'revision_needed']).toContain(sub.status);
    });
  });

  describe('Edge Cases: File Validation & Size Enforcement', () => {
    it('should reject uncompressed giant photos exceeding 10 MB with 413 Payload Too Large', async () => {
      const giantBuffer = Buffer.alloc(12 * 1024 * 1024, 0xff); // 12 MB

      const res = await request(BASE_URL)
        .post('/api/n5/kaku/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .attach('homeworkPhoto', giantBuffer, {
          filename: 'giant_raw_photo.png',
          contentType: 'image/png'
        })
        .field('assignmentId', 'kaku_assign_ch1');

      expect(res.status).toBe(413);
      expect(res.body.error).toMatch(/Foto melebihi batas/i);
    });

    it('should reject non-image file uploads (e.g. PDF or DOCX) with 400 Bad Request', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 mock document');

      const res = await request(BASE_URL)
        .post('/api/n5/kaku/submit')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .attach('homeworkPhoto', pdfBuffer, {
          filename: 'homework.pdf',
          contentType: 'application/pdf'
        })
        .field('assignmentId', 'kaku_assign_ch1');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Hanya file gambar/i);
    });
  });

  describe('RBAC Authorization: Class Assignment Scoping', () => {
    it('Sensei can view the queue of pending Kaku homework photos for their class', async () => {
      const res = await request(BASE_URL)
        .get('/api/teacher/reviews/image-queue?classId=cls_batch1_n5')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.queue)).toBe(true);
    });

    it('Peserta JFT is FORBIDDEN from submitting Kaku writing homework', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/kaku/submit')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'))
        .send({ assignmentId: 'kaku_assign_ch1' });

      expect(res.status).toBe(403);
    });
  });
});

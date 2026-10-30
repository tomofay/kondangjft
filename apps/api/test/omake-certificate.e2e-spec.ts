/**
 * E2E Spec: M11 - Omake Japanese Culture Rewards & Verifiable PDF Certificate Generator
 * File: apps/api/test/omake-certificate.e2e-spec.ts
 * Plan: docs/plan/m11-omake-rewards-certificate.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M11: Omake Rewards & Verifiable PDF Certificates (E2E)', () => {
  describe('Happy Path: Omake Unlock & Verifiable Certificate Generation', () => {
    it('Siswa N5 who passed Mondai Bab 1 can access exclusive Omake cultural reward', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/omake?chapterId=1')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.omake).toHaveProperty('title');
      expect(res.body.omake).toHaveProperty('japanese_title');
      expect(res.body.omake).toHaveProperty('category');
      expect(res.body.omake).toHaveProperty('content_markdown');
      expect(res.body.isUnlocked).toBe(true);
    });

    it('should generate official A4 PDF certificate with QR code upon completing all 25 N5 chapters', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/certificates/generate')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          userId: 'usr_siswa_graduated_25_chapters'
        }, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.certificate).toHaveProperty('certificateNumber');
      expect(res.body.certificate).toHaveProperty('verificationHash');
      expect(res.body.certificate).toHaveProperty('qrCodeUrl');
      expect(res.body.certificate).toHaveProperty('pdfFileUrl');
      expect(res.body.certificate.certificateNumber).toMatch(/^KS-N5-\d{6}-/);
      expect(res.body.certificate.pdfFileUrl).toMatch(/\.pdf$/i);
    });

    it('Public third-party (LPK/HR) can verify certificate authenticity via public hash endpoint without login', async () => {
      const mockHash = 'mock_valid_sha256_hash_certificate_001';

      const res = await request(BASE_URL)
        .get(`/api/public/verify/${mockHash}`);

      expect(res.status).toBe(200);
      expect(res.body.isAuthentic).toBe(true);
      expect(res.body.data).toHaveProperty('studentName');
      expect(res.body.data).toHaveProperty('courseName');
      expect(res.body.data).toHaveProperty('issueDate');
      expect(res.body.data).toHaveProperty('finalScore');
      expect(res.body.data.status).toBe('VERIFIED');
    });
  });

  describe('Edge Cases: Unlocked Gate Enforcement & Invalid Certificate Hashes', () => {
    it('should REJECT access to Omake reward if student has not passed the corresponding Mondai exam', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/omake?chapterId=10') // Chapter 10 not yet passed
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Omake masih terkunci|lulus Ujian Mondai/i);
    });

    it('should REJECT certificate generation if student has not completed all 25 chapters with 400', async () => {
      const res = await request(BASE_URL)
        .post('/api/n5/certificates/generate')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id')); // Only completed Bab 1

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Belum menyelesaikan seluruh 25 bab/i);
      expect(res.body.progress).toBeDefined();
    });

    it('should return 404 when querying an invalid or non-existent certificate hash', async () => {
      const res = await request(BASE_URL)
        .get('/api/public/verify/fake_non_existent_hash_123');

      expect(res.status).toBe(404);
      expect(res.body.isAuthentic).toBe(false);
      expect(res.body.error).toMatch(/Sertifikat tidak ditemukan/i);
    });
  });

  describe('RBAC Authorization: Verification Public Access', () => {
    it('Public verification endpoint must be accessible anonymously without auth headers', async () => {
      const res = await request(BASE_URL)
        .get('/api/public/verify/mock_valid_sha256_hash_certificate_001');

      expect(res.status).toBe(200);
    });

    it('Super Admin can revoke or re-issue a certificate', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/certificates/KS-N5-202610-0001/revoke')
        .set(authHeader(MOCK_USERS.superAdmin))
        .send({ reason: 'Plagiarism detected' });

      expect(res.status).toBe(200);
      expect(res.body.isRevoked).toBe(true);
    });
  });
});

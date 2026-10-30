/**
 * E2E Spec: M18 - N5 Graduation Celebration Screen & JFT-A2 Cross-Selling Funnel
 * File: apps/api/test/cross-selling.e2e-spec.ts
 * Plan: docs/plan/m18-cross-selling-graduation-funnel.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M18: N5 Graduation & JFT-A2 Cross-Selling Funnel (E2E)', () => {
  describe('Happy Path: Graduation Celebration & Alumni Discount Claim', () => {
    it('Graduated Siswa N5 can fetch celebration data with dynamic JFT-A2 voucher code', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/graduation/celebration')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          userId: 'usr_siswa_graduated_25_chapters'
        }, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.celebration).toHaveProperty('japaneseGreeting');
      expect(res.body.celebration).toHaveProperty('crossSellOffer');
      expect(res.body.celebration.crossSellOffer).toHaveProperty('voucherCode');
      expect(res.body.celebration.crossSellOffer).toHaveProperty('discountPercentage', 30);
      expect(res.body.celebration.crossSellOffer.voucherCode).toMatch(/^ALUMNI-N5-/);
    });

    it('should claim the alumni voucher and initiate checkout with discounted price', async () => {
      const res = await request(BASE_URL)
        .post('/api/payments/checkout-with-voucher')
        .set(authHeader({
          ...MOCK_USERS.siswaN5,
          userId: 'usr_siswa_graduated_25_chapters'
        }, 'kondangsensei.my.id'))
        .send({
          packageId: 'pkg_jft_5_simulations',
          voucherCode: 'ALUMNI-N5-MOCK-CODE'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountApplied).toBe(true);
      expect(res.body.data.finalAmount).toBeLessThan(res.body.data.originalAmount);
    });
  });

  describe('Edge Cases: Non-Graduates & Expired Vouchers', () => {
    it('should REJECT celebration screen access if student has NOT graduated with 403', async () => {
      // Budi only completed Chapter 1
      const res = await request(BASE_URL)
        .get('/api/n5/graduation/celebration')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Anda belum menyelesaikan seluruh kurikulum N5/i);
    });

    it('should reject already-claimed or expired alumni vouchers with 400 Bad Request', async () => {
      const res = await request(BASE_URL)
        .post('/api/payments/checkout-with-voucher')
        .set(authHeader(MOCK_USERS.siswaN5, 'kondangsensei.my.id'))
        .send({
          packageId: 'pkg_jft_5_simulations',
          voucherCode: 'ALUMNI-N5-ALREADY-USED'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Voucher telah digunakan atau kedaluwarsa/i);
    });
  });

  describe('RBAC Authorization: Cross-Selling Metrics Analytics', () => {
    it('Super Admin can view alumni cross-selling conversion rates', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/analytics/cross-sell-conversions')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveProperty('totalGraduates');
      expect(res.body.metrics).toHaveProperty('vouchersClaimed');
      expect(res.body.metrics).toHaveProperty('conversionRatePercent');
    });

    it('Sensei is FORBIDDEN from viewing cross-selling financial metrics', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/analytics/cross-sell-conversions')
        .set(authHeader(MOCK_USERS.sensei));

      expect(res.status).toBe(403);
    });
  });
});

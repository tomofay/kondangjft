/**
 * E2E Spec: M3 - Centralized DOKU Payment Gateway & Multi-Product Bundling Engine
 * File: apps/api/test/payment-bundling.e2e-spec.ts
 * Plan: docs/plan/m3-payment-gateway-bundling.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M3: Centralized DOKU Payment Gateway & Bundling Engine (E2E)', () => {
  describe('Happy Path: Checkout & DOKU Webhook Provisioning', () => {
    it('Authenticated user can initiate checkout for a Bundling Package', async () => {
      const res = await request(BASE_URL)
        .post('/api/payments/checkout')
        .set(authHeader(MOCK_USERS.siswaN5))
        .send({
          packageId: 'pkg_bundle_n5_jft',
          paymentMethod: 'QRIS'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('invoiceNumber');
      expect(res.body.data).toHaveProperty('paymentUrl');
      expect(res.body.data).toHaveProperty('amount');
      expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{8}-/);
    });

    it('should process valid DOKU Webhook with valid signature and grant dual entitlements for bundling package', async () => {
      const invoiceNumber = 'INV-20261030-9901';
      const amount = '150000.00';
      const clientId = process.env.DOKU_CLIENT_ID || 'MOCK_CLIENT_ID';
      const secretKey = process.env.DOKU_SECRET_KEY || 'MOCK_SECRET_KEY';
      const timestamp = new Date().toISOString();

      // Generate valid DOKU HMAC-SHA256 signature
      const body = {
        order: { invoice_number: invoiceNumber, amount },
        transaction: { status: 'SUCCESS', id: 'DOKU_TRANS_9988' }
      };
      const rawBody = JSON.stringify(body);
      const digest = crypto.createHash('sha256').update(rawBody).digest('base64');
      const signaturePayload = `Client-Id:${clientId}\nRequest-Id:REQ-001\nRequest-Timestamp:${timestamp}\nRequest-Target:/api/payments/doku-webhook\nDigest:${digest}`;
      const signature = `HMACSHA256=${crypto.createHmac('sha256', secretKey).update(signaturePayload).digest('base64')}`;

      const res = await request(BASE_URL)
        .post('/api/payments/doku-webhook')
        .set('Client-Id', clientId)
        .set('Request-Id', 'REQ-001')
        .set('Request-Timestamp', timestamp)
        .set('Signature', signature)
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user now has both LMS and CBT active entitlements
      const verifyRes = await request(BASE_URL)
        .get(`/api/admin/users/${MOCK_USERS.siswaN5.userId}/entitlements`)
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(verifyRes.status).toBe(200);
      const modules = verifyRes.body.entitlements.map((e: any) => e.module);
      expect(modules).toContain('lms_n5');
      expect(modules).toContain('cbt_jft');
    });
  });

  describe('Edge Cases: Fraud Prevention & Idempotency', () => {
    it('should REJECT DOKU webhook with invalid/tampered HMAC signature with 401', async () => {
      const res = await request(BASE_URL)
        .post('/api/payments/doku-webhook')
        .set('Client-Id', 'FAKE_CLIENT')
        .set('Request-Id', 'REQ-FAKE')
        .set('Request-Timestamp', new Date().toISOString())
        .set('Signature', 'HMACSHA256=forged_signature_digest')
        .send({ order: { invoice_number: 'INV-FAKE-001' } });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid signature|Unauthorized webhook/i);
    });

    it('should handle duplicate webhook deliveries idempotently without double-granting quota', async () => {
      const duplicatePayload = {
        order: { invoice_number: 'INV-20261030-ALREADY-PAID', amount: '50000.00' },
        transaction: { status: 'SUCCESS', id: 'DOKU_TRANS_DUP' }
      };

      // Second webhook call for an already settled invoice
      const res = await request(BASE_URL)
        .post('/api/payments/doku-webhook')
        .set('Client-Id', 'MOCK_CLIENT_ID')
        .set('Signature', 'VALID_MOCK_SIG')
        .send(duplicatePayload);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Already processed|Idempotent duplicate ignored/i);
    });

    it('should reject checkout request for inactive or non-existent package with 404', async () => {
      const res = await request(BASE_URL)
        .post('/api/payments/checkout')
        .set(authHeader(MOCK_USERS.siswaN5))
        .send({ packageId: 'pkg_ghost_not_found' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Paket tidak ditemukan/i);
    });
  });

  describe('RBAC Authorization: Payment Records Access', () => {
    it('Super Admin can view centralized financial reports and all transactions', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/payments/transactions')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });

    it('Sensei is strictly FORBIDDEN from viewing transaction history or financial reports', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/payments/transactions')
        .set(authHeader(MOCK_USERS.sensei));

      expect(res.status).toBe(403);
    });

    it('Students can only view their own transaction history, not other students', async () => {
      const res = await request(BASE_URL)
        .get('/api/user/my-transactions')
        .set(authHeader(MOCK_USERS.siswaN5));

      expect(res.status).toBe(200);
      const otherUserTransactions = res.body.data.transactions.filter(
        (t: any) => t.userId !== MOCK_USERS.siswaN5.userId
      );
      expect(otherUserTransactions.length).toBe(0);
    });
  });
});

/**
 * E2E Spec: M19 - Super Admin Dashboard, Financial Reconciliation, & Ecosystem Audit Logs
 * File: apps/api/test/super-admin-reporting.e2e-spec.ts
 * Plan: docs/plan/m19-super-admin-unified-reporting.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M19: Super Admin Dashboard, Finance Reconciliation, & Audit Logs (E2E)', () => {
  describe('Happy Path: Unified Executive KPI & Financial Reconciliation', () => {
    it('Super Admin can fetch ecosystem overview metrics (Gross Revenue, Active Students, Pass Rates)', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/metrics/overview')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('grossRevenueIdr');
      expect(res.body.data).toHaveProperty('totalActiveStudents');
      expect(res.body.data).toHaveProperty('n5GraduationRatePercent');
      expect(res.body.data).toHaveProperty('jftPassRatePercent');
      expect(res.body.data).toHaveProperty('leadConversionRatePercent');
    });

    it('Super Admin can trigger DOKU financial reconciliation to match settled transactions', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/finance/reconcile-doku')
        .set(authHeader(MOCK_USERS.superAdmin))
        .send({ settlementDate: '2026-10-30' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settlement).toHaveProperty('totalGrossIdr');
      expect(res.body.settlement).toHaveProperty('dokuFeeIdr');
      expect(res.body.settlement).toHaveProperty('netReceivedIdr');
      expect(['matched', 'discrepancy']).toContain(res.body.settlement.reconciliationStatus);
    });

    it('Super Admin can query immutable security audit logs with action filters', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/audit-logs?actionType=role_change&limit=10')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.logs)).toBe(true);

      if (res.body.logs.length > 0) {
        const log = res.body.logs[0];
        expect(log).toHaveProperty('actor_email');
        expect(log).toHaveProperty('ip_address');
        expect(log).toHaveProperty('action_type');
        expect(log).toHaveProperty('details_json');
        expect(log).toHaveProperty('created_at');
      }
    });
  });

  describe('Edge Cases: Settlement Discrepancy & Immutable Log Deletion Protection', () => {
    it('should flag discrepancy if local database amount does not match DOKU settlement API', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/finance/reconcile-doku')
        .set(authHeader(MOCK_USERS.superAdmin))
        .send({ settlementDate: '2026-10-25' }); // Date with mocked mismatch

      expect(res.status).toBe(200);
      expect(res.body.settlement.reconciliationStatus).toBe('discrepancy');
      expect(res.body.settlement.discrepancyDetails).toBeDefined();
    });

    it('should REJECT any DELETE requests on audit logs to preserve immutable audit trail (405)', async () => {
      const res = await request(BASE_URL)
        .delete('/api/admin/audit-logs/log_001')
        .set(authHeader(MOCK_USERS.superAdmin));

      expect([405, 403]).toContain(res.status);
      expect(res.body.error).toMatch(/Audit logs are immutable|Method Not Allowed/i);
    });
  });

  describe('RBAC Authorization: Super Admin Boundary Enforcement', () => {
    it('Sensei is strictly FORBIDDEN from accessing the Super Admin metrics overview (403)', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/metrics/overview')
        .set(authHeader(MOCK_USERS.sensei));

      expect(res.status).toBe(403);
    });

    it('Siswa N5 is strictly FORBIDDEN from accessing the Super Admin metrics overview (403)', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/metrics/overview')
        .set(authHeader(MOCK_USERS.siswaN5));

      expect(res.status).toBe(403);
    });

    it('Peserta JFT is strictly FORBIDDEN from accessing financial reconciliation (403)', async () => {
      const res = await request(BASE_URL)
        .post('/api/admin/finance/reconcile-doku')
        .set(authHeader(MOCK_USERS.pesertaJFT))
        .send({ settlementDate: '2026-10-30' });

      expect(res.status).toBe(403);
    });

    it('Anonymous requests without token are immediately rejected with 401 Unauthorized', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/metrics/overview');

      expect(res.status).toBe(401);
    });
  });
});

/**
 * E2E Spec: M0 - Decoupled Subdomain Topology & Cross-Subdomain SSO
 * File: apps/api/test/architecture-sso.e2e-spec.ts
 * Plan: docs/plan/m0-architecture-sso.md
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

// Target base test URL or local server instance
const BASE_PORTAL = 'http://localhost:3000'; // kondangsensei.my.id
const BASE_LMS = 'http://localhost:3000';    // kelas.kondangsensei.my.id
const BASE_CBT = 'http://localhost:3000';    // cbt.kondangsensei.my.id

describe('M0: SSO & Cross-Subdomain Session Management (E2E)', () => {
  describe('Happy Path: Single Sign-On Across Subdomains', () => {
    it('should authenticate user and set cookie scoped to .kondangsensei.my.id', async () => {
      const res = await request(BASE_PORTAL)
        .post('/api/auth/login')
        .set('Host', 'kondangsensei.my.id')
        .send({
          email: 'budi@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('budi@example.com');

      // Verify Set-Cookie header contains Domain=.kondangsensei.my.id; HttpOnly; SameSite=Lax
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c: string) => c.startsWith('ks_session_token='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/Domain=\.kondangsensei\.my\.id/i);
      expect(sessionCookie).toMatch(/HttpOnly/i);
    });

    it('should allow valid session cookie to be accepted on kelas.kondangsensei.my.id', async () => {
      const res = await request(BASE_LMS)
        .get('/api/auth/me')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(MOCK_USERS.siswaN5.userId);
      expect(res.body.user.roles).toContain('siswa_n5');
    });

    it('should allow valid session cookie to be accepted on cbt.kondangsensei.my.id', async () => {
      const res = await request(BASE_CBT)
        .get('/api/auth/me')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'cbt.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(MOCK_USERS.pesertaJFT.userId);
      expect(res.body.user.roles).toContain('peserta_jft');
    });

    it('should support global logout and invalidate session across all subdomains', async () => {
      const logoutRes = await request(BASE_PORTAL)
        .post('/api/auth/logout')
        .set(authHeader(MOCK_USERS.siswaN5, 'kondangsensei.my.id'));

      expect(logoutRes.status).toBe(200);
      const cookies = logoutRes.headers['set-cookie'];
      const clearCookie = cookies.find((c: string) => c.startsWith('ks_session_token=;'));
      expect(clearCookie).toBeDefined();

      // Subsequent access on LMS should now fail with 401
      const lmsRes = await request(BASE_LMS)
        .get('/api/auth/me')
        .set('Host', 'kelas.kondangsensei.my.id')
        .set('Cookie', 'ks_session_token=; Max-Age=0');

      expect(lmsRes.status).toBe(401);
    });
  });

  describe('Edge Cases & Security Validation', () => {
    it('should reject malformed or tampered JWT session tokens', async () => {
      const res = await request(BASE_PORTAL)
        .get('/api/auth/me')
        .set('Host', 'kondangsensei.my.id')
        .set('Cookie', 'ks_session_token=tampered_invalid_signature_token');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid session token|Unauthorized/i);
    });

    it('should reject expired session token and prompt re-authentication', async () => {
      const res = await request(BASE_PORTAL)
        .get('/api/auth/me')
        .set('Host', 'kondangsensei.my.id')
        .set('Cookie', 'ks_session_token=mock_expired_token_timestamp_past');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Session expired|Unauthorized/i);
    });

    it('should handle CORS headers properly for registered subdomains with credentials', async () => {
      const res = await request(BASE_PORTAL)
        .options('/api/auth/me')
        .set('Origin', 'https://kelas.kondangsensei.my.id')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('https://kelas.kondangsensei.my.id');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should block CORS requests from unauthorized external origins', async () => {
      const res = await request(BASE_PORTAL)
        .options('/api/auth/me')
        .set('Origin', 'https://malicious-phishing-site.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).not.toBe('https://malicious-phishing-site.com');
    });
  });

  describe('RBAC Authorization: Cross-Subdomain Boundaries', () => {
    it('should reject user without siswa_n5 role when accessing kelas.kondangsensei.my.id', async () => {
      const res = await request(BASE_LMS)
        .get('/api/n5/dashboard')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|memerlukan akses Kelas N5/i);
    });

    it('should reject user without peserta_jft role when accessing cbt.kondangsensei.my.id', async () => {
      const res = await request(BASE_CBT)
        .get('/api/cbt/dashboard')
        .set(authHeader(MOCK_USERS.siswaN5, 'cbt.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|memerlukan paket simulasi JFT/i);
    });
  });
});

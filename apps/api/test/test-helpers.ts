/**
 * Shared Test Helpers & Mock Fixtures for Vitest / Supertest E2E Specs
 * Location: apps/api/test/test-helpers.ts
 */

import http from 'http';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as meGetHandler, OPTIONS as meOptionsHandler } from '@/app/api/auth/me/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { GET as adminUsersHandler } from '@/app/api/admin/users/route';
import { POST as assignRoleHandler } from '@/app/api/admin/users/[userId]/roles/route';
import { GET as adminPaymentsHandler } from '@/app/api/admin/payments/route';
import { GET as adminJftBankHandler } from '@/app/api/admin/jft-bank/route';
import { GET as teacherStudentsHandler } from '@/app/api/teacher/classes/[classId]/students/route';
import { GET as teacherGradebookHandler } from '@/app/api/teacher/gradebook/[classId]/route';
import { GET as n5DashboardHandler } from '@/app/api/n5/dashboard/route';
import { GET as n5MaterialsHandler } from '@/app/api/n5/materials/route';
import { GET as n5ChapterHandler } from '@/app/api/n5/chapter/[chapterId]/route';
import { GET as cbtDashboardHandler } from '@/app/api/cbt/dashboard/route';
import { GET as cbtSimulationsHandler } from '@/app/api/cbt/simulations/route';
import { GET as miniTryoutQuestionsHandler } from '@/app/api/leads/mini-tryout-questions/route';
import { POST as submitMiniTryoutHandler } from '@/app/api/leads/submit-mini-tryout/route';
import { GET as adminLeadsHandler } from '@/app/api/admin/leads/route';
import { POST as paymentsCheckoutHandler } from '@/app/api/payments/checkout/route';
import { POST as dokuWebhookHandler } from '@/app/api/payments/doku-webhook/route';
import { GET as adminUserEntitlementsHandler } from '@/app/api/admin/users/[userId]/entitlements/route';
import { GET as adminPaymentsTransactionsHandler } from '@/app/api/admin/payments/transactions/route';
import { GET as userMyTransactionsHandler } from '@/app/api/user/my-transactions/route';
import { GET as n5BunpouHandler } from '@/app/api/n5/bunpou/route';
import { GET as n5BunpouPresentationHandler } from '@/app/api/n5/bunpou/presentation/route';
import { POST as adminBunpouHandler } from '@/app/api/admin/bunpou/route';
import { GET as srsDeckHandler } from '@/app/api/srs/deck/route';
import { POST as srsReviewHandler } from '@/app/api/srs/review/route';
import { GET as n5RenshuHandler } from '@/app/api/n5/renshu/route';
import { POST as n5RenshuSubmitHandler } from '@/app/api/n5/renshu/submit/route';
import { GET as teacherRenshuLiveHandler } from '@/app/api/teacher/classes/[classId]/renshu-live/route';
import { GET as n5KaiwaSceneHandler } from '@/app/api/n5/kaiwa/scene/route';
import { POST as n5KaiwaSubmitVoiceHandler } from '@/app/api/n5/kaiwa/submit-voice/route';
import { GET as teacherVoiceQueueHandler } from '@/app/api/teacher/reviews/voice-queue/route';
import { GET as n5KakuAssignmentHandler } from '@/app/api/n5/kaku/assignment/route';
import { POST as n5KakuSubmitHandler } from '@/app/api/n5/kaku/submit/route';
import { GET as n5KakuMySubmissionsHandler } from '@/app/api/n5/kaku/my-submissions/route';
import { GET as teacherImageQueueHandler } from '@/app/api/teacher/reviews/image-queue/route';
import { POST as n5MondaiStartHandler } from '@/app/api/n5/mondai/start/route';
import { POST as n5MondaiSubmitHandler } from '@/app/api/n5/mondai/submit/route';
import { GET as teacherMondaiAnalyticsHandler } from '@/app/api/teacher/classes/[classId]/mondai-analytics/route';
import { POST as gamificationHeartbeatHandler } from '@/app/api/gamification/heartbeat/route';
import { GET as gamificationLeaderboardHandler } from '@/app/api/gamification/leaderboard/route';
import { POST as adminCronWhatsappHandler } from '@/app/api/admin/cron/whatsapp-reengagement/route';
import { GET as n5OmakeHandler } from '@/app/api/n5/omake/route';
import { POST as n5CertificatesGenerateHandler } from '@/app/api/n5/certificates/generate/route';
import { GET as publicVerifyCertificateHandler } from '@/app/api/public/verify/[hash]/route';
import { POST as adminCertificatesRevokeHandler } from '@/app/api/admin/certificates/[certId]/revoke/route';
import { middleware as nextMiddleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/authCookie';

export interface TestUserSession {
  userId: string;
  name: string;
  email: string;
  roles: ('super_admin' | 'sensei' | 'siswa_n5' | 'peserta_jft')[];
  classId?: string;
  token: string;
}

// Mock User Fixtures across the 4 PRD Roles
export const MOCK_USERS = {
  superAdmin: {
    userId: 'usr_superadmin_001',
    name: 'Super Admin Kondang',
    email: 'admin@kondangsensei.my.id',
    roles: ['super_admin'],
    token: 'mock_jwt_superadmin_valid_token'
  } as TestUserSession,

  sensei: {
    userId: 'usr_sensei_001',
    name: 'Tanaka Sensei',
    email: 'tanaka@kondangsensei.my.id',
    roles: ['sensei'],
    classId: 'cls_batch1_n5',
    token: 'mock_jwt_sensei_valid_token'
  } as TestUserSession,

  otherSensei: {
    userId: 'usr_sensei_002',
    name: 'Yamada Sensei',
    email: 'yamada@kondangsensei.my.id',
    roles: ['sensei'],
    classId: 'cls_batch2_n5',
    token: 'mock_jwt_other_sensei_token'
  } as TestUserSession,

  siswaN5: {
    userId: 'usr_siswa_001',
    name: 'Budi Pratama',
    email: 'budi@example.com',
    roles: ['siswa_n5'],
    classId: 'cls_batch1_n5',
    token: 'mock_jwt_siswa_n5_valid_token'
  } as TestUserSession,

  pesertaJFT: {
    userId: 'usr_peserta_001',
    name: 'Siti Rahma',
    email: 'siti@example.com',
    roles: ['peserta_jft'],
    token: 'mock_jwt_peserta_jft_valid_token'
  } as TestUserSession,

  bundlingUser: {
    userId: 'usr_bundle_001',
    name: 'Andi Wijaya',
    email: 'andi@example.com',
    roles: ['siswa_n5', 'peserta_jft'],
    classId: 'cls_batch1_n5',
    token: 'mock_jwt_bundling_user_token'
  } as TestUserSession,

  unregistered: {
    userId: 'usr_anon_001',
    name: 'Anonimous',
    email: 'anon@example.com',
    roles: [],
    token: 'mock_jwt_unregistered_token'
  } as TestUserSession
};

/**
 * Generate standard authorization headers with cookie or bearer token
 */
export function authHeader(user: TestUserSession, host = 'kondangsensei.my.id') {
  let token = user.token;
  if (user.userId && user.token === 'mock_jwt_siswa_n5_valid_token' && user.userId !== 'usr_siswa_001') {
    token = createSessionToken({
      userId: user.userId,
      name: user.name,
      email: user.email,
      roles: user.roles,
      classId: user.classId
    });
  }
  return {
    Authorization: `Bearer ${token}`,
    Cookie: `ks_session_token=${token}; Domain=.kondangsensei.my.id`,
    Host: host
  };
}

/**
 * In-process Test HTTP Server dispatcher for Vitest E2E Tests
 */
let testServer: http.Server | null = null;

async function getRawBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function createDispatcherServer(): http.Server {
  return http.createServer(async (req, res) => {
    try {
      const host = req.headers.host || 'localhost:3000';
      const rawUrl = req.url || '/';
      const parsedUrl = new URL(rawUrl, `http://${host}`);
      const pathname = parsedUrl.pathname;
      const method = (req.method || 'GET').toUpperCase();

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      }

      let rawBody: Buffer | null = null;
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        rawBody = await getRawBody(req);
      }

      const webReq = new NextRequest(parsedUrl.toString(), {
        method,
        headers,
        body: rawBody && rawBody.length > 0 ? (new Uint8Array(rawBody) as any) : undefined
      });

      // 1. Run Middleware first
      const middlewareRes = await nextMiddleware(webReq);
      if (middlewareRes && middlewareRes.status !== 200 && middlewareRes.headers.get('x-middleware-next') !== '1') {
        res.statusCode = middlewareRes.status;
        middlewareRes.headers.forEach((val, key) => res.setHeader(key, val));
        const buf = await middlewareRes.arrayBuffer();
        res.end(Buffer.from(buf));
        return;
      }

      // 2. Dispatch to matching route handlers
      let nextRes: Response | NextResponse | null = null;

      if (pathname === '/api/auth/login' && method === 'POST') {
        nextRes = await loginHandler(webReq);
      } else if (pathname === '/api/auth/me') {
        if (method === 'OPTIONS') nextRes = await meOptionsHandler(webReq);
        else if (method === 'GET') nextRes = await meGetHandler(webReq);
      } else if (pathname === '/api/auth/logout' && method === 'POST') {
        nextRes = await logoutHandler(webReq);
      } else if (pathname === '/api/admin/users' && method === 'GET') {
        nextRes = await adminUsersHandler(webReq);
      } else if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/roles') && method === 'POST') {
        const parts = pathname.split('/');
        const userId = parts[4];
        nextRes = await assignRoleHandler(webReq, { params: Promise.resolve({ userId }) });
      } else if (pathname === '/api/admin/payments' && method === 'GET') {
        nextRes = await adminPaymentsHandler(webReq);
      } else if (pathname === '/api/admin/jft-bank' && method === 'GET') {
        nextRes = await adminJftBankHandler(webReq);
      } else if (pathname.startsWith('/api/teacher/classes/') && pathname.endsWith('/students') && method === 'GET') {
        const parts = pathname.split('/');
        const classId = parts[4];
        nextRes = await teacherStudentsHandler(webReq, { params: Promise.resolve({ classId }) });
      } else if (pathname.startsWith('/api/teacher/gradebook/') && method === 'GET') {
        const parts = pathname.split('/');
        const classId = parts[4];
        nextRes = await teacherGradebookHandler(webReq, { params: Promise.resolve({ classId }) });
      } else if (pathname === '/api/n5/dashboard' && method === 'GET') {
        nextRes = await n5DashboardHandler(webReq);
      } else if (pathname === '/api/n5/materials' && method === 'GET') {
        nextRes = await n5MaterialsHandler(webReq);
      } else if (pathname.startsWith('/api/n5/chapter/') && method === 'GET') {
        const parts = pathname.split('/');
        const chapterId = parts[4];
        nextRes = await n5ChapterHandler(webReq, { params: Promise.resolve({ chapterId }) });
      } else if (pathname === '/api/cbt/dashboard' && method === 'GET') {
        nextRes = await cbtDashboardHandler(webReq);
      } else if (pathname === '/api/cbt/simulations' && method === 'GET') {
        nextRes = await cbtSimulationsHandler(webReq);
      } else if (pathname === '/api/leads/mini-tryout-questions' && method === 'GET') {
        nextRes = await miniTryoutQuestionsHandler();
      } else if (pathname === '/api/leads/submit-mini-tryout' && method === 'POST') {
        nextRes = await submitMiniTryoutHandler(webReq);
      } else if (pathname === '/api/admin/leads' && method === 'GET') {
        nextRes = await adminLeadsHandler(webReq);
      } else if (pathname === '/api/payments/checkout' && method === 'POST') {
        nextRes = await paymentsCheckoutHandler(webReq);
      } else if (pathname === '/api/payments/doku-webhook' && method === 'POST') {
        nextRes = await dokuWebhookHandler(webReq);
      } else if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/entitlements') && method === 'GET') {
        const parts = pathname.split('/');
        const userId = parts[4];
        nextRes = await adminUserEntitlementsHandler(webReq, { params: Promise.resolve({ userId }) });
      } else if (pathname === '/api/admin/payments/transactions' && method === 'GET') {
        nextRes = await adminPaymentsTransactionsHandler(webReq);
      } else if (pathname === '/api/user/my-transactions' && method === 'GET') {
        nextRes = await userMyTransactionsHandler(webReq);
      } else if (pathname === '/api/n5/bunpou/presentation' && method === 'GET') {
        nextRes = await n5BunpouPresentationHandler(webReq);
      } else if (pathname === '/api/n5/bunpou' && method === 'GET') {
        nextRes = await n5BunpouHandler(webReq);
      } else if (pathname === '/api/admin/bunpou' && method === 'POST') {
        nextRes = await adminBunpouHandler(webReq);
      } else if (pathname === '/api/srs/deck' && method === 'GET') {
        nextRes = await srsDeckHandler(webReq);
      } else if (pathname === '/api/srs/review' && method === 'POST') {
        nextRes = await srsReviewHandler(webReq);
      } else if (pathname === '/api/n5/renshu' && method === 'GET') {
        nextRes = await n5RenshuHandler(webReq);
      } else if (pathname === '/api/n5/renshu/submit' && method === 'POST') {
        nextRes = await n5RenshuSubmitHandler(webReq);
      } else if (pathname.startsWith('/api/teacher/classes/') && pathname.endsWith('/renshu-live') && method === 'GET') {
        const parts = pathname.split('/');
        const classId = parts[4];
        nextRes = await teacherRenshuLiveHandler(webReq, { params: Promise.resolve({ classId }) });
      } else if (pathname === '/api/n5/kaiwa/scene' && method === 'GET') {
        nextRes = await n5KaiwaSceneHandler(webReq);
      } else if (pathname === '/api/n5/kaiwa/submit-voice' && method === 'POST') {
        nextRes = await n5KaiwaSubmitVoiceHandler(webReq);
      } else if (pathname === '/api/teacher/reviews/voice-queue' && method === 'GET') {
        nextRes = await teacherVoiceQueueHandler(webReq);
      } else if (pathname === '/api/n5/kaku/assignment' && method === 'GET') {
        nextRes = await n5KakuAssignmentHandler(webReq);
      } else if (pathname === '/api/n5/kaku/submit' && method === 'POST') {
        nextRes = await n5KakuSubmitHandler(webReq);
      } else if (pathname === '/api/n5/kaku/my-submissions' && method === 'GET') {
        nextRes = await n5KakuMySubmissionsHandler(webReq);
      } else if (pathname === '/api/teacher/reviews/image-queue' && method === 'GET') {
        nextRes = await teacherImageQueueHandler(webReq);
      } else if (pathname === '/api/n5/mondai/start' && method === 'POST') {
        nextRes = await n5MondaiStartHandler(webReq);
      } else if (pathname === '/api/n5/mondai/submit' && method === 'POST') {
        nextRes = await n5MondaiSubmitHandler(webReq);
      } else if (pathname.startsWith('/api/teacher/classes/') && pathname.endsWith('/mondai-analytics') && method === 'GET') {
        const parts = pathname.split('/');
        const classId = parts[4];
        nextRes = await teacherMondaiAnalyticsHandler(webReq, { params: Promise.resolve({ classId }) });
      } else if (pathname === '/api/gamification/heartbeat' && method === 'POST') {
        nextRes = await gamificationHeartbeatHandler(webReq);
      } else if (pathname === '/api/gamification/leaderboard' && method === 'GET') {
        nextRes = await gamificationLeaderboardHandler(webReq);
      } else if (pathname === '/api/admin/cron/whatsapp-reengagement' && method === 'POST') {
        nextRes = await adminCronWhatsappHandler(webReq);
      } else if (pathname === '/api/n5/omake' && method === 'GET') {
        nextRes = await n5OmakeHandler(webReq);
      } else if (pathname === '/api/n5/certificates/generate' && method === 'POST') {
        nextRes = await n5CertificatesGenerateHandler(webReq);
      } else if (pathname.startsWith('/api/public/verify/') && method === 'GET') {
        const hash = pathname.replace('/api/public/verify/', '');
        nextRes = await publicVerifyCertificateHandler(webReq, { params: Promise.resolve({ hash }) });
      } else if (pathname.startsWith('/api/admin/certificates/') && pathname.endsWith('/revoke') && method === 'POST') {
        const parts = pathname.split('/');
        const certId = parts[4];
        nextRes = await adminCertificatesRevokeHandler(webReq, { params: Promise.resolve({ certId }) });
      }

      if (!nextRes) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Not found: ${method} ${pathname}` }));
        return;
      }

      res.statusCode = nextRes.status;
      nextRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const setCookie = nextRes.headers.get('set-cookie');
      if (setCookie) {
        res.setHeader('Set-Cookie', setCookie);
      }

      const bodyBuffer = await nextRes.arrayBuffer();
      res.end(Buffer.from(bodyBuffer));
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || String(err) }));
    }
  });
}

/**
 * Ensure Test Server is running on port 3000
 */
export function startTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (testServer && testServer.listening) {
      return resolve();
    }

    testServer = createDispatcherServer();
    testServer.listen(3000, () => {
      resolve();
    });

    testServer.on('error', (err: any) => {
      // If port 3000 is already in use by next dev server, we can reuse it
      if (err.code === 'EADDRINUSE') {
        resolve();
      }
    });
  });
}

export function stopTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (testServer) {
      testServer.close(() => resolve());
      testServer = null;
    } else {
      resolve();
    }
  });
}

// Auto-start server in test environment
await startTestServer();

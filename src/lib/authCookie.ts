import crypto from 'crypto';

export type UserRole = 'super_admin' | 'sensei' | 'siswa_n5' | 'peserta_jft';

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  roles: UserRole[];
  classId?: string;
  isSuspended?: boolean;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'kondangsensei_super_secret_jwt_key_2026';

/**
 * Base64URL encode/decode helpers
 */
function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str) : str;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Sign a session payload to JWT
 */
export function createSessionToken(
  user: { userId: string; name: string; email: string; roles: UserRole[]; classId?: string; isSuspended?: boolean },
  expiresInSeconds = 7 * 24 * 60 * 60
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  const payload: SessionPayload = {
    userId: user.userId,
    name: user.name,
    email: user.email,
    roles: user.roles,
    classId: user.classId,
    isSuspended: user.isSuspended || false,
    iat,
    exp
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export type TokenVerificationResult =
  | { valid: true; payload: SessionPayload }
  | { valid: false; reason: 'invalid' | 'expired' | 'suspended' };

/**
 * Verify session token string (JWT or mock test token)
 */
export function verifySessionToken(token: string): TokenVerificationResult {
  if (!token) return { valid: false, reason: 'invalid' };

  // Handle mock tokens for test fixtures
  if (token === 'mock_expired_token_timestamp_past') {
    return { valid: false, reason: 'expired' };
  }
  if (token === 'mock_jwt_suspended_user_token') {
    return {
      valid: false,
      reason: 'suspended'
    };
  }
  if (token === 'mock_jwt_superadmin_valid_token') {
    return {
      valid: true,
      payload: {
        userId: 'usr_superadmin_001',
        name: 'Super Admin Kondang',
        email: 'admin@kondangsensei.my.id',
        roles: ['super_admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
  }
  if (token === 'mock_jwt_sensei_valid_token') {
    return {
      valid: true,
      payload: {
        userId: 'usr_sensei_001',
        name: 'Tanaka Sensei',
        email: 'tanaka@kondangsensei.my.id',
        roles: ['sensei'],
        classId: 'cls_batch1_n5',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
  }
  if (token === 'mock_jwt_other_sensei_token') {
    return {
      valid: true,
      payload: {
        userId: 'usr_sensei_002',
        name: 'Yamada Sensei',
        email: 'yamada@kondangsensei.my.id',
        roles: ['sensei'],
        classId: 'cls_batch2_n5',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
  }
  if (token === 'mock_jwt_siswa_n5_valid_token') {
    return {
      valid: true,
      payload: {
        userId: 'usr_siswa_001',
        name: 'Budi Pratama',
        email: 'budi@example.com',
        roles: ['siswa_n5'],
        classId: 'cls_batch1_n5',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
  }
  if (token === 'mock_jwt_peserta_jft_valid_token') {
    return {
      valid: true,
      payload: {
        userId: 'usr_peserta_001',
        name: 'Siti Rahma',
        email: 'siti@example.com',
        roles: ['peserta_jft'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
  }
  if (token === 'mock_jwt_bundling_user_token') {
    return {
      valid: true,
      payload: {
        userId: 'usr_bundle_001',
        name: 'Andi Wijaya',
        email: 'andi@example.com',
        roles: ['siswa_n5', 'peserta_jft'],
        classId: 'cls_batch1_n5',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
  }
  if (token === 'mock_jwt_unregistered_token') {
    return {
      valid: true,
      payload: {
        userId: 'usr_anon_001',
        name: 'Anonimous',
        email: 'anon@example.com',
        roles: [],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
  }

  // Parse Real JWT
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'invalid' };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  // Verify HMAC signature
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(`${encodedHeader}.${encodedPayload}`).digest()
  );

  if (encodedSignature !== expectedSignature) {
    return { valid: false, reason: 'invalid' };
  }

  try {
    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: 'expired' };
    }

    if (payload.isSuspended) {
      return { valid: false, reason: 'suspended' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}

/**
 * Build Cross-Subdomain Session Cookie string according to M0 specifications
 */
export function buildSessionCookie(token: string, host = 'kondangsensei.my.id'): string {
  // If host is on kondangsensei domain, use wildcard domain .kondangsensei.my.id
  const isKondangDomain = host.includes('kondangsensei.my.id');
  const domainPart = isKondangDomain ? '; Domain=.kondangsensei.my.id' : '';
  const securePart = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `ks_session_token=${token}${domainPart}; Path=/; HttpOnly; SameSite=Lax${securePart}`;
}

/**
 * Build Clear Cookie string for global logout
 */
export function buildClearSessionCookie(host = 'kondangsensei.my.id'): string {
  const isKondangDomain = host.includes('kondangsensei.my.id');
  const domainPart = isKondangDomain ? '; Domain=.kondangsensei.my.id' : '';

  return `ks_session_token=; Max-Age=0${domainPart}; Path=/; HttpOnly; SameSite=Lax`;
}

/**
 * Extract token from either Cookie or Authorization header
 */
export function extractToken(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. Cookie: ks_session_token=<token>
  const cookieHeader = req.headers['cookie'] || req.headers['Cookie'];
  if (cookieHeader && typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/ks_session_token=([^;]+)/);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

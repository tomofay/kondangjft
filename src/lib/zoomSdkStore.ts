/**
 * Zoom Meeting Web SDK Store & Signature Generator (M13)
 * Handles in-app video room signatures, host/attendee role partitioning,
 * and automated presence logging.
 */

import crypto from 'crypto';

export interface ZoomMeetingConfig {
  classId: string;
  meetingNumber: string;
  password: string;
  topic: string;
}

export const ZOOM_CLASS_MEETINGS: Record<string, ZoomMeetingConfig> = {
  cls_batch1_n5: {
    classId: 'cls_batch1_n5',
    meetingNumber: '84291038472',
    password: 'kdgsensei2026',
    topic: 'Kelas Intensif N5 Batch 1 - Live Sesi Bunpou & Renshu'
  },
  cls_batch2_n5: {
    classId: 'cls_batch2_n5',
    meetingNumber: '89123847192',
    password: 'kdgsensei_batch2',
    topic: 'Kelas Intensif N5 Batch 2'
  }
};

const attendanceLogs: Array<{
  userId: string;
  classId: string;
  meetingStatus: string;
  timestamp: string;
}> = [];

/**
 * Generate Zoom Web SDK JWT / HMAC Signature
 */
export function generateZoomSignature(params: {
  userId: string;
  name: string;
  roles: string[];
  userClassId?: string;
  classId?: string;
}): {
  success: boolean;
  status?: number;
  error?: string;
  signature?: string;
  meetingNumber?: string;
  password?: string;
  role?: number;
  userName?: string;
} {
  const { name, roles, userClassId, classId } = params;

  // 1. Validation: classId is required
  if (!classId) {
    return {
      success: false,
      status: 400,
      error: 'classId wajib disertakan dalam permintaan pembuatan signature Zoom'
    };
  }

  // 2. RBAC & Class Membership Check
  const isSuperAdmin = roles.includes('super_admin');
  const isSensei = roles.includes('sensei');
  const isSiswaN5 = roles.includes('siswa_n5');
  const isPesertaJFT = roles.includes('peserta_jft') && !isSiswaN5 && !isSensei && !isSuperAdmin;

  if (isPesertaJFT) {
    return {
      success: false,
      status: 403,
      error: 'Forbidden: Peserta JFT tidak memiliki akses ke kelas live N5'
    };
  }

  let role = 0; // 0 = Attendee, 1 = Host

  if (isSuperAdmin) {
    role = 1; // Supervisory Host
  } else if (isSensei) {
    if (userClassId && userClassId !== classId) {
      return {
        success: false,
        status: 403,
        error: 'Anda bukan pengampu kelas ini'
      };
    }
    role = 1; // Host
  } else if (isSiswaN5) {
    if (userClassId && userClassId !== classId) {
      return {
        success: false,
        status: 403,
        error: 'Anda bukan peserta kelas ini'
      };
    }
    role = 0; // Attendee
  }

  const meeting = ZOOM_CLASS_MEETINGS[classId] || {
    classId,
    meetingNumber: '84291038472',
    password: 'kdgsensei2026',
    topic: 'Kelas Intensif N5'
  };

  const sdkKey = process.env.ZOOM_SDK_KEY || 'mock_zoom_sdk_key_kondangsensei';
  const sdkSecret = process.env.ZOOM_SDK_SECRET || 'mock_zoom_sdk_secret_2026';
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 7200; // 2 hours

  // Build Zoom HMAC-SHA256 signature
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      appKey: sdkKey,
      sdkKey: sdkKey,
      mn: meeting.meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      tokenExp: exp
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', sdkSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const jwtSignature = `${header}.${payload}.${signature}`;

  return {
    success: true,
    signature: jwtSignature,
    meetingNumber: meeting.meetingNumber,
    password: meeting.password,
    role,
    userName: name
  };
}

/**
 * Log student attendance when connecting to Zoom session
 */
export function recordZoomAttendance(params: {
  userId: string;
  classId: string;
  meetingStatus: string;
  timestamp?: string;
}) {
  const { userId, classId, meetingStatus, timestamp = new Date().toISOString() } = params;

  attendanceLogs.push({
    userId,
    classId,
    meetingStatus,
    timestamp
  });

  return {
    success: true,
    attendanceLogged: true
  };
}

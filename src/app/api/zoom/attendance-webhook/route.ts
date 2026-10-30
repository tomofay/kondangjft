import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { recordZoomAttendance } from '@/lib/zoomSdkStore';

export async function POST(request: Request) {
  try {
    const token = extractToken({
      headers: {
        cookie: request.headers.get('cookie') || '',
        authorization: request.headers.get('authorization') || ''
      }
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = verifySessionToken(token);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = auth.payload;

    const body = await request.json().catch(() => ({}));
    const classId = body.classId || 'cls_batch1_n5';
    const meetingStatus = body.meetingStatus || 'connected';
    const timestamp = body.timestamp;

    const result = recordZoomAttendance({
      userId,
      classId,
      meetingStatus,
      timestamp
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

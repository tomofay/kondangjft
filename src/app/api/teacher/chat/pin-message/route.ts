import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { classroomChatStore } from '@/lib/classroomChatStore';

export async function POST(request: Request) {
  try {
    const token = extractToken({
      headers: {
        cookie: request.headers.get('cookie') || '',
        authorization: request.headers.get('authorization') || ''
      }
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan' }, { status: 401 });
    }

    const auth = verifySessionToken(token);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { classId, messageId, isPinned } = body;

    if (!classId || !messageId) {
      return NextResponse.json({ error: 'classId dan messageId wajib disertakan' }, { status: 400 });
    }

    const result = classroomChatStore.pinMessage(classId, auth.payload, {
      messageId,
      isPinned: Boolean(isPinned)
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      isPinned: result.isPinned
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

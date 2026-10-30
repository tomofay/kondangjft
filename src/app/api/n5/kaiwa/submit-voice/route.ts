import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { saveVoiceRecording } from '@/lib/kaiwaStore';

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

    const { roles, userId } = auth.payload;
    const isN5Eligible = roles.includes('siswa_n5') || roles.includes('sensei') || roles.includes('super_admin');
    if (!isN5Eligible) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses ke Modul Percakapan Kaiwa N5' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let lineId = 'kw_line_001';
    let durationSeconds = 3.0;
    let bufferSize = 0;
    let filename = 'recording.webm';
    let fileMime = 'audio/webm';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audioFile') as File | null;
      lineId = (formData.get('lineId') as string) || lineId;
      const dur = formData.get('durationSeconds');
      if (dur) durationSeconds = parseFloat(dur as string);

      if (audioFile) {
        bufferSize = audioFile.size;
        filename = audioFile.name || filename;
        fileMime = audioFile.type || fileMime;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      lineId = body.lineId || lineId;
      durationSeconds = body.durationSeconds ? Number(body.durationSeconds) : durationSeconds;
      bufferSize = body.bufferSize || 1024;
    }

    const result = saveVoiceRecording(
      userId,
      lineId,
      durationSeconds,
      bufferSize,
      filename,
      fileMime
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: (result as { status: number }).status || 400 });
    }

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      status: result.status,
      fileUrl: result.fileUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

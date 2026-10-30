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

    const contentType = request.headers.get('content-type') || '';
    let classId = 'cls_batch1_n5';
    let fileSize = 0;
    let fileName = 'attachment.pdf';
    let mimeType = 'application/pdf';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('attachment') as File | null;
      classId = (formData.get('classId') as string) || classId;

      if (file) {
        fileSize = file.size;
        fileName = file.name || fileName;
        mimeType = file.type || mimeType;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      classId = body.classId || classId;
      fileSize = body.fileSize || 0;
      fileName = body.fileName || fileName;
      mimeType = body.mimeType || mimeType;
    }

    const result = classroomChatStore.processAttachmentUpload(
      classId,
      auth.payload,
      fileSize,
      fileName,
      mimeType
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      attachment: result.attachment
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

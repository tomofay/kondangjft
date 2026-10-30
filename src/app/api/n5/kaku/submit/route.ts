import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { saveKakuSubmission } from '@/lib/kakuStore';

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
        { error: 'Forbidden: Anda tidak memiliki akses untuk mengumpulkan tugas Kaku N5' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let assignmentId = 'kaku_assign_ch1';
    let classId = 'cls_batch1_n5';
    let compressedSizeKb = 350;
    let originalSizeKb = 4200;
    let bufferSize = 0;
    let filename = 'kaku_homework.webp';
    let fileMime = 'image/webp';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('homeworkPhoto') as File | null;
      assignmentId = (formData.get('assignmentId') as string) || assignmentId;
      classId = (formData.get('classId') as string) || classId;
      const comp = formData.get('compressedSizeKb');
      if (comp) compressedSizeKb = parseInt(comp as string, 10);
      const orig = formData.get('originalSizeKb');
      if (orig) originalSizeKb = parseInt(orig as string, 10);

      if (file) {
        bufferSize = file.size;
        filename = file.name || filename;
        fileMime = file.type || fileMime;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      assignmentId = body.assignmentId || assignmentId;
      classId = body.classId || classId;
      compressedSizeKb = body.compressedSizeKb || 350;
      originalSizeKb = body.originalSizeKb || 4200;
      bufferSize = body.bufferSize || 350 * 1024;
      filename = body.filename || filename;
      fileMime = body.fileMime || fileMime;
    }

    const result = saveKakuSubmission({
      userId,
      assignmentId,
      classId,
      bufferSize,
      filename,
      contentType: fileMime,
      compressedSizeKb,
      originalSizeKb
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      submission: result.submission
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

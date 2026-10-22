import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file audio yang dipilih.' },
        { status: 400 }
      );
    }

    // Validasi tipe audio
    const allowedExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
    const ext = (path.extname(file.name) || '').toLowerCase();
    const isAudioType = file.type.startsWith('audio/') || allowedExts.includes(ext);

    if (!isAudioType) {
      return NextResponse.json(
        { success: false, message: 'File harus berupa audio (MP3, WAV, OGG, M4A, AAC).' },
        { status: 400 }
      );
    }

    // Validasi ukuran (maksimal 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran audio maksimal 25MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl = '';
    try {
      // Direktori tujuan: public/uploads/audio
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
      await mkdir(uploadDir, { recursive: true });

      // Generate nama file unik
      const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.mp3';
      const filename = `chokai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      publicUrl = `/uploads/audio/${filename}`;
    } catch (fsErr) {
      console.warn('Filesystem write failed, using data URL fallback for audio:', fsErr);
      const mime = file.type || 'audio/mpeg';
      publicUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Audio berhasil diunggah.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error uploading audio:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengunggah audio: ' + message },
      { status: 500 }
    );
  }
}

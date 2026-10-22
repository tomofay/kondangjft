import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file gambar yang dipilih.' },
        { status: 400 }
      );
    }

    // Validasi mime type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File harus berupa gambar (JPG, PNG, WebP, GIF, SVG).' },
        { status: 400 }
      );
    }

    // Validasi ukuran (maksimal 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran foto maksimal 10MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl = '';
    try {
      // Direktori tujuan: public/uploads/questions
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'questions');
      await mkdir(uploadDir, { recursive: true });

      // Generate nama file unik
      const ext = path.extname(file.name) || '.png';
      const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.png';
      const filename = `soal-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      publicUrl = `/uploads/questions/${filename}`;
    } catch (fsErr) {
      console.warn('Filesystem write failed, using data URL fallback:', fsErr);
      const mime = file.type || 'image/png';
      publicUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Foto soal berhasil diunggah.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error uploading question image:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengunggah gambar: ' + message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file foto yang dipilih.' },
        { status: 400 }
      );
    }

    // Validasi mime type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File harus berupa gambar (JPG, PNG, WebP).' },
        { status: 400 }
      );
    }

    // Validasi ukuran (maksimal 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran foto maksimal 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pastikan direktori tujuan ada: public/uploads/avatars
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    // Generate nama file unik aman
    const ext = path.extname(file.name) || '.jpg';
    const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.jpg';
    const filename = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${cleanExt}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Foto profil berhasil diunggah.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengunggah foto: ' + message },
      { status: 500 }
    );
  }
}

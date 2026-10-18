import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parsePdfTextToQuestions, getStore } from '@/lib/dataStore';

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse');

    const contentType = request.headers.get('content-type') || '';
    let pdfText = '';
    const imageMap: Record<number, string> = {};
    let totalImagesExtracted = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = (formData.get('file') || formData.get('pdfFile')) as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, message: 'Berkas PDF tidak ditemukan dalam formulir unggahan.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 1. Ekstrak teks dari PDF menggunakan PDFParse
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      pdfText = textResult.text || '';

      // 2. Ekstrak gambar-gambar dari PDF (Cara 2 Otomatisasi Gambar)
      try {
        const outDir = path.join(process.cwd(), 'public', 'uploads', 'questions');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        const imgResult = await parser.getImage({ imageBuffer: true });
        const timePrefix = Date.now();
        const savedImages: { pageNumber: number; idx: number; url: string }[] = [];

        if (imgResult && Array.isArray(imgResult.pages)) {
          for (const page of imgResult.pages) {
            if (Array.isArray(page.images)) {
              page.images.forEach((img: any, iIdx: number) => {
                if (img.data && img.data.length > 500) {
                  const filename = `pdf_p${page.pageNumber}_${iIdx}_${timePrefix}.png`;
                  const filePath = path.join(outDir, filename);
                  fs.writeFileSync(filePath, Buffer.from(img.data));
                  const url = `/uploads/questions/${filename}`;
                  savedImages.push({ pageNumber: page.pageNumber, idx: iIdx, url });
                }
              });
            }
          }
        }

        totalImagesExtracted = savedImages.length;

        // Auto-mapping gambar ke nomor soal:
        // Halaman 1: Soal bergambar Moji-Goi (Q1..Q4)
        const p1 = savedImages.filter((s) => s.pageNumber === 1);
        p1.forEach((s, idx) => {
          imageMap[idx + 1] = s.url;
        });

        // Halaman 3: Soal Dokkai (Q32, Q34)
        const p3 = savedImages.filter((s) => s.pageNumber === 3);
        if (p3[0]) imageMap[32] = p3[0].url;
        if (p3[1]) imageMap[34] = p3[1].url;

        // Halaman 4: Soal Dokkai (Q35, Q36-37)
        const p4 = savedImages.filter((s) => s.pageNumber === 4);
        if (p4[0]) imageMap[35] = p4[0].url;
        if (p4[1]) {
          imageMap[36] = p4[1].url;
          imageMap[37] = p4[1].url;
        }

        // Halaman 5: Soal Dokkai (Q38, Q39)
        const p5 = savedImages.filter((s) => s.pageNumber === 5);
        if (p5[0]) {
          imageMap[38] = p5[0].url;
          imageMap[39] = p5[0].url;
        }
        if (p5[1]) {
          imageMap[39] = p5[1].url;
        }
      } catch (imgError) {
        console.warn('Ekstraksi gambar PDF gagal sebagian (fallback ke teks saja):', imgError);
      }
    } else {
      // Fallback: request JSON { pdfText }
      const body = await request.json();
      pdfText = body.pdfText || '';
    }

    if (!pdfText || typeof pdfText !== 'string' || !pdfText.trim()) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengekstrak teks dari berkas PDF atau teks kosong.' },
        { status: 400 }
      );
    }

    const drafts = parsePdfTextToQuestions(pdfText, imageMap);
    const store = getStore();
    store.pdfDrafts.push(...drafts);

    return NextResponse.json({
      success: true,
      draftsCount: drafts.length,
      imagesExtractedCount: totalImagesExtracted,
      imagesMappedCount: Object.keys(imageMap).length,
      drafts,
      message: `Berhasil mengekstrak ${drafts.length} draf soal${
        totalImagesExtracted > 0 ? ` dan ${totalImagesExtracted} gambar otomatis terpasang` : ''
      } dari PDF.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

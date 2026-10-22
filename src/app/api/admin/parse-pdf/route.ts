import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parsePdfTextToQuestions, getStore } from '@/lib/dataStore';

// Polyfill DOMMatrix, Path2D, ImageData on globalThis for Node.js production server environments
function ensurePdfPolyfills() {
  const g = globalThis as any;
  const nodeG = global as any;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const canvas = require('@napi-rs/canvas');
    if (canvas) {
      if (!g.DOMMatrix && canvas.DOMMatrix) g.DOMMatrix = canvas.DOMMatrix;
      if (!nodeG.DOMMatrix && canvas.DOMMatrix) nodeG.DOMMatrix = canvas.DOMMatrix;
      if (!g.Path2D && canvas.Path2D) g.Path2D = canvas.Path2D;
      if (!nodeG.Path2D && canvas.Path2D) nodeG.Path2D = canvas.Path2D;
      if (!g.ImageData && canvas.ImageData) g.ImageData = canvas.ImageData;
      if (!nodeG.ImageData && canvas.ImageData) nodeG.ImageData = canvas.ImageData;
      if (!g.DOMPoint && canvas.DOMPoint) g.DOMPoint = canvas.DOMPoint;
      if (!nodeG.DOMPoint && canvas.DOMPoint) nodeG.DOMPoint = canvas.DOMPoint;
      if (!g.DOMRect && canvas.DOMRect) g.DOMRect = canvas.DOMRect;
      if (!nodeG.DOMRect && canvas.DOMRect) nodeG.DOMRect = canvas.DOMRect;
    }
  } catch {
    // @napi-rs/canvas native bindings might be absent on some VPS / container environments
  }

  if (!g.DOMMatrix || !nodeG.DOMMatrix) {
    class SimpleDOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;

      constructor(init?: any) {
        if (Array.isArray(init)) {
          if (init.length === 6) {
            this.a = this.m11 = init[0];
            this.b = this.m12 = init[1];
            this.c = this.m21 = init[2];
            this.d = this.m22 = init[3];
            this.e = this.m41 = init[4];
            this.f = this.m42 = init[5];
            this.is2D = true;
          } else if (init.length === 16) {
            this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3];
            this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7];
            this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11];
            this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15];
            this.a = this.m11; this.b = this.m12; this.c = this.m21; this.d = this.m22;
            this.e = this.m41; this.f = this.m42;
            this.is2D = false;
          }
        } else if (init && typeof init === 'object') {
          Object.assign(this, init);
        }
      }

      translate(tx = 0, ty = 0, tz = 0) {
        const copy = new SimpleDOMMatrix(this);
        copy.e += tx;
        copy.m41 += tx;
        copy.f += ty;
        copy.m42 += ty;
        return copy;
      }

      scale(scaleX = 1, scaleY?: number, scaleZ = 1) {
        const sy = scaleY !== undefined ? scaleY : scaleX;
        const copy = new SimpleDOMMatrix(this);
        copy.a *= scaleX;
        copy.m11 *= scaleX;
        copy.d *= sy;
        copy.m22 *= sy;
        return copy;
      }

      multiply(other: any) { return new SimpleDOMMatrix(this); }
      multiplySelf(other: any) { return this; }
      preMultiplySelf(other: any) { return this; }

      invertSelf() {
        const det = this.a * this.d - this.b * this.c;
        if (det !== 0) {
          const invDet = 1 / det;
          const a = this.d * invDet;
          const b = -this.b * invDet;
          const c = -this.c * invDet;
          const d = this.a * invDet;
          const e = (this.c * this.f - this.d * this.e) * invDet;
          const f = (this.b * this.e - this.a * this.f) * invDet;
          this.a = this.m11 = a;
          this.b = this.m12 = b;
          this.c = this.m21 = c;
          this.d = this.m22 = d;
          this.e = this.m41 = e;
          this.f = this.m42 = f;
        }
        return this;
      }

      inverse() {
        const copy = new SimpleDOMMatrix(this);
        return copy.invertSelf();
      }

      transformPoint(p: any) { return p; }

      toFloat32Array() {
        return new Float32Array([
          this.m11, this.m12, this.m13, this.m14,
          this.m21, this.m22, this.m23, this.m24,
          this.m31, this.m32, this.m33, this.m34,
          this.m41, this.m42, this.m43, this.m44
        ]);
      }

      toFloat64Array() {
        return new Float64Array([
          this.m11, this.m12, this.m13, this.m14,
          this.m21, this.m22, this.m23, this.m24,
          this.m31, this.m32, this.m33, this.m34,
          this.m41, this.m42, this.m43, this.m44
        ]);
      }
    }

    g.DOMMatrix = SimpleDOMMatrix;
    nodeG.DOMMatrix = SimpleDOMMatrix;
  }

  if (!g.Path2D || !nodeG.Path2D) {
    class SimplePath2D {
      addPath() {}
    }
    g.Path2D = SimplePath2D;
    nodeG.Path2D = SimplePath2D;
  }

  if (!g.ImageData || !nodeG.ImageData) {
    class SimpleImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(w = 1, h = 1) {
        this.width = w;
        this.height = h;
        this.data = new Uint8ClampedArray(w * h * 4);
      }
    }
    g.ImageData = SimpleImageData;
    nodeG.ImageData = SimpleImageData;
  }
}

// Execute immediately upon module import
ensurePdfPolyfills();

function getCharWidths(str: string, totalWidth: number): number[] {
  const weights = Array.from(str).map((ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 0x3000 && code <= 0x9fff) return 1.0;
    if (code >= 0xff01 && code <= 0xff60) return 1.0;
    return 0.5;
  });
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  const unit = totalWidth / (sumWeights || 1);
  return weights.map((w) => w * unit);
}

async function injectVectorUnderlines(parser: any, rawPdfText: string): Promise<string> {
  let fullText = rawPdfText;
  try {
    const doc = await parser.load();
    for (let pNum = 1; pNum <= doc.numPages; pNum++) {
      const page = await doc.getPage(pNum);
      const ops = await page.getOperatorList();
      const textContent = await page.getTextContent();

      const underlines: { minX: number; maxX: number; y: number }[] = [];
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === 91) {
          const args = ops.argsArray[i];
          const bbox = args[2];
          if (bbox && bbox.length === 4) {
            const height = Math.abs(bbox[3] - bbox[1]);
            const width = Math.abs(bbox[2] - bbox[0]);
            if (height < 2.5 && width > 8 && width < 400) {
              underlines.push({ minX: bbox[0], maxX: bbox[2], y: (bbox[1] + bbox[3]) / 2 });
            }
          }
        }
      }

      if (underlines.length === 0) continue;

      for (const u of underlines) {
        for (const item of textContent.items) {
          if (!item.str || !item.transform) continue;
          const tx = item.transform[4];
          const ty = item.transform[5];
          const itemWidth = item.width || 0;
          const yDiff = ty - u.y;
          if (yDiff < -3 || yDiff > 8) continue;
          if (u.maxX <= tx || u.minX >= tx + itemWidth) continue;

          const chars = Array.from(item.str as string);
          const charWidths = getCharWidths(item.str, itemWidth);
          let curX = tx;
          let startChar = -1;
          let endChar = -1;

          for (let c = 0; c < chars.length; c++) {
            const cStart = curX;
            const cEnd = curX + charWidths[c];
            const cMid = (cStart + cEnd) / 2;
            if (cMid >= u.minX && cMid <= u.maxX) {
              if (startChar === -1) startChar = c;
              endChar = c + 1;
            }
            curX = cEnd;
          }

          if (startChar !== -1 && endChar !== -1) {
            const originalText = item.str;
            const before = chars.slice(0, startChar).join('');
            const target = chars.slice(startChar, endChar).join('');
            const after = chars.slice(endChar).join('');
            const underlinedText = `${before}<u>${target}</u>${after}`;

            const origClean = originalText.replace(/^[０-９\d]+[\.．\:]\s*/, '').trim();
            const underClean = underlinedText.replace(/^[０-９\d]+[\.．\:]\s*/, '').trim();

            if (origClean && underClean && fullText.includes(origClean)) {
              fullText = fullText.replace(origClean, underClean);
            }
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Gagal membaca underline garis vektor PDF:', err);
  }
  return fullText;
}

export async function POST(request: Request) {
  try {
    ensurePdfPolyfills();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse');

    // Ensure worker path is set to the real file if present to prevent fake worker missing error
    try {
      const candidates = [
        path.join(process.cwd(), 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'cjs', 'pdf.worker.mjs'),
        path.join(process.cwd(), '.next', 'standalone', 'node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'cjs', 'pdf.worker.mjs'),
        '/app/node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs',
        '/app/node_modules/pdf-parse/dist/pdf-parse/web/pdf.worker.min.mjs'
      ];
      let workerConfigured = false;
      for (const p of candidates) {
        if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
          PDFParse.setWorker(p);
          workerConfigured = true;
          break;
        }
      }
      if (!workerConfigured && PDFParse.setWorker) {
        PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@2.4.5/dist/pdf-parse/web/pdf.worker.min.mjs');
      }
    } catch {
      // ignore
    }

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

      // 1. Ekstrak teks dari PDF menggunakan PDFParse & injeksikan tag <u> untuk target bergaris bawah
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      pdfText = textResult.text || '';
      pdfText = await injectVectorUnderlines(parser, pdfText);

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

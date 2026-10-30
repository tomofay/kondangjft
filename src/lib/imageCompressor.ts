/**
 * Client-Side Image Compressor for Kaku Homework Photos (M8)
 * Compresses smartphone camera photos (5-15MB) into high-quality WebP (< 500KB)
 * maintaining stroke sharpness for Sensei's physical-to-digital review.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  targetFormat?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export interface CompressionResult {
  blob: Blob;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatioPercent: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Compresses an image file in-browser using HTML5 Canvas
 */
export async function compressHomeworkImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const { maxDimension = 1920, quality = 0.82, targetFormat = 'image/webp' } = options;

  // In Node / SSR environment without window/document, return raw blob
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return resolve(file);
          }

          let { width, height } = img;

          // Scale down while maintaining aspect ratio if exceeding max dimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // High-quality canvas rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                // Fallback to jpeg if webp export failed
                canvas.toBlob(
                  (fallbackBlob) => {
                    resolve(fallbackBlob || file);
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            targetFormat,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Gagal memuat gambar untuk dikompresi.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Gagal membaca file foto tugas.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Detailed compression helper that calculates stats
 */
export async function compressHomeworkWithStats(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);
  const compressedBlob = await compressHomeworkImage(file, options);
  const compressedSizeKb = Math.round(compressedBlob.size / 1024);
  const compressionRatioPercent = originalSizeKb > 0
    ? Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100)
    : 0;

  return {
    blob: compressedBlob,
    originalSizeKb,
    compressedSizeKb,
    compressionRatioPercent,
    width: options.maxDimension || 1920,
    height: options.maxDimension || 1080,
    format: compressedBlob.type || 'image/webp'
  };
}

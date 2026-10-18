import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    // Sanitize path segments to prevent directory traversal
    const safeSegments = pathSegments.map((s) => s.replace(/\.\./g, ''));
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...safeSegments);

    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return new NextResponse('File Not Found', { status: 404 });
  }
}

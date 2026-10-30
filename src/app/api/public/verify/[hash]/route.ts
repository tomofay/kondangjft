import { NextResponse } from 'next/server';
import { verifyCertificateByHash } from '@/lib/omakeCertificateStore';

export async function GET(
  _request: Request,
  context: { params: Promise<{ hash: string }> }
) {
  try {
    const params = await context.params;
    const hash = params.hash;

    const result = verifyCertificateByHash(hash);

    if (!result.isAuthentic) {
      return NextResponse.json(
        { isAuthentic: false, error: result.error },
        { status: result.status || 404 }
      );
    }

    return NextResponse.json({
      isAuthentic: true,
      data: result.data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

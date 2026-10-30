import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { runWhatsAppReengagementCron } from '@/lib/gamificationStore';

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

    const { roles } = auth.payload;
    if (!roles.includes('super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Super Admin yang berwenang mengeksekusi cron WhatsApp re-engagement' },
        { status: 403 }
      );
    }

    const result = runWhatsAppReengagementCron();

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

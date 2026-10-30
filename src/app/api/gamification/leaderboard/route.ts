import { NextResponse } from 'next/server';
import { extractToken, verifySessionToken } from '@/lib/authCookie';
import { getClassLeaderboard } from '@/lib/gamificationStore';

export async function GET(request: Request) {
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

    const { classId: userClassId, roles } = auth.payload;
    const isStaff = roles.includes('sensei') || roles.includes('super_admin');

    const { searchParams } = new URL(request.url);
    const targetClassId = searchParams.get('classId') || 'cls_batch1_n5';

    // If student tries to access another class leaderboard
    if (!isStaff && userClassId && targetClassId !== userClassId) {
      return NextResponse.json(
        { error: 'Bukan anggota kelas ini: Anda tidak diizinkan mengakses papan peringkat kelas lain.' },
        { status: 403 }
      );
    }

    const result = getClassLeaderboard(targetClassId, isStaff ? undefined : userClassId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      leaderboard: result.leaderboard
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

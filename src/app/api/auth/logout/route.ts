import { NextResponse } from 'next/server';
import { kickUserSession } from '../../../../lib/dataStore';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (userId) {
      kickUserSession(userId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}

import { NextResponse } from 'next/server';
import { DEFAULT_PACKAGES, getStore } from '@/lib/dataStore';

export async function GET() {
  const store = getStore();
  const packages = store.packages && store.packages.length > 0 ? store.packages : DEFAULT_PACKAGES;
  return NextResponse.json({ success: true, packages });
}

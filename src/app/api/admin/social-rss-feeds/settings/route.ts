// Posts-per-feed settings removed; keep route as a no-op for backward compatibility
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ count: 3 });
}

export async function PUT() {
  return NextResponse.json({ ok: true });
}



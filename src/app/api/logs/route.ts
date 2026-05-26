import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/store';

export async function GET() {
  const logs = getLogs(30);
  return NextResponse.json({ logs });
}

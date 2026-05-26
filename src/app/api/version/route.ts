import { NextResponse } from 'next/server';

// Version — update this constant before each deploy
export const APP_VERSION = '1.1.0';
export const BUILD_DATE = '2026-05-27 22:00';

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    buildDate: BUILD_DATE,
  });
}

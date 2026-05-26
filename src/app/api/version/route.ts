import { NextResponse } from 'next/server';

// Version — update this constant before each deploy
export const APP_VERSION = '1.0.6';
export const BUILD_DATE = '2026-05-27 21:45';

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    buildDate: BUILD_DATE,
  });
}

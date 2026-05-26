import { NextResponse } from 'next/server';
import { getActiveRooms } from '@/lib/store';

export async function GET() {
  try {
    const rooms = getActiveRooms();
    return NextResponse.json({ success: true, rooms });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

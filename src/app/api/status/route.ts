import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getRoomByShortId } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Не указан ID комнаты' },
        { status: 400 }
      );
    }

    // Try full ID first, then short ID prefix
    let room = getRoom(roomId);
    if (!room) {
      room = getRoomByShortId(roomId);
    }

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Консультация не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

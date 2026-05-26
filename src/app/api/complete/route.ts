import { NextRequest, NextResponse } from 'next/server';
import { completeRoom, getRoom } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Не указан ID комнаты' },
        { status: 400 }
      );
    }

    const room = getRoom(roomId) || completeRoom(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Комната не найдена' },
        { status: 404 }
      );
    }

    const completed = completeRoom(roomId);

    return NextResponse.json({ success: true, room: completed });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

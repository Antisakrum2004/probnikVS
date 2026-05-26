import { NextRequest, NextResponse } from 'next/server';
import { activateRoom, getRoom } from '@/lib/store';

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

    const existing = getRoom(roomId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Комната не найдена' },
        { status: 404 }
      );
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        room: existing,
        message: `Комната в статусе: ${existing.status}`,
      });
    }

    const room = activateRoom(roomId);

    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

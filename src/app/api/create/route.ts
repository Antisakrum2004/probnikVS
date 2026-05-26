import { NextRequest, NextResponse } from 'next/server';
import { createRoom, callEmAICreate, getRoom } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      doctorName,
      patientName,
      patientId,
      doctorSpecId,
      callEmAI: shouldCallEmAI,
    } = body;

    if (!doctorName || typeof doctorName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Не указано имя врача' },
        { status: 400 }
      );
    }

    const room = createRoom(
      doctorName,
      patientName || 'Пациент',
      patientId || '22233',
      doctorSpecId || 'QWERTY'
    );

    // Call EmAI API if requested (default: true)
    let emaiResponse = null;
    if (shouldCallEmAI !== false) {
      try {
        emaiResponse = await callEmAICreate(room);
      } catch {
        // Even if EmAI fails, return the room (demo mode)
        emaiResponse = {
          success: false,
          error: 'EmAI API недоступен',
        };
      }
    }

    // Refresh room data (emaiSessionId may have been set)
    const updated = getRoom(room.id) || room;

    return NextResponse.json({ success: true, room: updated, emaiResponse });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

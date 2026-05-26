import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doctorName, patientName } = body;

    if (!doctorName || typeof doctorName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Не указано имя врача' },
        { status: 400 }
      );
    }

    const room = createRoom(
      doctorName,
      patientName || 'Пациент'
    );

    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

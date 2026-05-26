import { v4 as uuidv4 } from 'uuid';
import type { Room } from './types';

const rooms = new Map<string, Room>();

export function createRoom(doctorName: string, patientName: string = 'Пациент'): Room {
  const id = uuidv4();
  const shortId = id.substring(0, 8);
  const roomName = `miss-demo-${shortId}`;

  const room: Room = {
    id,
    roomName,
    doctorName,
    patientName,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  rooms.set(id, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function completeRoom(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (room) {
    room.status = 'completed';
    room.completedAt = new Date().toISOString();
    rooms.set(roomId, room);
  }
  return room;
}

export function cancelRoom(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (room) {
    room.status = 'cancelled';
    room.completedAt = new Date().toISOString();
    rooms.set(roomId, room);
  }
  return room;
}

export function getActiveRooms(): Room[] {
  return Array.from(rooms.values()).filter((r) => r.status === 'active');
}

export function getRoomByShortId(shortId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.id.startsWith(shortId)) {
      return room;
    }
  }
  return undefined;
}

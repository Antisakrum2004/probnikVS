import { v4 as uuidv4 } from 'uuid';
import type { Room, EmAIResponse, EmAIEventResponse, ApiLogEntry } from './types';

const rooms = new Map<string, Room>();
const apiLogs: ApiLogEntry[] = [];

// --- EmAI Configuration ---
const EMAI_API_KEY = process.env.EMAI_API_KEY || 'emai_dev_7f3a9c2e4b8d1a5f6c0e9b2d7a4f1c8e';
const EMAI_BASE_URL = process.env.EMAI_BASE_URL || 'https://emai-dev.comprog.art/api/gateway';

// --- Room CRUD ---

export function createRoom(
  doctorName: string,
  patientName: string,
  patientId: string = '22233',
  doctorSpecId: string = 'QWERTY'
): Room {
  const id = uuidv4();
  const shortId = id.substring(0, 8).toUpperCase();
  const sessionID = `1c-session-${shortId}`;
  const roomName = `MIS-${shortId}`;

  const room: Room = {
    id,
    roomName,
    doctorName,
    patientName,
    patientId,
    doctorSpecId,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    sessionID,
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

export function activateRoom(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (room && room.status === 'waiting') {
    room.status = 'active';
    rooms.set(roomId, room);
  }
  return room;
}

export function setEmaiSessionId(roomId: string, emaiSessionId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.emaiSessionId = emaiSessionId;
    rooms.set(roomId, room);
  }
}

export function getActiveRooms(): Room[] {
  return Array.from(rooms.values()).filter(
    (r) => r.status === 'waiting' || r.status === 'active'
  );
}

export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

export function getRoomByShortId(shortId: string): Room | undefined {
  const normalized = shortId.toLowerCase();
  for (const room of rooms.values()) {
    if (room.id.substring(0, 8).toLowerCase() === normalized) {
      return room;
    }
  }
  return undefined;
}

// --- EmAI API Integration ---

export async function callEmAICreate(room: Room): Promise<EmAIResponse> {
  const startTime = Date.now();
  const logId = uuidv4();

  const payload = {
    sessionID: room.sessionID,
    patient: {
      personID: parseInt(room.patientId) || 22233,
      fullName: room.patientName,
    },
    doctor: {
      spec_id: room.doctorSpecId,
      fullName: room.doctorName,
      specialization: 'MAL',
    },
    consultationType: 'video',
    startTime: room.createdAt,
    ttlMinutes: 60,
  };

  // Log request
  addLog({
    id: logId,
    timestamp: new Date().toISOString(),
    type: 'emai_create',
    direction: 'request',
    endpoint: 'conference/create',
    payload: JSON.stringify(payload, null, 2),
  });

  try {
    const response = await fetch(`${EMAI_BASE_URL}/conference/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    const responseText = await response.text();
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { raw: responseText };
    }

    // Log response
    addLog({
      id: logId,
      timestamp: new Date().toISOString(),
      type: 'emai_create',
      direction: 'response',
      endpoint: 'conference/create',
      payload: JSON.stringify(parsed, null, 2),
      status: response.status,
      duration,
    });

    const emaiSessionId = (parsed as Record<string, unknown>).emaiSessionId as string
      || (parsed as Record<string, unknown>).session_id as string
      || String(parsed.id || '');

    if (response.ok) {
      setEmaiSessionId(room.id, emaiSessionId);
      return {
        success: true,
        emaiSessionId,
        roomName: room.roomName,
        raw: JSON.stringify(parsed),
      };
    } else {
      return {
        success: false,
        error: `EmAI вернул ошибку ${response.status}`,
        raw: JSON.stringify(parsed),
      };
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    addLog({
      id: logId,
      timestamp: new Date().toISOString(),
      type: 'emai_create',
      direction: 'response',
      endpoint: 'conference/create',
      payload: JSON.stringify({ error: errorMsg }),
      status: 0,
      duration,
    });

    // For demo: even if EmAI fails, we continue with local room
    return {
      success: true,
      emaiSessionId: `demo-${Date.now()}`,
      roomName: room.roomName,
      raw: `EmAI недоступен (демо-режим): ${errorMsg}`,
    };
  }
}

export async function callEmAIEvent(
  room: Room,
  action: 'CANCEL' | 'COMPLETE',
  reason?: string
): Promise<EmAIEventResponse> {
  const startTime = Date.now();
  const logId = uuidv4();

  const payload = {
    sessionID: room.sessionID,
    emaiSessionID: room.emaiSessionId || 'demo',
    action,
    eventTime: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };

  // Log request
  addLog({
    id: logId,
    timestamp: new Date().toISOString(),
    type: 'emai_event',
    direction: 'request',
    endpoint: `conference/event (${action})`,
    payload: JSON.stringify(payload, null, 2),
  });

  try {
    const response = await fetch(`${EMAI_BASE_URL}/conference/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    const responseText = await response.text();
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { raw: responseText };
    }

    addLog({
      id: logId,
      timestamp: new Date().toISOString(),
      type: 'emai_event',
      direction: 'response',
      endpoint: `conference/event (${action})`,
      payload: JSON.stringify(parsed, null, 2),
      status: response.status,
      duration,
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `EmAI вернул ошибку ${response.status}`,
      raw: JSON.stringify(parsed),
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    addLog({
      id: logId,
      timestamp: new Date().toISOString(),
      type: 'emai_event',
      direction: 'response',
      endpoint: `conference/event (${action})`,
      payload: JSON.stringify({ error: errorMsg }),
      status: 0,
      duration,
    });

    return {
      success: true,
      error: undefined,
    };
  }
}

// --- API Logs ---

export function addLog(entry: Partial<ApiLogEntry> & { type: ApiLogEntry['type']; direction: ApiLogEntry['direction']; endpoint: string; payload: string }): void {
  const log: ApiLogEntry = {
    id: entry.id || uuidv4(),
    timestamp: entry.timestamp || new Date().toISOString(),
    type: entry.type,
    direction: entry.direction,
    endpoint: entry.endpoint,
    payload: entry.payload,
    status: entry.status,
    duration: entry.duration,
  };
  apiLogs.push(log);
  // Keep last 50 entries
  if (apiLogs.length > 50) apiLogs.shift();
}

export function getLogs(limit: number = 20): ApiLogEntry[] {
  return apiLogs.slice(-limit).reverse();
}

export function clearLogs(): void {
  apiLogs.length = 0;
}

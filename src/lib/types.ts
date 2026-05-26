export interface Room {
  id: string;
  roomName: string;
  doctorName: string;
  patientName: string;
  patientId: string;
  doctorSpecId: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  emaiSessionId?: string;
  sessionID?: string;
}

export interface EmAIResponse {
  success: boolean;
  emaiSessionId?: string;
  roomName?: string;
  error?: string;
  raw?: string;
}

export interface EmAIEventResponse {
  success: boolean;
  error?: string;
  raw?: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  type: 'emai_create' | 'emai_event' | 'system';
  direction: 'request' | 'response';
  endpoint: string;
  payload: string;
  status?: number;
  duration?: number;
}

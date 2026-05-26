export interface Room {
  id: string;
  roomName: string;
  doctorName: string;
  patientName: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

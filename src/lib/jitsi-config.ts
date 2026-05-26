export const JITSI_DOMAIN = 'meet.jit.si';

export function getRoomUrl(roomName: string): string {
  return `https://${JITSI_DOMAIN}/${roomName}`;
}

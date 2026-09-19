import type { RoomClient } from '@fedora-meetings/web-realtime';

let activeRoomClient: RoomClient | undefined;

export function setActiveRoomClient(client: RoomClient | undefined): void {
  activeRoomClient = client;
}

export function getActiveRoomClient(): RoomClient | undefined {
  return activeRoomClient;
}

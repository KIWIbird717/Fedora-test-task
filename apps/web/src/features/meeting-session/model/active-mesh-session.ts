import type { MeshCallSession } from '@fedora-meetings/web-webrtc';

let activeMeshSession: MeshCallSession | undefined;

export function setActiveMeshSession(
  session: MeshCallSession | undefined,
): void {
  activeMeshSession = session;
}

export function getActiveMeshSession(): MeshCallSession | undefined {
  return activeMeshSession;
}

import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { getActiveRoomClient } from './active-room-client';
import { getMeetingSessionSnapshot } from './meeting-session.store';
import { teardownSessionAfterServerLoss } from './teardown-session';

const CLIENT_INITIATED_DISCONNECT = 'io client disconnect';

export function isUnexpectedServerDisconnect(reason: string): boolean {
  return reason !== CLIENT_INITIATED_DISCONNECT;
}

export function handleSocketDisconnect(
  reason: string,
  navigateHome: () => void | Promise<void>,
): void {
  if (!isUnexpectedServerDisconnect(reason)) {
    return;
  }
  if (getMeetingSessionSnapshot().connection.status !== 'in-room') {
    return;
  }
  teardownSessionAfterServerLoss();
  void navigateHome();
}

export function useSocketLifecycle(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const client = getActiveRoomClient();
    if (!client) {
      return;
    }
    return client.onDisconnect((reason) => {
      handleSocketDisconnect(reason, () => navigate({ to: '/' }));
    });
  }, [navigate]);
}

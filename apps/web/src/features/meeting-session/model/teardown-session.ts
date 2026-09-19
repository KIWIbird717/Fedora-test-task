import { localMedia } from '@fedora-meetings/web-media';
import { useEffect } from 'react';
import {
  getActiveMeshSession,
  setActiveMeshSession,
} from './active-mesh-session';
import { releaseMeetingRealtime } from './join-meeting';
import {
  resetMeetingSession,
  setMeetingConnection,
} from './meeting-session.store';

function releaseRealtimeAndMedia(): void {
  releaseMeetingRealtime();
  getActiveMeshSession()?.dispose();
  setActiveMeshSession(undefined);
  localMedia.stopAll();
}

export function teardownSession(): void {
  releaseRealtimeAndMedia();
  resetMeetingSession();
}

export function teardownSessionAfterServerLoss(): void {
  releaseRealtimeAndMedia();
  resetMeetingSession();
  setMeetingConnection({ status: 'server-error' });
}

export function useSessionTeardown(): void {
  useEffect(() => {
    const onUnload = () => {
      teardownSession();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);
}

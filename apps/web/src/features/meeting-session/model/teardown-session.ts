import { localMedia } from '@fedora-meetings/web-media';
import { useEffect } from 'react';
import {
  getActiveMeshSession,
  setActiveMeshSession,
} from './active-mesh-session';
import { releaseMeetingRealtime } from './join-meeting';
import { resetMeetingSession } from './meeting-session.store';

export function teardownSession(): void {
  releaseMeetingRealtime();
  getActiveMeshSession()?.dispose();
  setActiveMeshSession(undefined);
  localMedia.release();
  resetMeetingSession();
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

import type { LocalMediaState } from '@fedora-meetings/web-media';
import { localMedia } from '@fedora-meetings/web-media';
import { getActiveRoomClient } from './active-room-client';
import { getActiveMeshSession } from './active-mesh-session';
import {
  getMeetingSessionSnapshot,
  setLocalMedia,
  updateMeetingParticipantMedia,
} from './meeting-session.store';

export async function setMicrophoneEnabled(
  enabled: boolean,
): Promise<void> {
  const previousAudio = liveTrack(
    getMeetingSessionSnapshot().localStream,
    'audio',
  );
  const state = await localMedia.setMicrophoneEnabled(enabled);
  const nextAudio = liveTrack(state.stream, 'audio');
  if (previousAudio?.id !== nextAudio?.id) {
    getActiveMeshSession()?.replaceTrack('audio', nextAudio);
  }
  publishLocalMedia(state);
}

export async function setCameraEnabled(enabled: boolean): Promise<void> {
  const state = await localMedia.setCameraEnabled(enabled);
  getActiveMeshSession()?.replaceTrack(
    'video',
    liveTrack(state.stream, 'video'),
  );
  publishLocalMedia(state);
}

export function publishLocalMedia(state: LocalMediaState): void {
  setLocalMedia({
    stream: state.stream,
    microphoneEnabled: state.microphoneEnabled,
    cameraEnabled: state.cameraEnabled,
  });
  const connection = getMeetingSessionSnapshot().connection;
  if (connection.status !== 'in-room') {
    return;
  }
  updateMeetingParticipantMedia(connection.participantId, {
    microphoneEnabled: state.microphoneEnabled,
    cameraEnabled: state.cameraEnabled,
  });
  void getActiveRoomClient()?.updateMedia({
    microphoneEnabled: state.microphoneEnabled,
    cameraEnabled: state.cameraEnabled,
  });
}

function liveTrack(
  stream: MediaStream | undefined,
  kind: 'audio' | 'video',
): MediaStreamTrack | null {
  return (
    stream
      ?.getTracks()
      .find((track) => track.kind === kind && track.readyState === 'live') ??
    null
  );
}

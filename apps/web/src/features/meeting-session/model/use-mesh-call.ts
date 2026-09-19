import { localMedia } from '@fedora-meetings/web-media';
import { MeshCallSession } from '@fedora-meetings/web-webrtc';
import {
  createSignalingSocketAdapter,
  type RoomClient,
} from '@fedora-meetings/web-realtime';
import { useEffect } from 'react';
import { getActiveRoomClient } from './active-room-client';
import {
  clearMeetingMedia,
  getMeetingSessionSnapshot,
  removePeerMedia,
  setLocalMedia,
  setPeerMediaState,
  setRemoteStream,
  useMeetingSession,
} from './meeting-session.store';

export function useMeshCall(): void {
  const session = useMeetingSession();
  const roomId =
    session.connection.status === 'in-room'
      ? session.connection.roomId
      : undefined;
  const participantId =
    session.connection.status === 'in-room'
      ? session.connection.participantId
      : undefined;

  useEffect(() => {
    if (!roomId || !participantId) {
      return;
    }
    const activeClient = getActiveRoomClient();
    if (!activeClient) {
      return;
    }
    const selfId = participantId;

    const snapshot = getMeetingSessionSnapshot();
    const mesh = new MeshCallSession({
      signaling: createSignalingSocketAdapter(activeClient),
      iceServers: snapshot.iceServers,
      onRemoteStream: (id, stream) => {
        setRemoteStream(id, stream);
      },
      onPeerState: (id, state) => {
        setPeerMediaState(id, state);
      },
    });

    let cancelled = false;
    const unsubscribers: Array<() => void> = [];

    void startMesh(activeClient);

    async function startMesh(roomClient: RoomClient): Promise<void> {
      const media = await localMedia.acquire();
      if (cancelled) {
        localMedia.release();
        return;
      }
      mesh.attachLocal(media.stream);
      setLocalMedia({
        stream: media.stream,
        microphoneEnabled: media.microphoneEnabled,
        cameraEnabled: media.cameraEnabled,
      });
      try {
        await roomClient.updateMedia({
          microphoneEnabled: media.microphoneEnabled,
          cameraEnabled: media.cameraEnabled,
        });
      } catch {
        // Stay in the room even if the media-state ack cannot be delivered.
      }
      if (cancelled) {
        return;
      }

      unsubscribers.push(
        roomClient.onParticipantJoined((participant) => {
          if (participant.id !== selfId) {
            mesh.addPeer(participant.id, 'offerer');
          }
        }),
        roomClient.onParticipantLeft((payload) => {
          mesh.removePeer(payload.participantId);
          removePeerMedia(payload.participantId);
        }),
      );

      const remotes = getMeetingSessionSnapshot().participants.filter(
        (participant) => participant.id !== selfId,
      );
      for (const remote of remotes) {
        mesh.addPeer(remote.id, 'answerer');
      }
    }

    return () => {
      cancelled = true;
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      mesh.dispose();
      localMedia.release();
      clearMeetingMedia();
    };
  }, [roomId, participantId]);
}

import {
  russianMessages,
  type ParticipantDto,
} from '@fedora-meetings/contracts-realtime';
import { useEffect, useRef } from 'react';
import {
  isFailedPeerMedia,
  resolvePeerConnectionState,
  type PeerConnectionState,
} from '../model/peer-connection-state';
import { MediaIndicators } from './media-indicators';
import { ParticipantName } from './participant-name';
import { ParticipantSilhouette } from './participant-silhouette';

export function RemoteTile({
  participant,
  stream,
  peerState,
  onAutoplayBlocked,
}: {
  participant: ParticipantDto;
  stream: MediaStream | undefined;
  peerState: PeerConnectionState | undefined;
  onAutoplayBlocked: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolvedState = resolvePeerConnectionState(peerState);
  const mediaFailed = isFailedPeerMedia(peerState);
  const showVideo =
    !mediaFailed && participant.cameraEnabled && hasLiveVideo(stream);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.srcObject = stream ?? null;
    if (!stream) {
      return;
    }
    void video.play().catch(() => {
      onAutoplayBlocked();
    });
  }, [stream, onAutoplayBlocked]);

  return (
    <article
      className="relative min-h-64 overflow-hidden rounded-lg bg-card"
      data-peer-state={resolvedState}
    >
      {stream && !mediaFailed ? (
        <video
          ref={videoRef}
          className={
            showVideo
              ? 'h-full min-h-64 w-full object-cover'
              : 'pointer-events-none absolute h-px w-px opacity-0'
          }
          autoPlay
          playsInline
          data-remote="true"
        />
      ) : null}
      {!showVideo ? (
        <div className="flex min-h-64 h-full w-full flex-col items-center justify-center gap-2 bg-secondary p-4">
          <ParticipantSilhouette className="h-20 w-20" />
          {mediaFailed ? (
            <p className="text-center text-sm text-foreground">
              {russianMessages.PEER_MEDIA_FAILED}
            </p>
          ) : null}
        </div>
      ) : null}
      <MediaIndicators
        microphoneEnabled={participant.microphoneEnabled}
        cameraEnabled={participant.cameraEnabled}
      />
      <p className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-sm text-foreground">
        <ParticipantName name={participant.displayName} />
      </p>
    </article>
  );
}

function hasLiveVideo(stream: MediaStream | undefined): boolean {
  return Boolean(
    stream
      ?.getVideoTracks()
      .some((track) => track.readyState === 'live' && track.enabled),
  );
}

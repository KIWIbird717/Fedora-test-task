import type { ParticipantDto } from '@fedora-meetings/contracts-realtime';
import { useEffect, useRef } from 'react';
import { ParticipantName } from './participant-name';
import { ParticipantSilhouette } from './participant-silhouette';

export function SelfView({
  participant,
  stream,
  cameraEnabled,
}: {
  participant: ParticipantDto;
  stream: MediaStream | undefined;
  cameraEnabled: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = cameraEnabled && hasLiveVideo(stream);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.srcObject = stream ?? null;
    if (showVideo) {
      void video.play().catch(() => undefined);
    }
  }, [stream, showVideo]);

  return (
    <aside className="absolute bottom-4 right-4 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative aspect-video">
        {showVideo ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <ParticipantSilhouette className="h-12 w-12" />
          </div>
        )}
        <p className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-sm text-foreground">
          <ParticipantName name={participant.displayName} />
        </p>
      </div>
    </aside>
  );
}

function hasLiveVideo(stream: MediaStream | undefined): boolean {
  return Boolean(
    stream
      ?.getVideoTracks()
      .some((track) => track.readyState === 'live' && track.enabled),
  );
}

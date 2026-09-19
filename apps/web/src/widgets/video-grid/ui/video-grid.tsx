import { russianMessages, type ParticipantDto } from '@fedora-meetings/contracts-realtime';
import { cn } from '@fedora-meetings/web-ui';
import { RemoteTile } from '../../../entities/participant/ui/remote-tile';
import { SelfView } from '../../../entities/participant/ui/self-view';
import { markRemoteAudioBlocked } from '../../../features/meeting-session/model/autoplay';

export function VideoGrid({
  self,
  remotes,
  localStream,
  localCameraEnabled,
  remoteStreams,
}: {
  self: ParticipantDto | undefined;
  remotes: ParticipantDto[];
  localStream: MediaStream | undefined;
  localCameraEnabled: boolean;
  remoteStreams: Record<string, MediaStream>;
}) {
  const isAlone = remotes.length === 0;

  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-muted">
      {isAlone ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="max-w-md text-base text-foreground">
            {russianMessages.ALONE_IN_ROOM}
          </p>
          <p className="max-w-lg select-all break-all text-sm text-muted-foreground">
            {window.location.href}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'grid flex-1 gap-3 p-4',
            remotes.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
          )}
        >
          {remotes.map((participant) => (
            <RemoteTile
              key={participant.id}
              participant={participant}
              stream={remoteStreams[participant.id]}
              onAutoplayBlocked={markRemoteAudioBlocked}
            />
          ))}
        </div>
      )}
      {self ? (
        <SelfView
          participant={self}
          stream={localStream}
          cameraEnabled={localCameraEnabled}
        />
      ) : null}
    </section>
  );
}

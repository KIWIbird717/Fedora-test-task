import { russianMessages, type ParticipantDto } from '@fedora-meetings/contracts-realtime';
import { Avatar, AvatarFallback } from '@fedora-meetings/web-ui';
import { ParticipantName } from '../../../entities/participant/ui/participant-name';

export function VideoGrid({
  self,
  remotes,
}: {
  self: ParticipantDto | undefined;
  remotes: ParticipantDto[];
}) {
  const isAlone = remotes.length === 0;

  return (
    <section className="relative flex min-h-screen flex-1 flex-col bg-muted">
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
        <div className="grid flex-1 grid-cols-1 gap-3 p-4 lg:grid-cols-2">
          {remotes.map((participant) => (
            <article
              key={participant.id}
              className="relative min-h-64 overflow-hidden rounded-lg bg-card"
            >
              <PlaceholderTile name={participant.displayName} />
            </article>
          ))}
        </div>
      )}
      {self ? (
        <aside className="absolute bottom-4 right-4 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="relative">
            <PlaceholderTile name={self.displayName} compact />
          </div>
        </aside>
      ) : null}
    </section>
  );
}

function PlaceholderTile({
  name,
  compact = false,
}: {
  name: string;
  compact?: boolean;
}) {
  const initial = name.trim().charAt(0);

  return (
    <div
      className={
        compact
          ? 'relative flex aspect-video items-end p-2'
          : 'relative flex h-full min-h-64 w-full items-end p-3'
      }
    >
      <div className="absolute inset-0 flex items-center justify-center bg-secondary">
        <Avatar className={compact ? 'h-12 w-12' : 'h-16 w-16'}>
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </div>
      <p className="relative rounded bg-background/80 px-2 py-1 text-sm text-foreground">
        <ParticipantName name={name} />
      </p>
    </div>
  );
}

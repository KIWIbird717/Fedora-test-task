import {
  systemJoinedText,
  systemLeftText,
  type SystemEventDto,
} from '@fedora-meetings/contracts-realtime';

export function SystemEvent({ event }: { event: SystemEventDto }) {
  const text =
    event.kind === 'joined'
      ? systemJoinedText(event.displayName)
      : systemLeftText(event.displayName);

  return (
    <p className="text-center text-xs italic text-muted-foreground" role="status">
      {text}
    </p>
  );
}

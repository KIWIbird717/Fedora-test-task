import { russianMessages } from '@fedora-meetings/contracts-realtime';

export function ConnectingIndicator() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-8"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{russianMessages.CONNECTING}</p>
    </div>
  );
}

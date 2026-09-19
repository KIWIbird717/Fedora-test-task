import { cn } from '@fedora-meetings/web-ui';

export function ParticipantSilhouette({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('text-muted-foreground', className)}
    >
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path
        d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"
        fill="currentColor"
      />
    </svg>
  );
}

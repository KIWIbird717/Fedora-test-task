import { ParticipantName } from '../../../entities/participant/ui/participant-name';
import { useMeetingSession } from '../../../features/meeting-session/model/meeting-session.store';

export function ParticipantList() {
  const { participants } = useMeetingSession();

  return (
    <section className="border-b border-border px-4 py-3" aria-label="Участники">
      <h2 className="text-sm font-medium text-foreground">Участники</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="truncate text-sm text-foreground"
          >
            <ParticipantName name={participant.displayName} />
          </li>
        ))}
      </ul>
    </section>
  );
}

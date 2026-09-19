import { render, screen } from '@testing-library/react';
import { systemJoinedText, systemLeftText } from '@fedora-meetings/contracts-realtime';
import { SystemEvent } from './system-event';

describe('SystemEvent', () => {
  it('renders the live join copy', () => {
    render(
      <SystemEvent
        event={{
          kind: 'joined',
          participantId: 'p1',
          displayName: 'Анна',
          occurredAt: '2026-09-19T12:00:00.000Z',
        }}
      />,
    );
    expect(screen.getByText(systemJoinedText('Анна'))).toBeTruthy();
  });

  it('renders the leave copy without connection-lost wording', () => {
    render(
      <SystemEvent
        event={{
          kind: 'left',
          participantId: 'p1',
          displayName: 'Борис',
          occurredAt: '2026-09-19T12:01:00.000Z',
        }}
      />,
    );
    expect(screen.getByText(systemLeftText('Борис'))).toBeTruthy();
    expect(screen.queryByText(/соединение потеряно/i)).toBeNull();
  });
});

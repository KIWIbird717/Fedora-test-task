import { render, screen } from '@testing-library/react';
import { systemJoinedText } from '@fedora-meetings/contracts-realtime';
import {
  appendMeetingSystemEvent,
  applyJoinAck,
  resetMeetingSession,
} from '../../../features/meeting-session/model/meeting-session.store';
import { ChatPanel } from './chat-panel';

describe('ChatPanel', () => {
  beforeEach(() => {
    resetMeetingSession();
    Element.prototype.scrollIntoView = () => undefined;
  });

  it('seeds authored history from join ack and appends live system events', () => {
    applyJoinAck({
      roomId: 'room-1',
      participantId: 'self',
      participants: [
        {
          id: 'self',
          displayName: 'Анна',
          microphoneEnabled: true,
          cameraEnabled: true,
        },
      ],
      messages: [
        {
          id: 'm1',
          authorId: 'self',
          authorName: 'Анна',
          text: 'привет',
          sentAt: '2026-09-19T12:00:00.000Z',
        },
      ],
      iceServers: [],
    });

    const { rerender } = render(<ChatPanel />);
    expect(screen.getByText('привет')).toBeTruthy();
    expect(screen.queryByText(systemJoinedText('Анна'))).toBeNull();

    appendMeetingSystemEvent({
      kind: 'joined',
      participantId: 'other',
      displayName: 'Борис',
      occurredAt: '2026-09-19T12:00:05.000Z',
    });
    rerender(<ChatPanel />);
    expect(screen.getByText('привет')).toBeTruthy();
    expect(screen.getByText(systemJoinedText('Борис'))).toBeTruthy();
  });
});

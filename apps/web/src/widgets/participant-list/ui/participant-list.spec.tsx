import { render, screen } from '@testing-library/react';
import {
  applyJoinAck,
  removeMeetingParticipant,
  resetMeetingSession,
} from '../../../features/meeting-session/model/meeting-session.store';
import { ParticipantList } from './participant-list';

describe('ParticipantList', () => {
  beforeEach(() => {
    resetMeetingSession();
  });

  it('renders the meeting-session roster and stays in sync on leave', () => {
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
        {
          id: 'other',
          displayName: 'Борис',
          microphoneEnabled: true,
          cameraEnabled: true,
        },
      ],
      messages: [],
      iceServers: [],
    });

    const { rerender } = render(<ParticipantList />);
    expect(screen.getByText('Анна')).toBeTruthy();
    expect(screen.getByText('Борис')).toBeTruthy();
    expect(screen.queryByText('self')).toBeNull();

    removeMeetingParticipant('other');
    rerender(<ParticipantList />);
    expect(screen.getByText('Анна')).toBeTruthy();
    expect(screen.queryByText('Борис')).toBeNull();
  });
});

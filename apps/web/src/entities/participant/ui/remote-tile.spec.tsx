import { render, screen } from '@testing-library/react';
import { russianMessages, type ParticipantDto } from '@fedora-meetings/contracts-realtime';
import { RemoteTile } from './remote-tile';

const participant: ParticipantDto = {
  id: 'remote-1',
  displayName: 'Борис',
  microphoneEnabled: true,
  cameraEnabled: true,
};

describe('RemoteTile', () => {
  it('shows silhouette, name and muted mic when camera and mic are denied', () => {
    render(
      <RemoteTile
        participant={{
          ...participant,
          microphoneEnabled: false,
          cameraEnabled: false,
        }}
        stream={undefined}
        peerState="connected"
        onAutoplayBlocked={() => undefined}
      />,
    );

    expect(screen.getByText('Борис')).toBeTruthy();
    expect(screen.getByText('Микрофон выключен')).toBeTruthy();
    expect(screen.queryByText(russianMessages.PEER_MEDIA_FAILED)).toBeNull();
    expect(document.querySelector('svg')).not.toBeNull();
  });

  it('shows a connecting tile without a failed-media message or spinner', () => {
    const { container } = render(
      <RemoteTile
        participant={participant}
        stream={undefined}
        peerState="connecting"
        onAutoplayBlocked={() => undefined}
      />,
    );

    expect(container.querySelector('[data-peer-state="connecting"]')).not.toBeNull();
    expect(screen.getByText('Борис')).toBeTruthy();
    expect(screen.queryByText(russianMessages.PEER_MEDIA_FAILED)).toBeNull();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.querySelector('.animate-spin')).toBeNull();
  });

  it('shows silhouette plus the media-failed copy without hiding the name', () => {
    render(
      <RemoteTile
        participant={participant}
        stream={undefined}
        peerState="failed"
        onAutoplayBlocked={() => undefined}
      />,
    );

    expect(screen.getByText(russianMessages.PEER_MEDIA_FAILED)).toBeTruthy();
    expect(screen.getByText('Борис')).toBeTruthy();
    expect(document.querySelector('svg')).not.toBeNull();
  });
});

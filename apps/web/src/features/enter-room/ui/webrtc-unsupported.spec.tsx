import { render, screen } from '@testing-library/react';
import { russianMessages } from '@fedora-meetings/contracts-realtime';
import { WebrtcUnsupported } from './webrtc-unsupported';

describe('WebrtcUnsupported', () => {
  it('shows the WebRTC unsupported message', () => {
    render(<WebrtcUnsupported />);
    expect(screen.getByText(russianMessages.WEBRTC_UNSUPPORTED)).toBeTruthy();
  });
});

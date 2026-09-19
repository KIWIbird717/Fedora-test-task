import { render, screen } from '@testing-library/react';
import { russianMessages } from '@fedora-meetings/contracts-realtime';
import { MediaPermissionAlert } from './media-permission-alert';

describe('MediaPermissionAlert', () => {
  it('tells the user they stayed in the room with devices off', () => {
    render(<MediaPermissionAlert />);
    expect(
      screen.getByText(russianMessages.MEDIA_PERMISSION_DENIED),
    ).toBeTruthy();
  });
});

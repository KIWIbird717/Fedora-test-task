import { render, screen } from '@testing-library/react';
import { russianMessages } from '@fedora-meetings/contracts-realtime';
import { ServerError } from './server-error';

describe('ServerError', () => {
  it('shows the server unreachable message', () => {
    render(<ServerError />);
    expect(screen.getByText(russianMessages.SERVER_UNREACHABLE)).toBeTruthy();
  });
});

import { render } from '@testing-library/react';
import App from './app';

describe('App', () => {
  it('renders the start screen shell', async () => {
    const { findByText } = render(<App />);
    expect(await findByText('Fedora Meetings')).toBeTruthy();
  });
});


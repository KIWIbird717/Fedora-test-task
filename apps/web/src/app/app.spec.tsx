import { render } from '@testing-library/react';
import { resetColorSchemePreference } from '../features/color-scheme/model/color-scheme.store';
import App from './app';

describe('App', () => {
  afterEach(() => {
    resetColorSchemePreference();
  });

  it('renders the start screen shell', async () => {
    const { findByText } = render(<App />);
    expect(await findByText('Fedora Meetings')).toBeTruthy();
  });
});


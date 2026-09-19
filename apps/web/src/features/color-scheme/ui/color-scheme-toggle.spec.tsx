import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@fedora-meetings/web-ui';
import { resetColorSchemePreference } from '../model/color-scheme.store';
import { ColorSchemeToggle } from './color-scheme-toggle';

function stubMatchMedia(matchesDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? matchesDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe('ColorSchemeToggle', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    resetColorSchemePreference();
  });

  it('cycles the document scheme from the control', () => {
    render(
      <TooltipProvider>
        <ColorSchemeToggle />
      </TooltipProvider>,
    );

    const button = screen.getByRole('button', {
      name: 'Системная тема. Переключить тему',
    });
    fireEvent.click(button);
    expect(
      screen.getByRole('button', { name: 'Светлая тема. Переключить тему' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Светлая тема. Переключить тему' }),
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Тёмная тема. Переключить тему' }),
    ).toBeTruthy();
  });
});

import {
  applyResolvedColorScheme,
  cycleColorSchemePreference,
  getColorSchemeSnapshot,
  resetColorSchemePreference,
  setColorSchemePreference,
} from './color-scheme.store';

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

describe('color-scheme.store', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    resetColorSchemePreference();
  });

  it('follows the system scheme by default', () => {
    stubMatchMedia(true);
    setColorSchemePreference('system');
    expect(getColorSchemeSnapshot()).toEqual({
      preference: 'system',
      resolved: 'dark',
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('lets a manual light preference override a dark system scheme', () => {
    stubMatchMedia(true);
    setColorSchemePreference('light');
    expect(getColorSchemeSnapshot()).toEqual({
      preference: 'light',
      resolved: 'light',
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('cycles system → light → dark → system', () => {
    stubMatchMedia(false);
    resetColorSchemePreference();
    expect(getColorSchemeSnapshot().preference).toBe('system');
    cycleColorSchemePreference();
    expect(getColorSchemeSnapshot().preference).toBe('light');
    cycleColorSchemePreference();
    expect(getColorSchemeSnapshot().preference).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    cycleColorSchemePreference();
    expect(getColorSchemeSnapshot().preference).toBe('system');
  });

  it('applies the resolved class to the document element', () => {
    setColorSchemePreference('dark');
    applyResolvedColorScheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    setColorSchemePreference('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

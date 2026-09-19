import { useSyncExternalStore } from 'react';

export type ColorSchemePreference = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';

export type ColorSchemeSnapshot = {
  preference: ColorSchemePreference;
  resolved: ResolvedColorScheme;
};

const PREFERENCE_CYCLE: readonly ColorSchemePreference[] = [
  'system',
  'light',
  'dark',
];

let preference: ColorSchemePreference = 'system';
let snapshot: ColorSchemeSnapshot = {
  preference: 'system',
  resolved: 'light',
};
const listeners = new Set<() => void>();
let systemMedia: MediaQueryList | undefined;
let onSystemSchemeChange: (() => void) | undefined;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function refreshSnapshot(): ColorSchemeSnapshot {
  const resolved = resolveColorScheme();
  if (snapshot.preference === preference && snapshot.resolved === resolved) {
    return snapshot;
  }
  snapshot = { preference, resolved };
  return snapshot;
}

export function getSystemColorScheme(): ResolvedColorScheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function resolveColorScheme(
  selected: ColorSchemePreference = preference,
): ResolvedColorScheme {
  return selected === 'system' ? getSystemColorScheme() : selected;
}

export function applyResolvedColorScheme(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const resolved = resolveColorScheme();
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}

function unbindSystemPreference(): void {
  if (systemMedia && onSystemSchemeChange) {
    systemMedia.removeEventListener('change', onSystemSchemeChange);
  }
  systemMedia = undefined;
  onSystemSchemeChange = undefined;
}

function bindSystemPreference(): void {
  unbindSystemPreference();
  if (
    preference !== 'system' ||
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return;
  }
  systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
  onSystemSchemeChange = () => {
    applyResolvedColorScheme();
    emit();
  };
  systemMedia.addEventListener('change', onSystemSchemeChange);
}

export function getColorSchemeSnapshot(): ColorSchemeSnapshot {
  return refreshSnapshot();
}

export function subscribeColorScheme(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    bindSystemPreference();
    applyResolvedColorScheme();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      unbindSystemPreference();
    }
  };
}

export function setColorSchemePreference(next: ColorSchemePreference): void {
  preference = next;
  bindSystemPreference();
  applyResolvedColorScheme();
  emit();
}

export function cycleColorSchemePreference(): void {
  const currentIndex = PREFERENCE_CYCLE.indexOf(preference);
  const nextIndex = (currentIndex + 1) % PREFERENCE_CYCLE.length;
  setColorSchemePreference(PREFERENCE_CYCLE[nextIndex]);
}

export function resetColorSchemePreference(): void {
  unbindSystemPreference();
  preference = 'system';
  applyResolvedColorScheme();
  emit();
}

export function useColorScheme(): ColorSchemeSnapshot {
  return useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeSnapshot,
  );
}

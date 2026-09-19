import { useSyncExternalStore } from 'react';
import { truncateDisplayName } from './display-name-rules';

let displayName = '';
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getDisplayNameSnapshot(): string {
  return displayName;
}

export function subscribeDisplayName(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setDisplayName(raw: string): void {
  displayName = truncateDisplayName(raw);
  emit();
}

export function resetDisplayName(): void {
  displayName = '';
  emit();
}

export function useDisplayName(): string {
  return useSyncExternalStore(
    subscribeDisplayName,
    getDisplayNameSnapshot,
    getDisplayNameSnapshot,
  );
}

import { russianMessages } from '@fedora-meetings/contracts-realtime';

export const DISPLAY_NAME_MAX_LENGTH = 30;
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} \-']+$/u;

export type DisplayNameValidation =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function truncateDisplayName(raw: string): string {
  return raw.slice(0, DISPLAY_NAME_MAX_LENGTH);
}

export function validateDisplayName(raw: string): DisplayNameValidation {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: russianMessages.EMPTY_NAME };
  }
  if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
    return { ok: false, message: russianMessages.BAD_NAME_CHARSET };
  }
  return { ok: true, value: trimmed };
}

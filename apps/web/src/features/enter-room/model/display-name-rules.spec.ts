import { russianMessages } from '@fedora-meetings/contracts-realtime';
import {
  DISPLAY_NAME_MAX_LENGTH,
  truncateDisplayName,
  validateDisplayName,
} from './display-name-rules';

describe('validateDisplayName', () => {
  it('rejects empty and whitespace-only names', () => {
    expect(validateDisplayName('')).toEqual({
      ok: false,
      message: russianMessages.EMPTY_NAME,
    });
    expect(validateDisplayName('   ')).toEqual({
      ok: false,
      message: russianMessages.EMPTY_NAME,
    });
  });

  it('rejects characters outside the allowlist', () => {
    expect(validateDisplayName('Alex!')).toEqual({
      ok: false,
      message: russianMessages.BAD_NAME_CHARSET,
    });
    expect(validateDisplayName('<img>')).toEqual({
      ok: false,
      message: russianMessages.BAD_NAME_CHARSET,
    });
  });

  it('accepts letters, digits, spaces, hyphens and apostrophes', () => {
    expect(validateDisplayName("  Алекс O'Neil-2 ")).toEqual({
      ok: true,
      value: "Алекс O'Neil-2",
    });
  });
});

describe('truncateDisplayName', () => {
  it('truncates input to 30 characters', () => {
    const overLength = 'a'.repeat(DISPLAY_NAME_MAX_LENGTH + 5);
    expect(truncateDisplayName(overLength)).toHaveLength(DISPLAY_NAME_MAX_LENGTH);
  });
});

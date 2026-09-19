import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_PATTERN,
} from './constants.js';
import { InvalidDisplayNameError } from './errors.js';

export class DisplayName {
  private constructor(readonly value: string) {}

  static create(raw: string): DisplayName {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new InvalidDisplayNameError('empty');
    }
    if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
      throw new InvalidDisplayNameError('too-long');
    }
    if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
      throw new InvalidDisplayNameError('charset');
    }
    return new DisplayName(trimmed);
  }
}

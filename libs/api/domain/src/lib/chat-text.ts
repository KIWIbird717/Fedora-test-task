import { CHAT_TEXT_MAX_LENGTH } from './constants.js';
import { InvalidChatTextError } from './errors.js';

export class ChatText {
  private constructor(readonly value: string) {}

  static create(raw: string): ChatText {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new InvalidChatTextError('empty');
    }
    if (trimmed.length > CHAT_TEXT_MAX_LENGTH) {
      throw new InvalidChatTextError('too-long');
    }
    return new ChatText(trimmed);
  }
}

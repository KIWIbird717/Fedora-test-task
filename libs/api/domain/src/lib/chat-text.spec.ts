import { ChatText } from './chat-text.js';
import { InvalidChatTextError } from './errors.js';

describe('ChatText', () => {
  it('trims and accepts text up to 1000 characters', () => {
    expect(ChatText.create('  hello  ').value).toBe('hello');
    expect(ChatText.create('x'.repeat(1000)).value).toHaveLength(1000);
  });

  it('rejects empty and whitespace-only text', () => {
    expect(() => ChatText.create('')).toThrow(InvalidChatTextError);
    expect(() => ChatText.create('\n\t ')).toThrow(InvalidChatTextError);
  });

  it('rejects text longer than 1000 characters', () => {
    try {
      ChatText.create('x'.repeat(1001));
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidChatTextError);
      expect((error as InvalidChatTextError).reason).toBe('too-long');
    }
  });
});

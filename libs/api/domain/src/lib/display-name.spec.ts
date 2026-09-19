import { DISPLAY_NAME_MAX_LENGTH } from './constants.js';
import { DisplayName } from './display-name.js';
import { InvalidDisplayNameError } from './errors.js';

describe('DisplayName', () => {
  it('accepts trimmed unicode letters, digits, spaces, hyphens and apostrophes', () => {
    expect(DisplayName.create('  Олег  ').value).toBe('Олег');
    expect(DisplayName.create("Jean-Luc O'Brien").value).toBe("Jean-Luc O'Brien");
    expect(DisplayName.create('User 42').value).toBe('User 42');
  });

  it('rejects empty and whitespace-only values', () => {
    expect(() => DisplayName.create('')).toThrow(InvalidDisplayNameError);
    expect(() => DisplayName.create('   ')).toThrow(InvalidDisplayNameError);
  });

  it('rejects names longer than 30 after trim', () => {
    try {
      DisplayName.create('a'.repeat(DISPLAY_NAME_MAX_LENGTH + 1));
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDisplayNameError);
      expect((error as InvalidDisplayNameError).reason).toBe('too-long');
    }
  });

  it('rejects illegal characters', () => {
    try {
      DisplayName.create('Alex!');
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDisplayNameError);
      expect((error as InvalidDisplayNameError).reason).toBe('charset');
    }
  });
});

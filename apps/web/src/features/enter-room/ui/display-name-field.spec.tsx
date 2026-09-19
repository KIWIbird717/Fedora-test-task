import { fireEvent, render, screen } from '@testing-library/react';
import { russianMessages } from '@fedora-meetings/contracts-realtime';
import { DISPLAY_NAME_MAX_LENGTH } from '../model/display-name-rules';
import { resetDisplayName } from '../model/display-name.store';
import { DisplayNameField } from './display-name-field';

describe('DisplayNameField', () => {
  beforeEach(() => {
    resetDisplayName();
  });

  it('shows an empty-name hint until a value is entered', () => {
    render(<DisplayNameField />);
    expect(screen.getByText(russianMessages.EMPTY_NAME)).toBeTruthy();
  });

  it('truncates input to 30 characters', () => {
    render(<DisplayNameField />);
    fireEvent.change(screen.getByLabelText('Имя'), {
      target: { value: 'b'.repeat(DISPLAY_NAME_MAX_LENGTH + 8) },
    });
    expect(screen.getByLabelText('Имя')).toHaveProperty(
      'value',
      'b'.repeat(DISPLAY_NAME_MAX_LENGTH),
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the charset hint for illegal characters', () => {
    render(<DisplayNameField />);
    fireEvent.change(screen.getByLabelText('Имя'), {
      target: { value: 'Alex@' },
    });
    expect(screen.getByText(russianMessages.BAD_NAME_CHARSET)).toBeTruthy();
  });

  it('accepts a valid name without a hint', () => {
    render(<DisplayNameField />);
    fireEvent.change(screen.getByLabelText('Имя'), {
      target: { value: 'Алекс' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

import { Input } from '@fedora-meetings/web-ui';
import {
  DISPLAY_NAME_MAX_LENGTH,
  validateDisplayName,
} from '../model/display-name-rules';
import { setDisplayName, useDisplayName } from '../model/display-name.store';

const FIELD_ID = 'display-name';
const HINT_ID = 'display-name-hint';

export function DisplayNameField() {
  const value = useDisplayName();
  const validation = validateDisplayName(value);
  const hint = validation.ok ? undefined : validation.message;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={FIELD_ID} className="text-sm font-medium text-foreground">
        Имя
      </label>
      <Input
        id={FIELD_ID}
        name="displayName"
        type="text"
        autoComplete="nickname"
        spellCheck={false}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        value={value}
        aria-invalid={hint ? true : undefined}
        aria-describedby={hint ? HINT_ID : undefined}
        onChange={(event) => setDisplayName(event.target.value)}
      />
      {hint ? (
        <p id={HINT_ID} role="alert" className="text-sm text-destructive">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

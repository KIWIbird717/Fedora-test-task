import { Alert, AlertDescription } from '@fedora-meetings/web-ui';
import { russianMessages } from '@fedora-meetings/contracts-realtime';

export function ServerError() {
  return (
    <Alert variant="destructive">
      <AlertDescription>{russianMessages.SERVER_UNREACHABLE}</AlertDescription>
    </Alert>
  );
}

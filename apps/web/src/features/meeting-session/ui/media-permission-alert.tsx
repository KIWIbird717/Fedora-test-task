import { Alert, AlertDescription } from '@fedora-meetings/web-ui';
import { russianMessages } from '@fedora-meetings/contracts-realtime';

export function MediaPermissionAlert() {
  return (
    <Alert className="pointer-events-auto mx-4 mt-4">
      <AlertDescription>
        {russianMessages.MEDIA_PERMISSION_DENIED}
      </AlertDescription>
    </Alert>
  );
}

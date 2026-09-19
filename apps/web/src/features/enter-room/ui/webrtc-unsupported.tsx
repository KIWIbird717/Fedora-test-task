import { Alert, AlertDescription } from '@fedora-meetings/web-ui';
import { russianMessages } from '@fedora-meetings/contracts-realtime';

export function WebrtcUnsupported() {
  return (
    <Alert variant="destructive">
      <AlertDescription>{russianMessages.WEBRTC_UNSUPPORTED}</AlertDescription>
    </Alert>
  );
}

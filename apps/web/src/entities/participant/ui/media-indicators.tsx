import { MicOff } from '@fedora-meetings/web-ui';

export function MediaIndicators({
  microphoneEnabled,
  cameraEnabled,
}: {
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
}) {
  if (microphoneEnabled) {
    return null;
  }

  return (
    <div
      className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-foreground"
      data-camera-enabled={cameraEnabled ? 'true' : 'false'}
    >
      <MicOff aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">Микрофон выключен</span>
    </div>
  );
}

import {
  Button,
  Mic,
  MicOff,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Video,
  VideoOff,
} from '@fedora-meetings/web-ui';
import type { ReactNode } from 'react';
import { CopyInviteButton } from '../../../features/copy-invite-link/ui/copy-invite-button';
import {
  setCameraEnabled,
  setMicrophoneEnabled,
} from '../../../features/meeting-session/model/toggle-media';
import { useMeetingSession } from '../../../features/meeting-session/model/meeting-session.store';

export function ControlBar() {
  const session = useMeetingSession();
  const mediaReady = session.localStream !== undefined;
  const microphoneEnabled = session.localMicrophoneEnabled;
  const cameraEnabled = session.localCameraEnabled;
  const microphoneLabel = microphoneEnabled
    ? 'Выключить микрофон'
    : 'Включить микрофон';
  const cameraLabel = cameraEnabled ? 'Выключить камеру' : 'Включить камеру';

  return (
    <nav
      aria-label="Управление звонком"
      className="flex items-center justify-center gap-2 border-t border-border bg-card px-4 py-3"
    >
      <ControlIconButton
        label={microphoneLabel}
        disabled={!mediaReady}
        onClick={() => {
          void setMicrophoneEnabled(!microphoneEnabled);
        }}
      >
        {microphoneEnabled ? <Mic /> : <MicOff />}
      </ControlIconButton>
      <ControlIconButton
        label={cameraLabel}
        disabled={!mediaReady}
        onClick={() => {
          void setCameraEnabled(!cameraEnabled);
        }}
      >
        {cameraEnabled ? <Video /> : <VideoOff />}
      </ControlIconButton>
      <CopyInviteButton />
    </nav>
  );
}

function ControlIconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

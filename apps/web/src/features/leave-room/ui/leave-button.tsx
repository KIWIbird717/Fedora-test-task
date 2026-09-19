import {
  Button,
  PhoneOff,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@fedora-meetings/web-ui';
import { useNavigate } from '@tanstack/react-router';
import { leaveRoom } from '../model/leave-room';

const LEAVE_LABEL = 'Выйти из комнаты';

export function LeaveButton() {
  const navigate = useNavigate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label={LEAVE_LABEL}
          onClick={() => {
            void leaveRoom(() => navigate({ to: '/' }));
          }}
        >
          <PhoneOff />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{LEAVE_LABEL}</TooltipContent>
    </Tooltip>
  );
}

import { russianMessages } from '@fedora-meetings/contracts-realtime';
import {
  Button,
  Copy,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@fedora-meetings/web-ui';
import { useEffect, useRef, useState } from 'react';
import { copyInviteLink } from '../model/copy-invite';

const COPY_LABEL = 'Скопировать ссылку';

export function CopyInviteButton() {
  const [copied, setCopied] = useState(false);
  const copiedReset = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (copiedReset.current !== undefined) {
        window.clearTimeout(copiedReset.current);
      }
    };
  }, []);

  async function onCopy(): Promise<void> {
    const ok = await copyInviteLink();
    if (!ok) {
      return;
    }
    setCopied(true);
    if (copiedReset.current !== undefined) {
      window.clearTimeout(copiedReset.current);
    }
    copiedReset.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={COPY_LABEL}
            onClick={() => {
              void onCopy();
            }}
          >
            <Copy />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{COPY_LABEL}</TooltipContent>
      </Tooltip>
      {copied ? (
        <p
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm"
          role="status"
          aria-live="polite"
        >
          {russianMessages.COPY_CONFIRM}
        </p>
      ) : null}
    </div>
  );
}

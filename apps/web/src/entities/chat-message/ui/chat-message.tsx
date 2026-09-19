import type { ChatMessageDto } from '@fedora-meetings/contracts-realtime';
import { formatChatTime } from '../lib/format-time';

export function ChatMessageItem({ message }: { message: ChatMessageDto }) {
  return (
    <article className="flex flex-col gap-1">
      <header className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">
          {message.authorName}
        </span>
        <time
          className="shrink-0 text-xs text-muted-foreground"
          dateTime={message.sentAt}
        >
          {formatChatTime(message.sentAt)}
        </time>
      </header>
      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
        {message.text}
      </p>
    </article>
  );
}

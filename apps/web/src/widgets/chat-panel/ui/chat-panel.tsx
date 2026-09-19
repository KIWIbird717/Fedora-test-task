import { ScrollArea } from '@fedora-meetings/web-ui';
import type {
  ChatMessageDto,
  SystemEventDto,
} from '@fedora-meetings/contracts-realtime';
import { useEffect, useMemo, useRef } from 'react';
import { ChatMessageItem } from '../../../entities/chat-message/ui/chat-message';
import { SystemEvent } from '../../../entities/chat-message/ui/system-event';
import { useMeetingSession } from '../../../features/meeting-session/model/meeting-session.store';
import { ChatComposer } from '../../../features/send-chat/ui/chat-composer';

export function ChatPanel() {
  const { messages, systemEvents } = useMeetingSession();
  const bottomRef = useRef<HTMLDivElement>(null);
  const feed = useMemo(
    () => mergeChatFeed(messages, systemEvents),
    [messages, systemEvents],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [feed]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">Чат</h2>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          {feed.map((item) =>
            item.kind === 'message' ? (
              <ChatMessageItem key={item.key} message={item.message} />
            ) : (
              <SystemEvent key={item.key} event={item.event} />
            ),
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-border p-3">
        <ChatComposer />
      </div>
    </section>
  );
}

type ChatFeedItem =
  | { kind: 'message'; key: string; at: string; message: ChatMessageDto }
  | { kind: 'system'; key: string; at: string; event: SystemEventDto };

function mergeChatFeed(
  messages: ChatMessageDto[],
  systemEvents: SystemEventDto[],
): ChatFeedItem[] {
  const items: ChatFeedItem[] = [
    ...messages.map((message) => ({
      kind: 'message' as const,
      key: message.id,
      at: message.sentAt,
      message,
    })),
    ...systemEvents.map((event) => ({
      kind: 'system' as const,
      key: `system:${event.kind}:${event.participantId}:${event.occurredAt}`,
      at: event.occurredAt,
      event,
    })),
  ];
  items.sort((left, right) => {
    const byTime = left.at.localeCompare(right.at);
    if (byTime !== 0) {
      return byTime;
    }
    if (left.kind === right.kind) {
      return 0;
    }
    return left.kind === 'system' ? -1 : 1;
  });
  return items;
}

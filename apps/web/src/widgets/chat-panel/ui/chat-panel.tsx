import { ScrollArea } from '@fedora-meetings/web-ui';
import { useEffect, useRef } from 'react';
import { ChatMessageItem } from '../../../entities/chat-message/ui/chat-message';
import { useMeetingSession } from '../../../features/meeting-session/model/meeting-session.store';
import { ChatComposer } from '../../../features/send-chat/ui/chat-composer';

export function ChatPanel() {
  const { messages } = useMeetingSession();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <aside className="hidden h-screen w-80 shrink-0 flex-col border-l border-border bg-card lg:flex">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">Чат</h2>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-border p-3">
        <ChatComposer />
      </div>
    </aside>
  );
}

import { Button, Textarea } from '@fedora-meetings/web-ui';
import { type FormEvent, type KeyboardEvent, useState } from 'react';
import {
  CHAT_TEXT_MAX_LENGTH,
  isBlankChatText,
  sendChat,
} from '../model/send-chat';

export function ChatComposer() {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const canSend = !isBlankChatText(text) && !sending;

  async function submit(): Promise<void> {
    if (!canSend) {
      return;
    }
    setSending(true);
    setError(undefined);
    try {
      const result = await sendChat(text);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setText('');
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={onSubmit}>
      <Textarea
        aria-label="Сообщение"
        value={text}
        maxLength={CHAT_TEXT_MAX_LENGTH}
        onChange={(event) => {
          setText(event.target.value);
          if (error) {
            setError(undefined);
          }
        }}
        onKeyDown={onKeyDown}
        placeholder="Написать сообщение"
        rows={3}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={!canSend}>
        Отправить
      </Button>
    </form>
  );
}

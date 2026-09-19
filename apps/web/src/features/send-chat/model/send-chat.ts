import {
  russianMessages,
  type ChatMessageDto,
} from '@fedora-meetings/contracts-realtime';
import type { RoomClient } from '@fedora-meetings/web-realtime';
import { getActiveRoomClient } from '../../meeting-session/model/active-room-client';
import { appendMeetingMessage } from '../../meeting-session/model/meeting-session.store';

export const CHAT_TEXT_MAX_LENGTH = 1000;

export type SendChatResult =
  | { ok: true }
  | { ok: false; message: string };

export function isBlankChatText(raw: string): boolean {
  return raw.trim().length === 0;
}

export function bindChatMessages(client: RoomClient): () => void {
  return client.onChatMessage((message: ChatMessageDto) => {
    appendMeetingMessage(message);
  });
}

export async function sendChat(raw: string): Promise<SendChatResult> {
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: true };
  }
  if (text.length > CHAT_TEXT_MAX_LENGTH) {
    return { ok: false, message: russianMessages.CHAT_TOO_LONG };
  }

  const client = getActiveRoomClient();
  if (!client) {
    return { ok: false, message: russianMessages.SERVER_UNREACHABLE };
  }

  const ack = await client.sendChat({ text });
  if (!ack.ok) {
    return { ok: false, message: ack.error.message };
  }
  return { ok: true };
}

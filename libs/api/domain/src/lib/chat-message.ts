import type { ChatText } from './chat-text.js';
import type { ParticipantId } from './participant-id.js';

export type ChatMessageId = string & { readonly __brand: 'ChatMessageId' };

export function createChatMessageId(): ChatMessageId {
  return crypto.randomUUID() as ChatMessageId;
}

export class ChatMessage {
  readonly id: ChatMessageId;
  readonly authorId: ParticipantId;
  readonly authorName: string;
  readonly text: ChatText;
  readonly sentAt: Date;

  private constructor(input: {
    id: ChatMessageId;
    authorId: ParticipantId;
    authorName: string;
    text: ChatText;
    sentAt: Date;
  }) {
    this.id = input.id;
    this.authorId = input.authorId;
    this.authorName = input.authorName;
    this.text = input.text;
    this.sentAt = input.sentAt;
  }

  static create(input: {
    authorId: ParticipantId;
    authorName: string;
    text: ChatText;
    sentAt: Date;
    id?: ChatMessageId;
  }): ChatMessage {
    return new ChatMessage({
      id: input.id ?? createChatMessageId(),
      authorId: input.authorId,
      authorName: input.authorName,
      text: input.text,
      sentAt: input.sentAt,
    });
  }
}

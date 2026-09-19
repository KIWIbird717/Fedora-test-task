import {
  CHAT_RATE_MAX_MESSAGES,
  CHAT_RATE_WINDOW_MS,
} from './constants.js';
import { createParticipantId, type ParticipantId } from './participant-id.js';
import type { DisplayName } from './display-name.js';
import type { MediaState } from './media-state.js';

export class Participant {
  readonly id: ParticipantId;
  readonly displayName: DisplayName;
  readonly joinedAt: Date;
  private currentMedia: MediaState;
  private readonly chatSentAt: Date[] = [];

  private constructor(input: {
    id: ParticipantId;
    displayName: DisplayName;
    media: MediaState;
    joinedAt: Date;
  }) {
    this.id = input.id;
    this.displayName = input.displayName;
    this.currentMedia = input.media;
    this.joinedAt = input.joinedAt;
  }

  static create(input: {
    displayName: DisplayName;
    media: MediaState;
    joinedAt: Date;
    id?: ParticipantId;
  }): Participant {
    return new Participant({
      id: input.id ?? createParticipantId(),
      displayName: input.displayName,
      media: input.media,
      joinedAt: input.joinedAt,
    });
  }

  get media(): MediaState {
    return this.currentMedia;
  }

  get recentChatSentAt(): readonly Date[] {
    return this.chatSentAt;
  }

  setMedia(media: MediaState): void {
    this.currentMedia = media;
  }

  canSendChatAt(now: Date): boolean {
    const windowStart = now.getTime() - CHAT_RATE_WINDOW_MS;
    const sentInWindow = this.chatSentAt.filter(
      (sentAt) => sentAt.getTime() > windowStart,
    ).length;
    return sentInWindow < CHAT_RATE_MAX_MESSAGES;
  }

  recordChatSentAt(sentAt: Date): void {
    this.chatSentAt.push(sentAt);
    if (this.chatSentAt.length > CHAT_RATE_MAX_MESSAGES) {
      this.chatSentAt.splice(0, this.chatSentAt.length - CHAT_RATE_MAX_MESSAGES);
    }
  }
}

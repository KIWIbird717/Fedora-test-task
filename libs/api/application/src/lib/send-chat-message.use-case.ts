import {
  ChatMessage,
  ChatText,
  parseParticipantId,
  parseRoomId,
} from '@fedora-meetings/api-domain';
import { NotInRoomError, RateLimitedError } from './errors.js';
import type { RoomEventPublisher } from './ports/room-event-publisher.port.js';
import type { RoomRegistry } from './ports/room-registry.port.js';

export type SendChatMessageInput = {
  roomId: string;
  participantId: string;
  text: string;
};

export class SendChatMessage {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly roomEventPublisher: RoomEventPublisher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(input: SendChatMessageInput): ChatMessage {
    const roomId = parseRoomId(input.roomId);
    const participantId = parseParticipantId(input.participantId);
    const room = this.roomRegistry.get(roomId);
    const participant = room?.getParticipant(participantId);
    if (!room || !participant) {
      throw new NotInRoomError();
    }

    const sentAt = this.now();
    if (!participant.canSendChatAt(sentAt)) {
      throw new RateLimitedError();
    }

    const message = ChatMessage.create({
      authorId: participant.id,
      authorName: participant.displayName.value,
      text: ChatText.create(input.text),
      sentAt,
    });
    room.appendMessage(message);
    participant.recordChatSentAt(sentAt);
    this.roomEventPublisher.chatMessage({ roomId, message });
    return message;
  }
}

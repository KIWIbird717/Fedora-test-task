import { ROOM_MAX_PARTICIPANTS } from './constants.js';
import { RoomFullError } from './errors.js';
import type { ChatMessage } from './chat-message.js';
import type { MediaState } from './media-state.js';
import type { Participant } from './participant.js';
import type { ParticipantId } from './participant-id.js';
import type { RoomId } from './room-id.js';

export class Room {
  readonly id: RoomId;
  readonly createdAt: Date;
  private readonly participantList: Participant[] = [];
  private readonly messageList: ChatMessage[] = [];

  private constructor(id: RoomId, createdAt: Date, firstParticipant: Participant) {
    this.id = id;
    this.createdAt = createdAt;
    this.participantList.push(firstParticipant);
  }

  static create(input: {
    id: RoomId;
    createdAt: Date;
    firstParticipant: Participant;
  }): Room {
    return new Room(input.id, input.createdAt, input.firstParticipant);
  }

  get participants(): readonly Participant[] {
    return [...this.participantList];
  }

  get messages(): readonly ChatMessage[] {
    return [...this.messageList];
  }

  get participantCount(): number {
    return this.participantList.length;
  }

  getParticipant(participantId: ParticipantId): Participant | undefined {
    return this.participantList.find(
      (participant) => participant.id === participantId,
    );
  }

  hasParticipant(participantId: ParticipantId): boolean {
    return this.getParticipant(participantId) !== undefined;
  }

  addParticipant(participant: Participant): void {
    if (this.hasParticipant(participant.id)) {
      return;
    }
    if (this.participantList.length >= ROOM_MAX_PARTICIPANTS) {
      throw new RoomFullError();
    }
    this.participantList.push(participant);
  }

  removeParticipant(participantId: ParticipantId): Participant | undefined {
    const index = this.participantList.findIndex(
      (participant) => participant.id === participantId,
    );
    if (index === -1) {
      return undefined;
    }
    const [removed] = this.participantList.splice(index, 1);
    return removed;
  }

  appendMessage(message: ChatMessage): void {
    if (!this.hasParticipant(message.authorId)) {
      return;
    }
    this.messageList.push(message);
  }

  updateMedia(participantId: ParticipantId, media: MediaState): boolean {
    const participant = this.getParticipant(participantId);
    if (!participant) {
      return false;
    }
    participant.setMedia(media);
    return true;
  }
}

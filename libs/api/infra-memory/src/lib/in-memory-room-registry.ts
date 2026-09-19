import { nanoid } from 'nanoid';
import {
  MINTED_ROOM_ID_LENGTH,
  parseRoomId,
  Participant,
  Room,
  ServiceAtCapacityError,
  type ParticipantId,
  type RoomId,
} from '@fedora-meetings/api-domain';
import type {
  LeaveResult,
  RoomRegistry,
  TryJoinInput,
  TryJoinResult,
} from '@fedora-meetings/api-application';

export class InMemoryRoomRegistry implements RoomRegistry {
  private readonly rooms = new Map<string, Room>();

  constructor(
    private readonly roomCeiling: number,
    private readonly createRoomId: () => string = () =>
      nanoid(MINTED_ROOM_ID_LENGTH),
  ) {}

  mintRoomId(): RoomId {
    for (;;) {
      const roomId = parseRoomId(this.createRoomId());
      if (!this.rooms.has(roomId)) {
        return roomId;
      }
    }
  }

  tryJoin(input: TryJoinInput): TryJoinResult {
    const existing = this.rooms.get(input.roomId);
    if (existing) {
      const participant = Participant.create({
        displayName: input.displayName,
        media: input.media,
        joinedAt: input.joinedAt,
      });
      existing.addParticipant(participant);
      return { room: existing, participant, created: false };
    }

    if (this.rooms.size >= this.roomCeiling) {
      throw new ServiceAtCapacityError();
    }

    const participant = Participant.create({
      displayName: input.displayName,
      media: input.media,
      joinedAt: input.joinedAt,
    });
    const room = Room.create({
      id: input.roomId,
      createdAt: input.joinedAt,
      firstParticipant: participant,
    });
    this.rooms.set(input.roomId, room);
    return { room, participant, created: true };
  }

  leave(roomId: RoomId, participantId: ParticipantId): LeaveResult {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { kind: 'already-gone' };
    }
    const removed = room.removeParticipant(participantId);
    if (!removed) {
      return { kind: 'already-gone' };
    }
    if (room.participantCount === 0) {
      this.rooms.delete(roomId);
      return {
        kind: 'left',
        displayName: removed.displayName.value,
        roomDeleted: true,
      };
    }
    return {
      kind: 'left',
      displayName: removed.displayName.value,
      roomDeleted: false,
      room,
    };
  }

  get(roomId: RoomId): Room | undefined {
    return this.rooms.get(roomId);
  }

  activeRoomCount(): number {
    return this.rooms.size;
  }
}

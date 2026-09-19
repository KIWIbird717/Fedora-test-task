import {
  parseParticipantId,
  parseRoomId,
  type RoomId,
} from '@fedora-meetings/api-domain';
import type { RoomEventPublisher } from './ports/room-event-publisher.port.js';
import type { RoomRegistry } from './ports/room-registry.port.js';

export type LeaveRoomInput = {
  roomId: string;
  participantId: string;
};

export type LeaveRoomResult = {
  roomId: RoomId;
  left: boolean;
};

export class LeaveRoom {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly roomEventPublisher: RoomEventPublisher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(input: LeaveRoomInput): LeaveRoomResult {
    const roomId = parseRoomId(input.roomId);
    const participantId = parseParticipantId(input.participantId);
    const result = this.roomRegistry.leave(roomId, participantId);
    if (result.kind === 'already-gone') {
      return { roomId, left: false };
    }

    const occurredAt = this.now();
    this.roomEventPublisher.participantLeft({ roomId, participantId });
    this.roomEventPublisher.systemEvent({
      roomId,
      kind: 'left',
      participantId,
      displayName: result.displayName,
      occurredAt,
    });

    return { roomId, left: true };
  }
}

import {
  parseParticipantId,
  parseRoomId,
} from '@fedora-meetings/api-domain';
import { NotInRoomError } from './errors.js';
import type {
  RoomEventPublisher,
  SignalKind,
} from './ports/room-event-publisher.port.js';
import type { RoomRegistry } from './ports/room-registry.port.js';

export type RelaySignalInput = {
  roomId: string;
  fromParticipantId: string;
  toParticipantId: string;
  kind: SignalKind;
  payload: string;
};

export class RelaySignal {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly roomEventPublisher: RoomEventPublisher,
  ) {}

  execute(input: RelaySignalInput): { toParticipantId: string } {
    const roomId = parseRoomId(input.roomId);
    const fromParticipantId = parseParticipantId(input.fromParticipantId);
    const toParticipantId = parseParticipantId(input.toParticipantId);
    if (fromParticipantId === toParticipantId) {
      return { toParticipantId };
    }

    const room = this.roomRegistry.get(roomId);
    if (
      !room?.hasParticipant(fromParticipantId) ||
      !room.hasParticipant(toParticipantId)
    ) {
      throw new NotInRoomError();
    }

    this.roomEventPublisher.relaySignal({
      kind: input.kind,
      toParticipantId,
      fromParticipantId,
      payload: input.payload,
    });
    return { toParticipantId };
  }
}

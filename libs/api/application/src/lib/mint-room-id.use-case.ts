import {
  ServiceAtCapacityError,
  type RoomId,
} from '@fedora-meetings/api-domain';
import type { RoomRegistry } from './ports/room-registry.port.js';

export class MintRoomId {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly roomCeiling: number,
  ) {}

  execute(): RoomId {
    if (this.roomRegistry.activeRoomCount() >= this.roomCeiling) {
      throw new ServiceAtCapacityError();
    }
    return this.roomRegistry.mintRoomId();
  }
}

import {
  MediaState,
  parseParticipantId,
  parseRoomId,
} from '@fedora-meetings/api-domain';
import { NotInRoomError } from './errors.js';
import type { RoomEventPublisher } from './ports/room-event-publisher.port.js';
import type { RoomRegistry } from './ports/room-registry.port.js';

export type UpdateMediaStateInput = {
  roomId: string;
  participantId: string;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};

export class UpdateMediaState {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly roomEventPublisher: RoomEventPublisher,
  ) {}

  execute(input: UpdateMediaStateInput): MediaState {
    const roomId = parseRoomId(input.roomId);
    const participantId = parseParticipantId(input.participantId);
    const room = this.roomRegistry.get(roomId);
    if (!room?.hasParticipant(participantId)) {
      throw new NotInRoomError();
    }

    const media = new MediaState(
      input.microphoneEnabled,
      input.cameraEnabled,
    );
    room.updateMedia(participantId, media);
    this.roomEventPublisher.mediaStateChanged({
      roomId,
      participantId,
      media,
    });
    return media;
  }
}

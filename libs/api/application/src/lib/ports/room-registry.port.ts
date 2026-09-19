import type { DisplayName } from '@fedora-meetings/api-domain';
import type { MediaState } from '@fedora-meetings/api-domain';
import type { Participant } from '@fedora-meetings/api-domain';
import type { ParticipantId } from '@fedora-meetings/api-domain';
import type { Room } from '@fedora-meetings/api-domain';
import type { RoomId } from '@fedora-meetings/api-domain';

export type TryJoinInput = {
  roomId: RoomId;
  displayName: DisplayName;
  media: MediaState;
  joinedAt: Date;
};

export type TryJoinResult = {
  room: Room;
  participant: Participant;
  created: boolean;
};

export type LeaveResult =
  | { kind: 'already-gone' }
  | {
      kind: 'left';
      displayName: string;
      roomDeleted: boolean;
      room?: Room;
    };

export interface RoomRegistry {
  mintRoomId(): RoomId;
  tryJoin(input: TryJoinInput): TryJoinResult;
  leave(roomId: RoomId, participantId: ParticipantId): LeaveResult;
  get(roomId: RoomId): Room | undefined;
  activeRoomCount(): number;
}

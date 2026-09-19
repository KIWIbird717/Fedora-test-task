import {
  DisplayName,
  MediaState,
  parseRoomId,
  type ChatMessage,
  type Participant,
  type RoomId,
} from '@fedora-meetings/api-domain';
import type { RoomEventPublisher } from './ports/room-event-publisher.port.js';
import type { RoomRegistry } from './ports/room-registry.port.js';

export type IceServerConfig = {
  urls: string;
};

export type JoinRoomInput = {
  roomId: string;
  displayName: string;
};

export type JoinRoomResult = {
  roomId: RoomId;
  participant: Participant;
  participants: readonly Participant[];
  messages: readonly ChatMessage[];
  iceServers: IceServerConfig[];
  created: boolean;
};

export class JoinRoom {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly roomEventPublisher: RoomEventPublisher,
    private readonly iceServers: readonly IceServerConfig[],
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(input: JoinRoomInput): JoinRoomResult {
    const roomId = parseRoomId(input.roomId);
    const displayName = DisplayName.create(input.displayName);
    const joinedAt = this.now();
    const { room, participant, created } = this.roomRegistry.tryJoin({
      roomId,
      displayName,
      media: new MediaState(true, true),
      joinedAt,
    });

    this.roomEventPublisher.participantJoined({
      roomId: room.id,
      participant,
    });
    this.roomEventPublisher.systemEvent({
      roomId: room.id,
      kind: 'joined',
      participantId: participant.id,
      displayName: participant.displayName.value,
      occurredAt: joinedAt,
    });

    return {
      roomId: room.id,
      participant,
      participants: room.participants,
      messages: room.messages,
      iceServers: [...this.iceServers],
      created,
    };
  }
}

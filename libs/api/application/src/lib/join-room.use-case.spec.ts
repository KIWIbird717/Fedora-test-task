import {
  DisplayName,
  MediaState,
  parseRoomId,
  Participant,
  Room,
  RoomFullError,
  ServiceAtCapacityError,
  type ParticipantId,
  type RoomId,
} from '@fedora-meetings/api-domain';
import { JoinRoom } from './join-room.use-case.js';
import type { RoomEventPublisher } from './ports/room-event-publisher.port.js';
import type {
  LeaveResult,
  RoomRegistry,
  TryJoinInput,
  TryJoinResult,
} from './ports/room-registry.port.js';

class FakeRoomRegistry implements RoomRegistry {
  readonly calls: string[] = [];
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly roomCeiling: number) {}

  seed(room: Room): void {
    this.rooms.set(room.id, room);
  }

  mintRoomId(): RoomId {
    this.calls.push('mintRoomId');
    return parseRoomId('mintedroomid1');
  }

  tryJoin(input: TryJoinInput): TryJoinResult {
    this.calls.push('tryJoin');
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
    this.calls.push('leave');
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
    this.calls.push('get');
    return this.rooms.get(roomId);
  }

  activeRoomCount(): number {
    return this.rooms.size;
  }
}

function createPublisher(): RoomEventPublisher {
  return {
    participantJoined: () => undefined,
    participantLeft: () => undefined,
    chatMessage: () => undefined,
    systemEvent: () => undefined,
    mediaStateChanged: () => undefined,
    relaySignal: () => undefined,
  };
}

function fillRoom(count: number): Room {
  const room = Room.create({
    id: parseRoomId('occupied01'),
    createdAt: new Date('2026-09-19T00:00:00.000Z'),
    firstParticipant: Participant.create({
      displayName: DisplayName.create('One'),
      media: new MediaState(true, true),
      joinedAt: new Date('2026-09-19T00:00:00.000Z'),
    }),
  });
  for (let index = 1; index < count; index += 1) {
    room.addParticipant(
      Participant.create({
        displayName: DisplayName.create('Peer'),
        media: new MediaState(true, true),
        joinedAt: new Date('2026-09-19T00:00:00.000Z'),
      }),
    );
  }
  return room;
}

describe('JoinRoom', () => {
  it('admits exactly one of two last-slot joins', () => {
    const registry = new FakeRoomRegistry(50);
    registry.seed(fillRoom(3));
    const useCase = new JoinRoom(registry, createPublisher(), []);

    const first = useCase.execute({ roomId: 'occupied01', displayName: 'Alex' });
    expect(first.participants).toHaveLength(4);
    expect(registry.calls.filter((call) => call === 'tryJoin')).toHaveLength(1);
    expect(registry.calls.includes('get')).toBe(false);

    expect(() =>
      useCase.execute({ roomId: 'occupied01', displayName: 'Sam' }),
    ).toThrow(RoomFullError);
  });

  it('rejects creating a room when the ceiling is already reached', () => {
    const registry = new FakeRoomRegistry(1);
    registry.seed(fillRoom(1));
    const useCase = new JoinRoom(registry, createPublisher(), [
      { urls: 'stun:stun.l.google.com:19302' },
    ]);

    expect(() =>
      useCase.execute({ roomId: 'brandnew01', displayName: 'Alex' }),
    ).toThrow(ServiceAtCapacityError);
  });
});

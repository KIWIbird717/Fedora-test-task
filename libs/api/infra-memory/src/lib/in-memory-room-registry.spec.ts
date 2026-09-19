import {
  ChatMessage,
  ChatText,
  DisplayName,
  MediaState,
  parseRoomId,
  RoomFullError,
} from '@fedora-meetings/api-domain';
import { InMemoryRoomRegistry } from './in-memory-room-registry.js';

function joinAs(registry: InMemoryRoomRegistry, roomId: ReturnType<typeof parseRoomId>, name: string) {
  return registry.tryJoin({
    roomId,
    displayName: DisplayName.create(name),
    media: new MediaState(true, true),
    joinedAt: new Date('2026-09-19T00:00:00.000Z'),
  });
}

describe('InMemoryRoomRegistry', () => {
  it('mints an id without inserting an empty room', () => {
    const registry = new InMemoryRoomRegistry(50);
    const roomId = registry.mintRoomId();
    expect(roomId).toMatch(/^[A-Za-z0-9_-]{8,32}$/);
    expect(registry.activeRoomCount()).toBe(0);
    expect(registry.get(roomId)).toBeUndefined();
  });

  it('creates the aggregate only on the first successful join', () => {
    const registry = new InMemoryRoomRegistry(50);
    const roomId = parseRoomId('roomid12ab');
    const result = joinAs(registry, roomId, 'Alex');
    expect(result.created).toBe(true);
    expect(registry.activeRoomCount()).toBe(1);
    expect(result.room.participants).toHaveLength(1);
  });

  it('rejects a fifth join with ROOM_FULL after four participants', () => {
    const registry = new InMemoryRoomRegistry(50);
    const roomId = parseRoomId('roomid12ab');
    joinAs(registry, roomId, 'One');
    joinAs(registry, roomId, 'Two');
    joinAs(registry, roomId, 'Three');
    joinAs(registry, roomId, 'Four');

    expect(() => joinAs(registry, roomId, 'Five')).toThrow(RoomFullError);
    expect(registry.get(roomId)?.participantCount).toBe(4);
  });

  it('admits exactly one of two overlapping tryJoin calls on a 3-occupied room', () => {
    const registry = new InMemoryRoomRegistry(50);
    const roomId = parseRoomId('roomid12ab');
    joinAs(registry, roomId, 'One');
    joinAs(registry, roomId, 'Two');
    joinAs(registry, roomId, 'Three');

    const admitted: string[] = [];
    const rejected: unknown[] = [];
    for (const name of ['Four', 'Five'] as const) {
      try {
        admitted.push(joinAs(registry, roomId, name).participant.displayName.value);
      } catch (error) {
        rejected.push(error);
      }
    }

    expect(admitted).toEqual(['Four']);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toBeInstanceOf(RoomFullError);
    expect(registry.get(roomId)?.participantCount).toBe(4);
  });

  it('deletes the registry entry and chat on last leave; same id join is empty', () => {
    const registry = new InMemoryRoomRegistry(50);
    const roomId = parseRoomId('roomid12ab');
    const first = joinAs(registry, roomId, 'Alex');
    const second = joinAs(registry, roomId, 'Sam');
    first.room.appendMessage(
      ChatMessage.create({
        authorId: first.participant.id,
        authorName: 'Alex',
        text: ChatText.create('previous chat'),
        sentAt: new Date('2026-09-19T00:00:01.000Z'),
      }),
    );

    const afterFirstLeave = registry.leave(roomId, first.participant.id);
    expect(afterFirstLeave.kind).toBe('left');
    if (afterFirstLeave.kind === 'left') {
      expect(afterFirstLeave.roomDeleted).toBe(false);
    }
    expect(registry.get(roomId)?.messages).toHaveLength(1);

    const lastLeave = registry.leave(roomId, second.participant.id);
    expect(lastLeave).toEqual({
      kind: 'left',
      displayName: 'Sam',
      roomDeleted: true,
    });
    expect(registry.get(roomId)).toBeUndefined();
    expect(registry.activeRoomCount()).toBe(0);

    const rejoined = joinAs(registry, roomId, 'Alex');
    expect(rejoined.created).toBe(true);
    expect(rejoined.room.messages).toEqual([]);
    expect(rejoined.room.participants).toHaveLength(1);
  });
});

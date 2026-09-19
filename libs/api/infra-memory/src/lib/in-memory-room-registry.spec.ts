import { DisplayName, MediaState, parseRoomId } from '@fedora-meetings/api-domain';
import { InMemoryRoomRegistry } from './in-memory-room-registry.js';

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
    const result = registry.tryJoin({
      roomId,
      displayName: DisplayName.create('Alex'),
      media: new MediaState(true, true),
      joinedAt: new Date('2026-09-19T00:00:00.000Z'),
    });
    expect(result.created).toBe(true);
    expect(registry.activeRoomCount()).toBe(1);
    expect(result.room.participants).toHaveLength(1);
  });
});

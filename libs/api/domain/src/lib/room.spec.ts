import { DisplayName } from './display-name.js';
import { RoomFullError } from './errors.js';
import { MediaState } from './media-state.js';
import { Participant } from './participant.js';
import { parseRoomId } from './room-id.js';
import { Room } from './room.js';

function createParticipant(name: string): Participant {
  return Participant.create({
    displayName: DisplayName.create(name),
    media: new MediaState(true, true),
    joinedAt: new Date('2026-09-19T00:00:00.000Z'),
  });
}

function createRoomWithParticipants(count: number): Room {
  const room = Room.create({
    id: parseRoomId('roomid12ab'),
    createdAt: new Date('2026-09-19T00:00:00.000Z'),
    firstParticipant: createParticipant('First'),
  });
  for (let index = 1; index < count; index += 1) {
    room.addParticipant(createParticipant('First'));
  }
  return room;
}

describe('Room aggregate', () => {
  it('allows duplicate display names with distinct participant ids', () => {
    const room = createRoomWithParticipants(2);
    const names = room.participants.map(
      (participant) => participant.displayName.value,
    );
    const ids = new Set(room.participants.map((participant) => participant.id));
    expect(names).toEqual(['First', 'First']);
    expect(ids.size).toBe(2);
  });

  it('rejects a fifth participant', () => {
    const room = createRoomWithParticipants(4);
    expect(() => room.addParticipant(createParticipant('Fifth'))).toThrow(
      RoomFullError,
    );
    expect(room.participantCount).toBe(4);
  });

  it('removes the last participant and does not persist system events', () => {
    const room = createRoomWithParticipants(1);
    const only = room.participants[0];
    expect(only).toBeDefined();
    if (!only) {
      return;
    }
    const removed = room.removeParticipant(only.id);
    expect(removed?.id).toBe(only.id);
    expect(room.participantCount).toBe(0);
    expect(room.messages).toEqual([]);
  });
});

import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { parseRoomId } from '@fedora-meetings/api-domain';
import {
  realtimeEvents,
  systemJoinedText,
  systemLeftText,
  type Ack,
  type RoomJoinPayload,
  type RoomJoinResult,
  type RoomLeaveResult,
  type SystemEventDto,
} from '@fedora-meetings/contracts-realtime';
import { createTestApi, type TestApi } from '../testing/create-test-app';

describe('RoomsGateway', () => {
  let api: TestApi;
  const sockets: Socket[] = [];

  beforeEach(async () => {
    api = await createTestApi();
  });

  afterEach(async () => {
    for (const socket of sockets) {
      socket.disconnect();
    }
    sockets.length = 0;
    await api.app.close();
  });

  it('mints an id then first join creates exactly one in-memory room', async () => {
    const mint = await request(api.app.getHttpServer()).post('/api/rooms').expect(201);
    const roomId = (mint.body as { roomId: string }).roomId;
    expect(api.registry.activeRoomCount()).toBe(0);

    const socket = await openSocket();
    const ack = await joinRoom(socket, { roomId, displayName: 'Анна' });

    expect(ack.ok).toBe(true);
    if (ack.ok) {
      expect(ack.data.participants).toHaveLength(1);
    }
    expect(api.registry.activeRoomCount()).toBe(1);
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(1);
  });

  it('creates a room when joining a missing id', async () => {
    const roomId = 'unused-room-1';
    const socket = await openSocket();
    const ack = await joinRoom(socket, { roomId, displayName: 'Борис' });

    expect(ack.ok).toBe(true);
    if (ack.ok) {
      expect(ack.data.roomId).toBe(roomId);
      expect(ack.data.participants).toHaveLength(1);
    }
    expect(api.registry.activeRoomCount()).toBe(1);
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(1);
  });

  it('joins an existing room by id', async () => {
    const roomId = 'shared-room-1';
    const first = await openSocket();
    const firstAck = await joinRoom(first, { roomId, displayName: 'Анна' });
    expect(firstAck.ok).toBe(true);

    const second = await openSocket();
    const secondAck = await joinRoom(second, { roomId, displayName: 'Борис' });

    expect(secondAck.ok).toBe(true);
    if (secondAck.ok) {
      expect(secondAck.data.participants).toHaveLength(2);
    }
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(2);
  });

  it('admits two participants named Алекс and distinguishes them by hidden ids', async () => {
    const roomId = 'alex-room-01';
    const first = await openSocket();
    const firstAck = await joinRoom(first, { roomId, displayName: 'Алекс' });
    const second = await openSocket();
    const secondAck = await joinRoom(second, { roomId, displayName: 'Алекс' });

    expect(firstAck.ok).toBe(true);
    expect(secondAck.ok).toBe(true);
    if (!firstAck.ok || !secondAck.ok) {
      return;
    }

    expect(firstAck.data.participantId).not.toBe(secondAck.data.participantId);
    expect(secondAck.data.participants.map((participant) => participant.displayName)).toEqual([
      'Алекс',
      'Алекс',
    ]);
    expect(secondAck.data.participants.map((participant) => participant.id)).toEqual(
      expect.arrayContaining([
        firstAck.data.participantId,
        secondAck.data.participantId,
      ]),
    );
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(2);
  });

  it('emits live join/leave system events without storing them on the room', async () => {
    const roomId = 'sys-events1';
    const first = await openSocket();
    await joinRoom(first, { roomId, displayName: 'Анна' });

    const joinedEvent = waitForSystem(first);
    const second = await openSocket();
    const secondAck = await joinRoom(second, { roomId, displayName: 'Борис' });
    expect(secondAck.ok).toBe(true);
    if (secondAck.ok) {
      expect(secondAck.data.messages).toEqual([]);
    }

    const joined = await joinedEvent;
    expect(joined).toMatchObject({
      kind: 'joined',
      displayName: 'Борис',
    });
    expect(systemJoinedText(joined.displayName)).toBe(
      'Борис присоединился к комнате',
    );
    expect(api.registry.get(parseRoomId(roomId))?.messages).toEqual([]);

    const leftEvent = waitForSystem(first);
    const leaveAck = await leaveRoom(second);
    expect(leaveAck.ok).toBe(true);

    const left = await leftEvent;
    expect(left).toMatchObject({
      kind: 'left',
      displayName: 'Борис',
    });
    expect(systemLeftText(left.displayName)).toBe('Борис вышел из комнаты');
    expect(left.displayName).not.toContain('соединение потеряно');
    expect(api.registry.get(parseRoomId(roomId))?.messages).toEqual([]);
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(1);

    const lastLeave = await leaveRoom(first);
    expect(lastLeave.ok).toBe(true);
    expect(api.registry.get(parseRoomId(roomId))).toBeUndefined();

    const again = await openSocket();
    const rejoin = await joinRoom(again, { roomId, displayName: 'Анна' });
    expect(rejoin.ok).toBe(true);
    if (rejoin.ok) {
      expect(rejoin.data.messages).toEqual([]);
      expect(rejoin.data.participants).toHaveLength(1);
    }
  });

  it('treats socket disconnect as leave and deletes the room on last disconnect', async () => {
    const roomId = 'sys-disc-01';
    const first = await openSocket();
    await joinRoom(first, { roomId, displayName: 'Анна' });
    const second = await openSocket();
    await joinRoom(second, { roomId, displayName: 'Борис' });

    const leftEvent = waitForSystem(first);
    second.disconnect();
    const left = await leftEvent;
    expect(left.kind).toBe('left');
    expect(left.displayName).toBe('Борис');
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(1);

    first.disconnect();
    await waitUntil(() => api.registry.get(parseRoomId(roomId)) === undefined);
    expect(api.registry.activeRoomCount()).toBe(0);

    const again = await openSocket();
    const ack = await joinRoom(again, { roomId, displayName: 'Анна' });
    expect(ack.ok).toBe(true);
    if (ack.ok) {
      expect(ack.data.messages).toEqual([]);
      expect(ack.data.participants).toHaveLength(1);
    }
  });

  it('frees a slot on disconnect so another participant can join', async () => {
    const roomId = 'slot-free-01';
    const names = ['Анна', 'Борис', 'Вика', 'Глеб'];
    for (const displayName of names) {
      const occupant = await openSocket();
      const ack = await joinRoom(occupant, { roomId, displayName });
      expect(ack.ok).toBe(true);
    }
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(4);

    const fifth = await openSocket();
    const full = await joinRoom(fifth, { roomId, displayName: 'Даша' });
    expect(full.ok).toBe(false);
    if (!full.ok) {
      expect(full.error.code).toBe('ROOM_FULL');
    }

    sockets[3]?.disconnect();
    await waitUntil(
      () => api.registry.get(parseRoomId(roomId))?.participantCount === 3,
    );

    const retry = await joinRoom(fifth, { roomId, displayName: 'Даша' });
    expect(retry.ok).toBe(true);
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(4);
  });

  async function openSocket(): Promise<Socket> {
    const socket = io(api.origin, {
      path: '/socket.io',
      reconnection: false,
      transports: ['websocket'],
    });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', reject);
    });
    return socket;
  }
});

function joinRoom(
  socket: Socket,
  payload: RoomJoinPayload,
): Promise<Ack<RoomJoinResult>> {
  return emitAck(socket, realtimeEvents.roomJoin, payload);
}

function leaveRoom(socket: Socket): Promise<Ack<RoomLeaveResult>> {
  return emitAck(socket, realtimeEvents.roomLeave, {});
}

function waitForSystem(socket: Socket): Promise<SystemEventDto> {
  return new Promise((resolve) => {
    socket.once(realtimeEvents.chatSystem, resolve);
  });
}

function waitUntil(predicate: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - startedAt > 5_000) {
        clearInterval(timer);
        reject(new Error('Timed out waiting for condition'));
      }
    }, 20);
  });
}

function emitAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
): Promise<Ack<T>> {
  return new Promise((resolve, reject) => {
    socket
      .timeout(5_000)
      .emit(event, payload, (error: Error | null, ack: Ack<T>) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(ack);
      });
  });
}

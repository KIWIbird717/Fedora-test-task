import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { parseRoomId } from '@fedora-meetings/api-domain';
import {
  realtimeEvents,
  type Ack,
  type RoomJoinPayload,
  type RoomJoinResult,
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
  return new Promise((resolve, reject) => {
    socket
      .timeout(5_000)
      .emit(
        realtimeEvents.roomJoin,
        payload,
        (error: Error | null, ack: Ack<RoomJoinResult>) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(ack);
        },
      );
  });
}

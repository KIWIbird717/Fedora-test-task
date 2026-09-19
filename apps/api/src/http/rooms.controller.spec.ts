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

describe('RoomsController', () => {
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

  it('mints an id without inserting a room, then first join creates exactly one room', async () => {
    const mint = await request(api.app.getHttpServer()).post('/api/rooms').expect(201);
    const roomId = (mint.body as { roomId: string }).roomId;

    expect(api.registry.activeRoomCount()).toBe(0);

    const socket = await connectClient(api.origin);
    sockets.push(socket);
    const ack = await joinRoom(socket, { roomId, displayName: 'Анна' });

    expect(ack.ok).toBe(true);
    expect(api.registry.activeRoomCount()).toBe(1);
    expect(api.registry.get(parseRoomId(roomId))?.participantCount).toBe(1);
  });
});

async function connectClient(origin: string): Promise<Socket> {
  const socket = io(origin, {
    path: '/socket.io',
    reconnection: false,
    transports: ['websocket'],
  });
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
  return socket;
}

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

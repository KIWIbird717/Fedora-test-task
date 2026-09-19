import { io, type Socket } from 'socket.io-client';
import {
  realtimeEvents,
  russianMessages,
  type Ack,
  type ChatMessageDto,
  type ChatSendPayload,
  type ChatSendResult,
  type RoomJoinPayload,
  type RoomJoinResult,
} from '@fedora-meetings/contracts-realtime';
import { createTestApi, type TestApi } from '../testing/create-test-app';

describe('chat gateway', () => {
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

  it('broadcasts a trimmed message to every member including the sender', async () => {
    const roomId = 'chat-room-01';
    const first = await openSocket();
    const second = await openSocket();
    await joinRoom(first, { roomId, displayName: 'Анна' });
    const secondJoined = new Promise<void>((resolve) => {
      first.once(realtimeEvents.roomParticipantJoined, () => resolve());
    });
    await joinRoom(second, { roomId, displayName: 'Борис' });
    await secondJoined;

    const received = waitForChat(second);
    const ack = await sendChat(first, { text: '  Привет  ' });

    expect(ack.ok).toBe(true);
    if (!ack.ok) {
      return;
    }
    expect(ack.data.message.text).toBe('Привет');
    expect(ack.data.message.authorName).toBe('Анна');

    const broadcast = await received;
    expect(broadcast.id).toBe(ack.data.message.id);
    expect(broadcast.text).toBe('Привет');
    expect(broadcast.authorName).toBe('Анна');
  });

  it('rejects empty and whitespace-only messages', async () => {
    const socket = await openSocket();
    await joinRoom(socket, { roomId: 'chat-empty1', displayName: 'Анна' });

    const emptyAck = await sendChat(socket, { text: '' });
    const whitespaceAck = await sendChat(socket, { text: ' \n\t ' });

    expect(emptyAck.ok).toBe(false);
    expect(whitespaceAck.ok).toBe(false);
    if (!emptyAck.ok) {
      expect(emptyAck.error.code).toBe('VALIDATION_ERROR');
    }
    if (!whitespaceAck.ok) {
      expect(whitespaceAck.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects messages longer than 1000 characters', async () => {
    const socket = await openSocket();
    await joinRoom(socket, { roomId: 'chat-long-01', displayName: 'Анна' });

    const ack = await sendChat(socket, { text: 'x'.repeat(1001) });

    expect(ack.ok).toBe(false);
    if (!ack.ok) {
      expect(ack.error.code).toBe('VALIDATION_ERROR');
      expect(ack.error.message).toBe(russianMessages.CHAT_TOO_LONG);
    }
  });

  it('rate-limits an 11th message within 10 seconds', async () => {
    const socket = await openSocket();
    await joinRoom(socket, { roomId: 'chat-rate-01', displayName: 'Анна' });

    for (let index = 0; index < 10; index += 1) {
      const ack = await sendChat(socket, { text: `msg-${index}` });
      expect(ack.ok).toBe(true);
    }

    const limited = await sendChat(socket, { text: 'too-many' });
    expect(limited.ok).toBe(false);
    if (!limited.ok) {
      expect(limited.error.code).toBe('RATE_LIMITED');
      expect(limited.error.message).toBe(russianMessages.RATE_LIMITED);
    }
  });

  it('seeds authored history for a late joiner without system events', async () => {
    const roomId = 'chat-hist-01';
    const first = await openSocket();
    await joinRoom(first, { roomId, displayName: 'Анна' });
    const sent = await sendChat(first, { text: 'история' });
    expect(sent.ok).toBe(true);

    const late = await openSocket();
    const ack = await joinRoom(late, { roomId, displayName: 'Борис' });

    expect(ack.ok).toBe(true);
    if (!ack.ok) {
      return;
    }
    expect(ack.data.messages.map((message) => message.text)).toEqual(['история']);
    expect(
      ack.data.messages.every((message) => typeof message.authorName === 'string'),
    ).toBe(true);
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

function sendChat(
  socket: Socket,
  payload: ChatSendPayload,
): Promise<Ack<ChatSendResult>> {
  return emitAck(socket, realtimeEvents.chatSend, payload);
}

function waitForChat(socket: Socket): Promise<ChatMessageDto> {
  return new Promise((resolve) => {
    socket.once(realtimeEvents.chatMessage, resolve);
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

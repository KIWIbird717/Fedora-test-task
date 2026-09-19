import { createSocket } from '@fedora-meetings/web-realtime';
import {
  applyJoinAck,
  getMeetingSessionSnapshot,
  resetMeetingSession,
} from './meeting-session.store';
import {
  handleSocketDisconnect,
  isUnexpectedServerDisconnect,
} from './socket-lifecycle';

describe('socket lifecycle', () => {
  afterEach(() => {
    resetMeetingSession();
  });

  it('disables Socket.IO automatic reconnection', () => {
    const socket = createSocket('http://localhost');
    expect(socket.io.opts.reconnection).toBe(false);
    socket.close();
  });

  it('treats transport close while in-room as server loss', () => {
    expect(isUnexpectedServerDisconnect('transport close')).toBe(true);
    expect(isUnexpectedServerDisconnect('ping timeout')).toBe(true);
    expect(isUnexpectedServerDisconnect('io server disconnect')).toBe(true);
    expect(isUnexpectedServerDisconnect('io client disconnect')).toBe(false);
  });

  it('tears down an in-room session and returns home when the server is gone', async () => {
    applyJoinAck({
      roomId: 'room-1',
      participantId: 'self',
      participants: [
        {
          id: 'self',
          displayName: 'Анна',
          microphoneEnabled: true,
          cameraEnabled: true,
        },
      ],
      messages: [],
      iceServers: [],
    });
    const navigateHome = vi.fn();

    handleSocketDisconnect('transport close', navigateHome);

    expect(navigateHome).toHaveBeenCalledTimes(1);
    expect(getMeetingSessionSnapshot().connection).toEqual({
      status: 'server-error',
    });
  });

  it('does not tear down on an intentional client disconnect', () => {
    applyJoinAck({
      roomId: 'room-1',
      participantId: 'self',
      participants: [
        {
          id: 'self',
          displayName: 'Анна',
          microphoneEnabled: true,
          cameraEnabled: true,
        },
      ],
      messages: [],
      iceServers: [],
    });
    const navigateHome = vi.fn();

    handleSocketDisconnect('io client disconnect', navigateHome);

    expect(navigateHome).not.toHaveBeenCalled();
    expect(getMeetingSessionSnapshot().connection.status).toBe('in-room');
  });
});

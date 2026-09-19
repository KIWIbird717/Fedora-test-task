import { russianMessages } from '@fedora-meetings/contracts-realtime';
import { createRoomClient, createSocket } from '@fedora-meetings/web-realtime';
import type { RoomClient } from '@fedora-meetings/web-realtime';
import { bindChatMessages } from '../../send-chat/model/send-chat';
import { setActiveRoomClient } from './active-room-client';
import {
  addMeetingParticipant,
  applyJoinAck,
  getMeetingSessionSnapshot,
  removeMeetingParticipant,
  setMeetingConnection,
} from './meeting-session.store';

let socket: ReturnType<typeof createSocket> | undefined;
let roomClient: RoomClient | undefined;
let unwatchSession: (() => void) | undefined;
let joinInFlightFor: string | undefined;

export async function joinMeeting(
  roomId: string,
  displayName: string,
): Promise<void> {
  const current = getMeetingSessionSnapshot().connection;
  if (current.status === 'in-room' && current.roomId === roomId) {
    return;
  }
  if (joinInFlightFor === roomId) {
    return;
  }

  joinInFlightFor = roomId;
  setMeetingConnection({ status: 'connecting', roomId });

  try {
    const client = ensureRoomClient();
    await connectSocket();
    const ack = await client.join({ roomId, displayName });
    if (!ack.ok) {
      if (ack.error.code === 'ROOM_FULL') {
        setMeetingConnection({ status: 'room-full', roomId });
        return;
      }
      if (ack.error.code === 'SERVICE_AT_CAPACITY') {
        setMeetingConnection({ status: 'service-full' });
        return;
      }
      setMeetingConnection({ status: 'server-error' });
      return;
    }

    applyJoinAck(ack.data);
    bindSessionEvents(client);
  } catch {
    setMeetingConnection({ status: 'server-error' });
  } finally {
    if (joinInFlightFor === roomId) {
      joinInFlightFor = undefined;
    }
  }
}

function ensureRoomClient(): RoomClient {
  if (!socket || !roomClient) {
    socket = createSocket();
    roomClient = createRoomClient(socket);
    setActiveRoomClient(roomClient);
  }
  return roomClient;
}

function connectSocket(): Promise<void> {
  const activeSocket = socket;
  if (!activeSocket) {
    return Promise.reject(new Error(russianMessages.SERVER_UNREACHABLE));
  }
  if (activeSocket.connected) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onConnect = () => {
      activeSocket.off('connect_error', onError);
      resolve();
    };
    const onError = () => {
      activeSocket.off('connect', onConnect);
      reject(new Error(russianMessages.SERVER_UNREACHABLE));
    };
    activeSocket.once('connect', onConnect);
    activeSocket.once('connect_error', onError);
    activeSocket.connect();
  });
}

function bindSessionEvents(client: RoomClient): void {
  unwatchSession?.();
  const unwatchRoster = client.watchRoster({
    onParticipantJoined: addMeetingParticipant,
    onParticipantLeft: (payload) => {
      removeMeetingParticipant(payload.participantId);
    },
  });
  const unwatchChat = bindChatMessages(client);
  unwatchSession = () => {
    unwatchRoster();
    unwatchChat();
  };
}

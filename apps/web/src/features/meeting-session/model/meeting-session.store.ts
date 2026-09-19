import { useSyncExternalStore } from 'react';
import type {
  ChatMessageDto,
  IceServerDto,
  ParticipantDto,
  RoomJoinResult,
} from '@fedora-meetings/contracts-realtime';

export type MeetingConnectionState =
  | { status: 'idle' }
  | { status: 'connecting'; roomId: string }
  | { status: 'in-room'; roomId: string; participantId: string }
  | { status: 'room-full'; roomId: string }
  | { status: 'service-full' }
  | { status: 'server-error' };

export type MeetingSessionState = {
  connection: MeetingConnectionState;
  participants: ParticipantDto[];
  messages: ChatMessageDto[];
  iceServers: IceServerDto[];
};

const initialState: MeetingSessionState = {
  connection: { status: 'idle' },
  participants: [],
  messages: [],
  iceServers: [],
};

let state: MeetingSessionState = initialState;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getMeetingSessionSnapshot(): MeetingSessionState {
  return state;
}

export function subscribeMeetingSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetMeetingSession(): void {
  state = initialState;
  emit();
}

export function setMeetingConnection(connection: MeetingConnectionState): void {
  state = { ...state, connection };
  emit();
}

export function setMeetingRoster(participants: ParticipantDto[]): void {
  state = { ...state, participants };
  emit();
}

export function setMeetingMessages(messages: ChatMessageDto[]): void {
  state = { ...state, messages };
  emit();
}

export function setMeetingIceServers(iceServers: IceServerDto[]): void {
  state = { ...state, iceServers };
  emit();
}

export function applyJoinAck(result: RoomJoinResult): void {
  state = {
    connection: {
      status: 'in-room',
      roomId: result.roomId,
      participantId: result.participantId,
    },
    participants: result.participants,
    messages: result.messages,
    iceServers: result.iceServers,
  };
  emit();
}

export function addMeetingParticipant(participant: ParticipantDto): void {
  if (state.participants.some((existing) => existing.id === participant.id)) {
    return;
  }
  state = {
    ...state,
    participants: [...state.participants, participant],
  };
  emit();
}

export function removeMeetingParticipant(participantId: string): void {
  state = {
    ...state,
    participants: state.participants.filter(
      (participant) => participant.id !== participantId,
    ),
  };
  emit();
}

export function useMeetingSession(): MeetingSessionState {
  return useSyncExternalStore(
    subscribeMeetingSession,
    getMeetingSessionSnapshot,
    getMeetingSessionSnapshot,
  );
}

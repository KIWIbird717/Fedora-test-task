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

export type PeerMediaState = 'connecting' | 'connected' | 'failed' | 'closed';

export type MeetingSessionState = {
  connection: MeetingConnectionState;
  participants: ParticipantDto[];
  messages: ChatMessageDto[];
  iceServers: IceServerDto[];
  localStream: MediaStream | undefined;
  localMicrophoneEnabled: boolean;
  localCameraEnabled: boolean;
  remoteStreams: Record<string, MediaStream>;
  peerStates: Record<string, PeerMediaState>;
  remoteAudioBlocked: boolean;
};

const initialState: MeetingSessionState = {
  connection: { status: 'idle' },
  participants: [],
  messages: [],
  iceServers: [],
  localStream: undefined,
  localMicrophoneEnabled: false,
  localCameraEnabled: false,
  remoteStreams: {},
  peerStates: {},
  remoteAudioBlocked: false,
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
    ...initialState,
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

export function appendMeetingMessage(message: ChatMessageDto): void {
  if (state.messages.some((existing) => existing.id === message.id)) {
    return;
  }
  state = {
    ...state,
    messages: [...state.messages, message],
  };
  emit();
}

export function setLocalMedia(input: {
  stream: MediaStream | undefined;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
}): void {
  state = {
    ...state,
    localStream: input.stream,
    localMicrophoneEnabled: input.microphoneEnabled,
    localCameraEnabled: input.cameraEnabled,
  };
  emit();
}

export function setRemoteStream(
  participantId: string,
  stream: MediaStream,
): void {
  state = {
    ...state,
    remoteStreams: { ...state.remoteStreams, [participantId]: stream },
  };
  emit();
}

export function setPeerMediaState(
  participantId: string,
  peerState: PeerMediaState,
): void {
  state = {
    ...state,
    peerStates: { ...state.peerStates, [participantId]: peerState },
  };
  emit();
}

export function removePeerMedia(participantId: string): void {
  const remoteStreams = { ...state.remoteStreams };
  const peerStates = { ...state.peerStates };
  delete remoteStreams[participantId];
  delete peerStates[participantId];
  state = { ...state, remoteStreams, peerStates };
  emit();
}

export function setRemoteAudioBlocked(blocked: boolean): void {
  if (state.remoteAudioBlocked === blocked) {
    return;
  }
  state = { ...state, remoteAudioBlocked: blocked };
  emit();
}

export function clearMeetingMedia(): void {
  state = {
    ...state,
    localStream: undefined,
    localMicrophoneEnabled: false,
    localCameraEnabled: false,
    remoteStreams: {},
    peerStates: {},
    remoteAudioBlocked: false,
  };
  emit();
}

export function updateMeetingParticipantMedia(
  participantId: string,
  media: { microphoneEnabled: boolean; cameraEnabled: boolean },
): void {
  state = {
    ...state,
    participants: state.participants.map((participant) =>
      participant.id === participantId
        ? { ...participant, ...media }
        : participant,
    ),
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

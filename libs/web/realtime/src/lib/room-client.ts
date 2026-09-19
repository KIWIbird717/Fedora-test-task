import {
  realtimeEvents,
  type Ack,
  type ChatMessageDto,
  type ChatSendPayload,
  type ChatSendResult,
  type MediaStateChangedDto,
  type MediaStatePayload,
  type MediaStateResult,
  type ParticipantDto,
  type ParticipantLeftDto,
  type RoomJoinPayload,
  type RoomJoinResult,
  type RoomLeaveResult,
  type SignalAnswerPayload,
  type SignalAnswerPush,
  type SignalIcePayload,
  type SignalIcePush,
  type SignalOfferPayload,
  type SignalOfferPush,
  type SignalRelayResult,
  type SystemEventDto,
} from '@fedora-meetings/contracts-realtime';
import type { Socket } from 'socket.io-client';

const ACK_TIMEOUT_MS = 10_000;

export type RosterWatchers = {
  onParticipantJoined: (payload: ParticipantDto) => void;
  onParticipantLeft: (payload: ParticipantLeftDto) => void;
};

export type RoomClient = {
  join(payload: RoomJoinPayload): Promise<Ack<RoomJoinResult>>;
  leave(): Promise<Ack<RoomLeaveResult>>;
  sendChat(payload: ChatSendPayload): Promise<Ack<ChatSendResult>>;
  updateMedia(payload: MediaStatePayload): Promise<Ack<MediaStateResult>>;
  sendOffer(payload: SignalOfferPayload): Promise<Ack<SignalRelayResult>>;
  sendAnswer(payload: SignalAnswerPayload): Promise<Ack<SignalRelayResult>>;
  sendIceCandidate(payload: SignalIcePayload): Promise<Ack<SignalRelayResult>>;
  onParticipantJoined(handler: (payload: ParticipantDto) => void): () => void;
  onParticipantLeft(handler: (payload: ParticipantLeftDto) => void): () => void;
  watchRoster(watchers: RosterWatchers): () => void;
  onChatMessage(handler: (payload: ChatMessageDto) => void): () => void;
  onChatSystem(handler: (payload: SystemEventDto) => void): () => void;
  onMediaStateChanged(handler: (payload: MediaStateChangedDto) => void): () => void;
  onOffer(handler: (payload: SignalOfferPush) => void): () => void;
  onAnswer(handler: (payload: SignalAnswerPush) => void): () => void;
  onIceCandidate(handler: (payload: SignalIcePush) => void): () => void;
  onDisconnect(handler: (reason: string) => void): () => void;
};

export function createRoomClient(socket: Socket): RoomClient {
  return {
    join: (payload) => emitAck(socket, realtimeEvents.roomJoin, payload),
    leave: () => emitAck(socket, realtimeEvents.roomLeave, {}),
    sendChat: (payload) => emitAck(socket, realtimeEvents.chatSend, payload),
    updateMedia: (payload) => emitAck(socket, realtimeEvents.mediaState, payload),
    sendOffer: (payload) => emitAck(socket, realtimeEvents.signalOffer, payload),
    sendAnswer: (payload) => emitAck(socket, realtimeEvents.signalAnswer, payload),
    sendIceCandidate: (payload) =>
      emitAck(socket, realtimeEvents.signalIceCandidate, payload),
    onParticipantJoined: (handler) =>
      listen(socket, realtimeEvents.roomParticipantJoined, handler),
    onParticipantLeft: (handler) =>
      listen(socket, realtimeEvents.roomParticipantLeft, handler),
    watchRoster: (watchers) => {
      const unwatchJoined = listen(
        socket,
        realtimeEvents.roomParticipantJoined,
        watchers.onParticipantJoined,
      );
      const unwatchLeft = listen(
        socket,
        realtimeEvents.roomParticipantLeft,
        watchers.onParticipantLeft,
      );
      return () => {
        unwatchJoined();
        unwatchLeft();
      };
    },
    onChatMessage: (handler) => listen(socket, realtimeEvents.chatMessage, handler),
    onChatSystem: (handler) => listen(socket, realtimeEvents.chatSystem, handler),
    onMediaStateChanged: (handler) =>
      listen(socket, realtimeEvents.mediaStateChanged, handler),
    onOffer: (handler) => listen(socket, realtimeEvents.signalOffer, handler),
    onAnswer: (handler) => listen(socket, realtimeEvents.signalAnswer, handler),
    onIceCandidate: (handler) =>
      listen(socket, realtimeEvents.signalIceCandidate, handler),
    onDisconnect: (handler) => {
      const listener = (reason: string) => {
        handler(reason);
      };
      socket.on('disconnect', listener);
      return () => {
        socket.off('disconnect', listener);
      };
    },
  };
}

function emitAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
): Promise<Ack<T>> {
  return new Promise((resolve, reject) => {
    socket
      .timeout(ACK_TIMEOUT_MS)
      .emit(event, payload, (error: Error | null, ack: Ack<T>) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(ack);
      });
  });
}

function listen<T>(
  socket: Socket,
  event: string,
  handler: (payload: T) => void,
): () => void {
  socket.on(event, handler);
  return () => {
    socket.off(event, handler);
  };
}

import type {
  RoomEventPublisher,
  SignalKind,
} from '@fedora-meetings/api-application';
import type { ChatMessage } from '@fedora-meetings/api-domain';
import type { MediaState } from '@fedora-meetings/api-domain';
import type { Participant } from '@fedora-meetings/api-domain';
import type { ParticipantId } from '@fedora-meetings/api-domain';
import type { RoomId } from '@fedora-meetings/api-domain';
import { realtimeEvents } from '@fedora-meetings/contracts-realtime';
import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import { toChatMessageDto, toParticipantDto } from './dto-mapper';
import { SocketParticipantMap } from './socket-participant.map';

@Injectable()
export class SocketRoomBroadcaster implements RoomEventPublisher {
  private server: Server | undefined;

  constructor(private readonly sockets: SocketParticipantMap) {}

  attach(server: Server): void {
    this.server = server;
  }

  participantJoined(input: { roomId: RoomId; participant: Participant }): void {
    this.server
      ?.to(socketRoomName(input.roomId))
      .emit(realtimeEvents.roomParticipantJoined, toParticipantDto(input.participant));
  }

  participantLeft(input: {
    roomId: RoomId;
    participantId: ParticipantId;
  }): void {
    this.server
      ?.to(socketRoomName(input.roomId))
      .emit(realtimeEvents.roomParticipantLeft, {
        participantId: input.participantId,
      });
  }

  chatMessage(input: { roomId: RoomId; message: ChatMessage }): void {
    this.server
      ?.to(socketRoomName(input.roomId))
      .emit(realtimeEvents.chatMessage, toChatMessageDto(input.message));
  }

  systemEvent(input: {
    roomId: RoomId;
    kind: 'joined' | 'left';
    participantId: ParticipantId;
    displayName: string;
    occurredAt: Date;
  }): void {
    this.server?.to(socketRoomName(input.roomId)).emit(realtimeEvents.chatSystem, {
      kind: input.kind,
      participantId: input.participantId,
      displayName: input.displayName,
      occurredAt: input.occurredAt.toISOString(),
    });
  }

  mediaStateChanged(input: {
    roomId: RoomId;
    participantId: ParticipantId;
    media: MediaState;
  }): void {
    this.server
      ?.to(socketRoomName(input.roomId))
      .emit(realtimeEvents.mediaStateChanged, {
        participantId: input.participantId,
        microphoneEnabled: input.media.microphoneEnabled,
        cameraEnabled: input.media.cameraEnabled,
      });
  }

  relaySignal(input: {
    kind: SignalKind;
    toParticipantId: ParticipantId;
    fromParticipantId: ParticipantId;
    payload: string;
  }): void {
    const socketId = this.sockets.getSocketId(input.toParticipantId);
    if (!socketId) {
      return;
    }
    if (input.kind === 'offer') {
      this.server?.to(socketId).emit(realtimeEvents.signalOffer, {
        fromParticipantId: input.fromParticipantId,
        sdp: input.payload,
      });
      return;
    }
    if (input.kind === 'answer') {
      this.server?.to(socketId).emit(realtimeEvents.signalAnswer, {
        fromParticipantId: input.fromParticipantId,
        sdp: input.payload,
      });
      return;
    }
    this.server?.to(socketId).emit(realtimeEvents.signalIceCandidate, {
      fromParticipantId: input.fromParticipantId,
      candidate: input.payload,
    });
  }
}

export function socketRoomName(roomId: string): string {
  return `room:${roomId}`;
}

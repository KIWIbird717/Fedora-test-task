import {
  JoinRoom,
  LeaveRoom,
  RelaySignal,
  SendChatMessage,
  UpdateMediaState,
} from '@fedora-meetings/api-application';
import {
  chatSendPayloadSchema,
  mediaStatePayloadSchema,
  realtimeEvents,
  roomJoinPayloadSchema,
  roomLeavePayloadSchema,
  russianMessages,
  signalAnswerPayloadSchema,
  signalIcePayloadSchema,
  signalOfferPayloadSchema,
  type Ack,
  type AckError,
  type ChatSendResult,
  type MediaStateResult,
  type RoomJoinResult,
  type RoomLeaveResult,
  type SignalRelayResult,
} from '@fedora-meetings/contracts-realtime';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { ZodType } from 'zod';
import { loadEnv } from '../config/env';
import { toAckError } from '../http/error-mapping';
import { toChatMessageDto, toParticipantDto } from './dto-mapper';
import {
  socketRoomName,
  SocketRoomBroadcaster,
} from './socket-room.broadcaster';
import { SocketParticipantMap } from './socket-participant.map';

const env = loadEnv();

@WebSocketGateway({
  cors: { origin: env.CORS_ORIGINS },
})
export class RoomsGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  constructor(
    private readonly sockets: SocketParticipantMap,
    private readonly broadcaster: SocketRoomBroadcaster,
    private readonly joinRoom: JoinRoom,
    private readonly leaveRoom: LeaveRoom,
    private readonly sendChatMessage: SendChatMessage,
    private readonly updateMediaState: UpdateMediaState,
    private readonly relaySignal: RelaySignal,
  ) {}

  afterInit(server: Server): void {
    this.broadcaster.attach(server);
  }

  handleDisconnect(client: Socket): void {
    const membership = this.sockets.unbindBySocket(client.id);
    if (!membership) {
      return;
    }
    this.leaveRoom.execute({
      roomId: membership.roomId,
      participantId: membership.participantId,
    });
  }

  @SubscribeMessage(realtimeEvents.roomJoin)
  onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Ack<RoomJoinResult> {
    const parsed = parsePayload(roomJoinPayloadSchema, payload);
    if (!parsed.ok) {
      return parsed;
    }

    try {
      this.leaveCurrentRoom(client);
      const result = this.joinRoom.execute(parsed.data);
      this.sockets.bind(client.id, result.participant.id, result.roomId);
      void client.join(socketRoomName(result.roomId));
      return {
        ok: true,
        data: {
          roomId: result.roomId,
          participantId: result.participant.id,
          participants: result.participants.map(toParticipantDto),
          messages: result.messages.map(toChatMessageDto),
          iceServers: result.iceServers,
        },
      };
    } catch (error) {
      return failure(error, this.logger);
    }
  }

  @SubscribeMessage(realtimeEvents.roomLeave)
  onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Ack<RoomLeaveResult> {
    const parsed = parsePayload(roomLeavePayloadSchema, payload);
    if (!parsed.ok) {
      return parsed;
    }
    const membership = this.requireMembership(client);
    if (!membership.ok) {
      return membership;
    }
    try {
      const result = this.leaveRoom.execute({
        roomId: membership.data.roomId,
        participantId: membership.data.participantId,
      });
      this.sockets.unbindBySocket(client.id);
      void client.leave(socketRoomName(membership.data.roomId));
      return { ok: true, data: { roomId: result.roomId } };
    } catch (error) {
      return failure(error, this.logger);
    }
  }

  @SubscribeMessage(realtimeEvents.chatSend)
  onChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Ack<ChatSendResult> {
    const parsed = parsePayload(chatSendPayloadSchema, payload);
    if (!parsed.ok) {
      return parsed;
    }
    const membership = this.requireMembership(client);
    if (!membership.ok) {
      return membership;
    }
    try {
      const message = this.sendChatMessage.execute({
        roomId: membership.data.roomId,
        participantId: membership.data.participantId,
        text: parsed.data.text,
      });
      return { ok: true, data: { message: toChatMessageDto(message) } };
    } catch (error) {
      return failure(error, this.logger);
    }
  }

  @SubscribeMessage(realtimeEvents.mediaState)
  onMedia(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Ack<MediaStateResult> {
    const parsed = parsePayload(mediaStatePayloadSchema, payload);
    if (!parsed.ok) {
      return parsed;
    }
    const membership = this.requireMembership(client);
    if (!membership.ok) {
      return membership;
    }
    try {
      const media = this.updateMediaState.execute({
        roomId: membership.data.roomId,
        participantId: membership.data.participantId,
        microphoneEnabled: parsed.data.microphoneEnabled,
        cameraEnabled: parsed.data.cameraEnabled,
      });
      return {
        ok: true,
        data: {
          media: {
            microphoneEnabled: media.microphoneEnabled,
            cameraEnabled: media.cameraEnabled,
          },
        },
      };
    } catch (error) {
      return failure(error, this.logger);
    }
  }

  @SubscribeMessage(realtimeEvents.signalOffer)
  onOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Ack<SignalRelayResult> {
    const parsed = parsePayload(signalOfferPayloadSchema, payload);
    if (!parsed.ok) {
      return parsed;
    }
    return this.relay(client, {
      toParticipantId: parsed.data.toParticipantId,
      kind: 'offer',
      payload: parsed.data.sdp,
    });
  }

  @SubscribeMessage(realtimeEvents.signalAnswer)
  onAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Ack<SignalRelayResult> {
    const parsed = parsePayload(signalAnswerPayloadSchema, payload);
    if (!parsed.ok) {
      return parsed;
    }
    return this.relay(client, {
      toParticipantId: parsed.data.toParticipantId,
      kind: 'answer',
      payload: parsed.data.sdp,
    });
  }

  @SubscribeMessage(realtimeEvents.signalIceCandidate)
  onIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Ack<SignalRelayResult> {
    const parsed = parsePayload(signalIcePayloadSchema, payload);
    if (!parsed.ok) {
      return parsed;
    }
    return this.relay(client, {
      toParticipantId: parsed.data.toParticipantId,
      kind: 'ice-candidate',
      payload: parsed.data.candidate,
    });
  }

  private relay(
    client: Socket,
    input: {
      toParticipantId: string;
      kind: 'offer' | 'answer' | 'ice-candidate';
      payload: string;
    },
  ): Ack<SignalRelayResult> {
    const membership = this.requireMembership(client);
    if (!membership.ok) {
      return membership;
    }
    try {
      return {
        ok: true,
        data: this.relaySignal.execute({
          roomId: membership.data.roomId,
          fromParticipantId: membership.data.participantId,
          toParticipantId: input.toParticipantId,
          kind: input.kind,
          payload: input.payload,
        }),
      };
    } catch (error) {
      return failure(error, this.logger);
    }
  }

  private leaveCurrentRoom(client: Socket): void {
    const previous = this.sockets.getBySocket(client.id);
    if (!previous) {
      return;
    }
    this.leaveRoom.execute({
      roomId: previous.roomId,
      participantId: previous.participantId,
    });
    void client.leave(socketRoomName(previous.roomId));
    this.sockets.unbindBySocket(client.id);
  }

  private requireMembership(client: Socket) {
    const membership = this.sockets.getBySocket(client.id);
    if (!membership) {
      return {
        ok: false as const,
        error: {
          code: 'NOT_IN_ROOM' as const,
          message: russianMessages.NOT_IN_ROOM,
        },
      };
    }
    return { ok: true as const, data: membership };
  }
}

function parsePayload<T>(
  schema: ZodType<T>,
  payload: unknown,
): { ok: true; data: T } | { ok: false; error: AckError } {
  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: russianMessages.INVALID_PAYLOAD,
      },
    };
  }
  return { ok: true, data: result.data };
}

function failure(error: unknown, logger: Logger): Ack<never> {
  const mapped = toAckError(error);
  if (mapped.code === 'INTERNAL_ERROR') {
    logger.error(error);
  }
  return { ok: false, error: mapped };
}

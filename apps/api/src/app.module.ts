import {
  JoinRoom,
  LeaveRoom,
  MintRoomId,
  RelaySignal,
  SendChatMessage,
  UpdateMediaState,
  type RoomEventPublisher,
  type RoomRegistry,
} from '@fedora-meetings/api-application';
import { InMemoryRoomRegistry } from '@fedora-meetings/api-infra-memory';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { loadEnv, type AppEnv } from './config/env';
import { APP_ENV, ROOM_REGISTRY } from './config/tokens';
import { HealthController } from './http/health.controller';
import { HttpExceptionFilter } from './http/http-exception.filter';
import { RoomsController } from './http/rooms.controller';
import { RoomsGateway } from './realtime/rooms.gateway';
import { SocketParticipantMap } from './realtime/socket-participant.map';
import { SocketRoomBroadcaster } from './realtime/socket-room.broadcaster';

const env = loadEnv();
const iceServers = env.STUN_URLS.map((urls) => ({ urls }));

@Module({
  controllers: [HealthController, RoomsController],
  providers: [
    { provide: APP_ENV, useValue: env },
    {
      provide: ROOM_REGISTRY,
      useFactory: (appEnv: AppEnv) => new InMemoryRoomRegistry(appEnv.ROOM_CEILING),
      inject: [APP_ENV],
    },
    SocketParticipantMap,
    SocketRoomBroadcaster,
    {
      provide: MintRoomId,
      useFactory: (registry: RoomRegistry, appEnv: AppEnv) =>
        new MintRoomId(registry, appEnv.ROOM_CEILING),
      inject: [ROOM_REGISTRY, APP_ENV],
    },
    {
      provide: JoinRoom,
      useFactory: (
        registry: RoomRegistry,
        publisher: RoomEventPublisher,
      ) => new JoinRoom(registry, publisher, iceServers),
      inject: [ROOM_REGISTRY, SocketRoomBroadcaster],
    },
    {
      provide: LeaveRoom,
      useFactory: (
        registry: RoomRegistry,
        publisher: RoomEventPublisher,
      ) => new LeaveRoom(registry, publisher),
      inject: [ROOM_REGISTRY, SocketRoomBroadcaster],
    },
    {
      provide: SendChatMessage,
      useFactory: (
        registry: RoomRegistry,
        publisher: RoomEventPublisher,
      ) => new SendChatMessage(registry, publisher),
      inject: [ROOM_REGISTRY, SocketRoomBroadcaster],
    },
    {
      provide: UpdateMediaState,
      useFactory: (
        registry: RoomRegistry,
        publisher: RoomEventPublisher,
      ) => new UpdateMediaState(registry, publisher),
      inject: [ROOM_REGISTRY, SocketRoomBroadcaster],
    },
    {
      provide: RelaySignal,
      useFactory: (
        registry: RoomRegistry,
        publisher: RoomEventPublisher,
      ) => new RelaySignal(registry, publisher),
      inject: [ROOM_REGISTRY, SocketRoomBroadcaster],
    },
    RoomsGateway,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

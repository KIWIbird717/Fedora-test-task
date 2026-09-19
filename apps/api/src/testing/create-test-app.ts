import 'reflect-metadata';
import { type INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Test } from '@nestjs/testing';
import type { RoomRegistry } from '@fedora-meetings/api-application';
import type { AddressInfo } from 'node:net';
import { AppModule } from '../app.module';
import { ROOM_REGISTRY } from '../config/tokens';

export type TestApi = {
  app: INestApplication;
  registry: RoomRegistry;
  port: number;
  origin: string;
};

export async function createTestApi(): Promise<TestApi> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(0, '127.0.0.1');

  const address = app.getHttpServer().address() as AddressInfo | null;
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP listen address');
  }

  return {
    app,
    registry: app.get<RoomRegistry>(ROOM_REGISTRY),
    port: address.port,
    origin: `http://127.0.0.1:${address.port}`,
  };
}

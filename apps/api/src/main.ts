import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { apiReference } from '@scalar/nestjs-api-reference';
import { parse } from 'yaml';
import { AppModule } from './app.module';
import { loadEnv } from './config/env';

function loadOpenApiDocument(): Record<string, unknown> {
  const candidates = [
    join(__dirname, 'openapi.yaml'),
    join(process.cwd(), 'libs/contracts/http/src/openapi.yaml'),
  ];
  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      // yaml.parse is untyped; Scalar consumes the committed OpenAPI document as a plain object
      return parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
    }
  }
  throw new Error('OpenAPI document not found');
}

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, {
    logger:
      env.LOG_LEVEL === 'debug'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : env.LOG_LEVEL === 'warn'
          ? ['error', 'warn']
          : env.LOG_LEVEL === 'error'
            ? ['error']
            : ['log', 'error', 'warn'],
  });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: env.CORS_ORIGINS });

  const openApiDocument = loadOpenApiDocument();
  app.use(
    '/api/docs',
    apiReference({
      spec: {
        content: openApiDocument,
      },
    }),
  );

  await app.listen(env.API_PORT, env.API_HOST);
  Logger.log(
    `API listening on http://${env.API_HOST}:${env.API_PORT}/api`,
  );
}

void bootstrap();

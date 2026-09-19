import { InvalidParticipantIdError } from './errors.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ParticipantId = string & { readonly __brand: 'ParticipantId' };

export function createParticipantId(): ParticipantId {
  return crypto.randomUUID() as ParticipantId;
}

export function parseParticipantId(value: string): ParticipantId {
  if (!UUID_PATTERN.test(value)) {
    throw new InvalidParticipantIdError();
  }
  return value as ParticipantId;
}

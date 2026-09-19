import { ROOM_ID_PATTERN } from './constants.js';
import { InvalidRoomIdError } from './errors.js';

export type RoomId = string & { readonly __brand: 'RoomId' };

export function parseRoomId(value: string): RoomId {
  if (!ROOM_ID_PATTERN.test(value)) {
    throw new InvalidRoomIdError();
  }
  return value as RoomId;
}

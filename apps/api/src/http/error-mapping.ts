import { NotInRoomError, RateLimitedError } from '@fedora-meetings/api-application';
import {
  InvalidChatTextError,
  InvalidDisplayNameError,
  InvalidParticipantIdError,
  InvalidRoomIdError,
  RoomFullError,
  ServiceAtCapacityError,
} from '@fedora-meetings/api-domain';
import {
  russianMessages,
  type AckError,
} from '@fedora-meetings/contracts-realtime';

export function toAckError(error: unknown): AckError {
  if (error instanceof RoomFullError) {
    return { code: 'ROOM_FULL', message: russianMessages.ROOM_FULL };
  }
  if (error instanceof ServiceAtCapacityError) {
    return {
      code: 'SERVICE_AT_CAPACITY',
      message: russianMessages.SERVICE_AT_CAPACITY,
    };
  }
  if (error instanceof RateLimitedError) {
    return { code: 'RATE_LIMITED', message: russianMessages.RATE_LIMITED };
  }
  if (error instanceof NotInRoomError) {
    return { code: 'NOT_IN_ROOM', message: russianMessages.NOT_IN_ROOM };
  }
  if (error instanceof InvalidDisplayNameError) {
    if (error.reason === 'empty') {
      return { code: 'VALIDATION_ERROR', message: russianMessages.EMPTY_NAME };
    }
    if (error.reason === 'too-long') {
      return { code: 'VALIDATION_ERROR', message: russianMessages.NAME_TOO_LONG };
    }
    return {
      code: 'VALIDATION_ERROR',
      message: russianMessages.BAD_NAME_CHARSET,
    };
  }
  if (error instanceof InvalidChatTextError) {
    if (error.reason === 'too-long') {
      return { code: 'VALIDATION_ERROR', message: russianMessages.CHAT_TOO_LONG };
    }
    return { code: 'VALIDATION_ERROR', message: russianMessages.INVALID_PAYLOAD };
  }
  if (
    error instanceof InvalidRoomIdError ||
    error instanceof InvalidParticipantIdError
  ) {
    return { code: 'VALIDATION_ERROR', message: russianMessages.INVALID_PAYLOAD };
  }
  return { code: 'INTERNAL_ERROR', message: russianMessages.INTERNAL_ERROR };
}

export function toHttpStatus(error: AckError): number {
  if (error.code === 'SERVICE_AT_CAPACITY') {
    return 503;
  }
  if (error.code === 'INTERNAL_ERROR') {
    return 500;
  }
  return 400;
}

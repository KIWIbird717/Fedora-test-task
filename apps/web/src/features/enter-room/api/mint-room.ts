import { useMutation } from '@tanstack/react-query';
import { russianMessages } from '@fedora-meetings/contracts-realtime';
import type { paths } from '../../../shared/api/schema';

type MintRoomResponse =
  paths['/rooms']['post']['responses']['201']['content']['application/json'];
type ErrorResponse =
  paths['/rooms']['post']['responses']['503']['content']['application/json'];

export class ServiceAtCapacityError extends Error {
  readonly code = 'SERVICE_AT_CAPACITY' as const;

  constructor(message: string = russianMessages.SERVICE_AT_CAPACITY) {
    super(message);
    this.name = 'ServiceAtCapacityError';
  }
}

export async function mintRoomId(): Promise<string> {
  let response: Response;
  try {
    response = await fetch('/api/rooms', { method: 'POST' });
  } catch {
    throw new Error(russianMessages.SERVER_UNREACHABLE);
  }

  if (response.status === 201) {
    const body = (await response.json()) as MintRoomResponse;
    return body.roomId;
  }

  if (response.status === 503) {
    const body = (await response.json()) as ErrorResponse;
    throw new ServiceAtCapacityError(body.message);
  }

  throw new Error(russianMessages.SERVER_UNREACHABLE);
}

export function useMintRoomMutation() {
  return useMutation({
    mutationFn: mintRoomId,
  });
}

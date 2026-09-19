export class NotInRoomError extends Error {
  readonly code = 'NOT_IN_ROOM' as const;

  constructor() {
    super('NOT_IN_ROOM');
    this.name = 'NotInRoomError';
  }
}

export class RateLimitedError extends Error {
  readonly code = 'RATE_LIMITED' as const;

  constructor() {
    super('RATE_LIMITED');
    this.name = 'RateLimitedError';
  }
}

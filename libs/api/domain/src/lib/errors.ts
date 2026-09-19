export class RoomFullError extends Error {
  readonly code = 'ROOM_FULL' as const;

  constructor() {
    super('ROOM_FULL');
    this.name = 'RoomFullError';
  }
}

export class ServiceAtCapacityError extends Error {
  readonly code = 'SERVICE_AT_CAPACITY' as const;

  constructor() {
    super('SERVICE_AT_CAPACITY');
    this.name = 'ServiceAtCapacityError';
  }
}

export type InvalidDisplayNameReason = 'empty' | 'too-long' | 'charset';

export class InvalidDisplayNameError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor(readonly reason: InvalidDisplayNameReason) {
    super('VALIDATION_ERROR');
    this.name = 'InvalidDisplayNameError';
  }
}

export type InvalidChatTextReason = 'empty' | 'too-long';

export class InvalidChatTextError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor(readonly reason: InvalidChatTextReason) {
    super('VALIDATION_ERROR');
    this.name = 'InvalidChatTextError';
  }
}

export class InvalidRoomIdError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor() {
    super('VALIDATION_ERROR');
    this.name = 'InvalidRoomIdError';
  }
}

export class InvalidParticipantIdError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor() {
    super('VALIDATION_ERROR');
    this.name = 'InvalidParticipantIdError';
  }
}

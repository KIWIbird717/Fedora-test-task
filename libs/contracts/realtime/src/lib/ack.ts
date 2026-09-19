export type TransportErrorCode =
  | 'ROOM_FULL'
  | 'SERVICE_AT_CAPACITY'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_IN_ROOM'
  | 'INVALID_PAYLOAD'
  | 'INTERNAL_ERROR';

export type ClientErrorCode =
  | 'SERVER_UNREACHABLE'
  | 'WEBRTC_UNSUPPORTED'
  | 'MEDIA_PERMISSION_DENIED'
  | 'PEER_MEDIA_FAILED';

export type ErrorCode = TransportErrorCode | ClientErrorCode;

export type AckError = {
  code: TransportErrorCode;
  message: string;
};

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: AckError };

export const russianMessages = {
  ROOM_FULL: 'Комната заполнена',
  SERVICE_AT_CAPACITY: 'Сервис переполнен. Попробуйте позже.',
  EMPTY_NAME: 'Введите имя',
  BAD_NAME_CHARSET:
    'Имя может содержать буквы, цифры, пробелы, дефис и апостроф',
  NAME_TOO_LONG: 'Имя не длиннее 30 символов',
  CHAT_TOO_LONG: 'Сообщение не длиннее 1000 символов',
  RATE_LIMITED: 'Слишком много сообщений. Подождите немного.',
  NOT_IN_ROOM: 'Вы не в комнате',
  INVALID_PAYLOAD: 'Некорректные данные',
  INTERNAL_ERROR: 'Произошла ошибка. Попробуйте позже.',
  SERVER_UNREACHABLE: 'Не удалось подключиться к серверу',
  WEBRTC_UNSUPPORTED: 'Ваш браузер не поддерживает WebRTC',
  MEDIA_PERMISSION_DENIED:
    'Нет доступа к камере или микрофону. Вы в комнате, устройства выключены.',
  PEER_MEDIA_FAILED: 'Не удалось подключить медиа',
  CONNECTING: 'Подключение…',
  ALONE_IN_ROOM:
    'Пока никого нет. Скопируйте ссылку, чтобы пригласить участников.',
  COPY_CONFIRM: 'Ссылка скопирована',
} as const;

export function systemJoinedText(name: string): string {
  return `${name} присоединился к комнате`;
}

export function systemLeftText(name: string): string {
  return `${name} вышел из комнаты`;
}

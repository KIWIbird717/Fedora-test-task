# Socket.IO contract

**Namespace**: default `/`  
**Path**: `/socket.io`  
**Auth**: none  
**Reconnection**: client MUST set `reconnection: false`

Event names and payload types MUST be implemented in `libs/contracts/realtime` and imported by `apps/api` and `apps/web`. Do not duplicate literals.

Commands use **acks**. Broadcasts are server push. Ack shape:

```ts
type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string } };
```

`message` is Russian, user-facing. `code` is the stable client switch key.

## Error codes

| Code | Transport | When |
|------|-----------|------|
| `ROOM_FULL` | join ack | 5th participant (FR-008) |
| `SERVICE_AT_CAPACITY` | HTTP 503 or join ack on **create** | `ROOM_CEILING` (FR-041) |
| `VALIDATION_ERROR` | join/chat ack | name or message rules |
| `RATE_LIMITED` | chat ack | >10 messages / 10 s (FR-040) |
| `NOT_IN_ROOM` | chat/media/signal/leave ack | socket has no membership |
| `INVALID_PAYLOAD` | any inbound | Zod failure |
| `INTERNAL_ERROR` | any | unexpected; generic Russian message |
| `SERVER_UNREACHABLE` | **client-only** | connect failure or mid-call disconnect (FR-035) |
| `WEBRTC_UNSUPPORTED` | **client-only** | no RTCPeerConnection / getUserMedia (FR-036) |
| `MEDIA_PERMISSION_DENIED` | **client-only** | stays in room, devices off (FR-033) |
| `PEER_MEDIA_FAILED` | **client-only** | that tile only (FR-034) |

## Client → server (acks)

### `room:join`

```ts
type RoomJoinPayload = {
  roomId: string; // RoomId
  displayName: string;
};

type RoomJoinResult = {
  roomId: string;
  participantId: string; // UUID, hidden in UI
  participants: ParticipantDto[];
  messages: ChatMessageDto[]; // authored history only
  iceServers: { urls: string }[]; // STUN from server config; never TURN unless spec changes
};
```

Creates the room if absent (ceiling applies). Joins if present (4-cap applies). Duplicate display names allowed.

### `room:leave`

```ts
type RoomLeavePayload = Record<string, never>;
type RoomLeaveResult = { roomId: string };
```

Same path as disconnect. Idempotent if already gone.

### `chat:send`

```ts
type ChatSendPayload = { text: string };
type ChatSendResult = { message: ChatMessageDto };
```

Sender also receives `chat:message` broadcast (or may render from ack — pick **one** in implementation to avoid duplicates; prefer broadcast including sender).

### `media:state`

```ts
type MediaStatePayload = {
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};
type MediaStateResult = { media: MediaStatePayload };
```

### Signaling (relay only — no domain logic)

```ts
type SignalOfferPayload = { toParticipantId: string; sdp: string };
type SignalAnswerPayload = { toParticipantId: string; sdp: string };
type SignalIcePayload = { toParticipantId: string; candidate: string };
```

Acks: `{ ok: true, data: { toParticipantId: string } }` or `NOT_IN_ROOM` / `INVALID_PAYLOAD`.  
Server MUST NOT interpret SDP. Drop if `to` is not in the same room. Do not relay to self.

## Server → client (push)

| Event | Payload | Notes |
|-------|---------|--------|
| `room:participant-joined` | `ParticipantDto` | Not sent to the joiner (they have ack). Live system event is separate. |
| `room:participant-left` | `{ participantId: string }` | Tab close, leave, disconnect — same event |
| `chat:message` | `ChatMessageDto` | All members including sender |
| `chat:system` | `SystemEventDto` | Live only; never in join history |
| `media:state-changed` | `{ participantId: string } & MediaStatePayload` | |
| `signal:offer` | `{ fromParticipantId: string; sdp: string }` | |
| `signal:answer` | `{ fromParticipantId: string; sdp: string }` | |
| `signal:ice-candidate` | `{ fromParticipantId: string; candidate: string }` | |

Disconnect of the socket is the FR-035 signal. Do not add a custom reconnect protocol.

## Shared DTOs

```ts
type ParticipantDto = {
  id: string;
  displayName: string;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};

type ChatMessageDto = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  sentAt: string; // ISO-8601 UTC
};

type SystemEventDto = {
  kind: "joined" | "left";
  participantId: string;
  displayName: string;
  occurredAt: string; // ISO-8601 UTC
};

type ErrorCode =
  | "ROOM_FULL"
  | "SERVICE_AT_CAPACITY"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "NOT_IN_ROOM"
  | "INVALID_PAYLOAD"
  | "INTERNAL_ERROR";
```

## User-facing Russian copy (server `message` and matching UI)

Exact product strings where the spec mandates them; others are the planned default copy (Russian UI only, NFR-007).

| Code / situation | Message |
|------------------|---------|
| `ROOM_FULL` | Комната заполнена |
| `SERVICE_AT_CAPACITY` | Сервис переполнен. Попробуйте позже. |
| empty name | Введите имя |
| bad name charset | Имя может содержать буквы, цифры, пробелы, дефис и апостроф |
| empty chat | — (do not send) |
| chat too long | Сообщение не длиннее 1000 символов |
| `RATE_LIMITED` | Слишком много сообщений. Подождите немного. |
| `SERVER_UNREACHABLE` | Не удалось подключиться к серверу |
| `WEBRTC_UNSUPPORTED` | Ваш браузер не поддерживает WebRTC |
| `MEDIA_PERMISSION_DENIED` | Нет доступа к камере или микрофону. Вы в комнате, устройства выключены. |
| `PEER_MEDIA_FAILED` | Не удалось подключить медиа |
| connecting | Подключение… |
| alone in room | Пока никого нет. Скопируйте ссылку, чтобы пригласить участников. |
| copy confirm | Ссылка скопирована |
| system joined | {name} присоединился(ась) к комнате |
| system left | {name} вышел(ла) из комнаты |

Retry button with room full: «Повторить вход» — retries **the same** `roomId` (A-004).

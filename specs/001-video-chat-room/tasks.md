---
description: "Task list for video chat room implementation"
---

# Tasks: Video Chat Room

**Input**: Design documents from `/specs/001-video-chat-room/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included where the constitution and plan require them (domain/use-case unit tests, join atomicity, Playwright journeys). Per-story UI tests are not duplicated when the Independent Test is a manual/E2E criterion listed on the story.

**Organization**: Setup → Foundational (blocks all stories) → user stories in delivery order (P1 then P2 then P3) → Polish (Docker, E2E, a11y).

**UX defaults** (from plan; unblocks [checklists/ux.md](./checklists/ux.md) without extra product scope): self-view is a separate PIP (not a cell in the 1–3 remote grid); chat + roster are a visible column at ≥1024px; `/` has name + «Создать комнату»; `/room/$roomId` name gate has «Войти»; controls are icon-only with Tooltip + `aria-label`; connecting is spinner + «Подключение…»; copy-link lives on the control bar always; no leave confirmation; `HH:MM` is 24-hour; system lines «{name} присоединился к комнате» / «{name} вышел из комнаты».

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Nx layout from plan.md: `apps/api`, `apps/web`, `apps/web-e2e`, `libs/api/*`, `libs/contracts/*`, `libs/web/*`. Packages `@fedora-meetings/*`. Scaffold with `pnpm nx g … --no-interactive` (nx-generate skill at implement time). Libraries non-buildable.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the empty Nx stub a tagged, linted, TypeScript-strict monorepo that can host the planned apps and libs.

- [X] T001 Rename root `package.json` `"name"` to `fedora-meetings` and add `packages: ['apps/*', 'libs/**']` in `pnpm-workspace.yaml` (keep `allowBuilds.nx`)
- [X] T002 Add Nx plugins (`@nx/js`, `@nx/eslint`, `@nx/vite`, `@nx/react`, `@nx/nest`, `@nx/node`, `@nx/playwright`, `@nx/vitest`, `@nx/docker`) matching Nx 23.2.1 and configure `nx.json` plugins/named inputs
- [X] T003 [P] Add root TypeScript strict config in `tsconfig.base.json` (`strict: true`, path aliases only to library public entry points)
- [X] T004 [P] Add ESLint + Prettier in `eslint.config.mjs` and `.prettierrc` with `@nx/enforce-module-boundaries` tags/constraints from plan.md (domain must not import nestjs/socket.io/zod)
- [X] T005 Generate Nest app `apps/api` (`scope:api,type:app`) with Vitest (not Jest) via Nx generator
- [X] T006 Generate Vite React app `apps/web` (`scope:web,type:app`) with FSD directories `apps/web/src/{app,pages,widgets,features,entities,shared}`
- [X] T007 Generate Playwright project `apps/web-e2e` (`scope:web,type:e2e`)
- [X] T008 [P] Generate lib `libs/api/domain` (`scope:api,type:domain`) public entry `libs/api/domain/src/index.ts`
- [X] T009 [P] Generate lib `libs/api/application` (`scope:api,type:application`) public entry `libs/api/application/src/index.ts`
- [X] T010 [P] Generate lib `libs/api/infra-memory` (`scope:api,type:infra`) public entry `libs/api/infra-memory/src/index.ts`
- [X] T011 [P] Generate lib `libs/contracts/http` (`scope:shared,type:contracts`) public entry `libs/contracts/http/src/index.ts`
- [X] T012 [P] Generate lib `libs/contracts/realtime` (`scope:shared,type:contracts`) public entry `libs/contracts/realtime/src/index.ts`
- [X] T013 [P] Generate lib `libs/web/ui` (`scope:web,type:ui`) public entry `libs/web/ui/src/index.ts`
- [X] T014 [P] Generate lib `libs/web/media` (`scope:web,type:infra`) public entry `libs/web/media/src/index.ts`
- [X] T015 [P] Generate lib `libs/web/webrtc` (`scope:web,type:infra`) public entry `libs/web/webrtc/src/index.ts`
- [X] T016 [P] Generate lib `libs/web/realtime` (`scope:web,type:infra`) public entry `libs/web/realtime/src/index.ts`
- [X] T017 Wire workspace deps in `apps/api/package.json` and `apps/web/package.json` (api → domain/application/infra-memory/contracts; web → contracts + web-* libs) without tsconfig path hacks
- [X] T018 Add Vitest targets in each project's `package.json`/`project.json` for domain, application, infra-memory, web-webrtc, web-media, api, web; confirm `pnpm nx graph` shows no cycles

**Checkpoint**: Workspace exists; no product behaviour yet

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contracts, domain, in-memory registry, Nest/Socket composition, web shell, design tokens. **No user story UI/flows until this phase is done.**

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T019 Copy `specs/001-video-chat-room/contracts/openapi.yaml` into `libs/contracts/http/src/openapi.yaml` and add Nx target `contracts-http:generate` writing `apps/web/src/shared/api/schema.d.ts` via openapi-typescript
- [X] T020 Implement Socket.IO event names, DTO types, `Ack<T>`, `ErrorCode` union, and Zod payloads in `libs/contracts/realtime/src/lib/` matching `specs/001-video-chat-room/contracts/realtime.md` (export only from `libs/contracts/realtime/src/index.ts`)
- [X] T021 [P] Add domain constants in `libs/api/domain/src/lib/constants.ts`: display-name max 30, pattern `^[\p{L}\p{N} \-']+$`, chat max 1000, chat rate 10 per 10 seconds, room max 4 participants, room id pattern `^[A-Za-z0-9_-]{8,32}$`
- [X] T022 [P] Implement branded `RoomId` in `libs/api/domain/src/lib/room-id.ts` (8–32 chars `A-Za-z0-9_-`) and `ParticipantId` UUID in `libs/api/domain/src/lib/participant-id.ts`
- [X] T023 [P] Implement `DisplayName` value object in `libs/api/domain/src/lib/display-name.ts`: trimmed; length 1–30; pattern `^[\p{L}\p{N} \-']+$`; reject empty/whitespace; no uniqueness
- [X] T024 [P] Implement `ChatText` in `libs/api/domain/src/lib/chat-text.ts`: trimmed; reject empty/whitespace; max 1000 characters
- [X] T025 [P] Implement `MediaState` in `libs/api/domain/src/lib/media-state.ts` with `microphoneEnabled: boolean` and `cameraEnabled: boolean`
- [X] T026 [P] Implement named domain errors in `libs/api/domain/src/lib/errors.ts` (`RoomFullError`, `ServiceAtCapacityError`, `InvalidDisplayNameError`, `InvalidChatTextError`)
- [X] T027 Implement `Participant` entity in `libs/api/domain/src/lib/participant.ts` (UUID id, DisplayName, MediaState, joinedAt, `recentChatSentAt: Date[]` capped at 10)
- [X] T028 Implement `ChatMessage` in `libs/api/domain/src/lib/chat-message.ts` (id UUID, authorId, authorName snapshot, ChatText, sentAt UTC)
- [X] T029 Implement `Room` aggregate in `libs/api/domain/src/lib/room.ts`: `participants.length` in 1..4 while stored; duplicate DisplayNames allowed; distinct ParticipantIds; **do not persist system events**; `addParticipant` / `removeParticipant` / `appendMessage`
- [X] T030 Write failing then passing Vitest tests for DisplayName, ChatText, 4-cap, last-participant removal, and duplicate names in `libs/api/domain/src/lib/*.spec.ts`
- [X] T031 Declare `RoomRegistry` port in `libs/api/application/src/lib/ports/room-registry.port.ts` (`mintRoomId`, `tryJoin` without await between check and mutate, `leave`, `get`, `activeRoomCount`)
- [X] T032 Declare `RoomEventPublisher` port in `libs/api/application/src/lib/ports/room-event-publisher.port.ts` for participant/chat/media/signal broadcasts (no Socket.IO types)
- [X] T033 Implement `MintRoomId` in `libs/api/application/src/lib/mint-room-id.use-case.ts` (nanoid 12; retry if active; optional ceiling pre-check; **must not insert an empty room**)
- [X] T034 Implement `JoinRoom` in `libs/api/application/src/lib/join-room.use-case.ts` (create if absent with ROOM_CEILING; join if present with 4-cap; return iceServers from config; authored chat history only)
- [X] T035 Implement `LeaveRoom` in `libs/api/application/src/lib/leave-room.use-case.ts` (delete aggregate when last participant leaves)
- [X] T036 Implement `SendChatMessage` in `libs/api/application/src/lib/send-chat-message.use-case.ts` (ChatText rules; 10 messages / 10 seconds via `recentChatSentAt`)
- [X] T037 [P] Implement `UpdateMediaState` in `libs/api/application/src/lib/update-media-state.use-case.ts`
- [X] T038 [P] Implement `RelaySignal` in `libs/api/application/src/lib/relay-signal.use-case.ts` (membership check only; do not parse SDP)
- [X] T039 Implement `InMemoryRoomRegistry` in `libs/api/infra-memory/src/lib/in-memory-room-registry.ts` with synchronous `tryJoin`/`leave` critical sections and `activeRoomCount() <= ROOM_CEILING`
- [X] T040 Write failing then passing Vitest tests for atomic last-slot join and ceiling-on-create in `libs/api/application/src/lib/join-room.use-case.spec.ts` using a fake registry
- [X] T041 Validate env with Zod at startup in `apps/api/src/config/env.ts`: `API_HOST`, `API_PORT` default 3000, `ROOM_CEILING` default 50 integer ≥ 1, `STUN_URLS`, `CORS_ORIGINS`, `LOG_LEVEL`; never read `process.env` from domain/application
- [X] T042 Implement HTTP exception filter mapping domain/application errors to `{ code, message }` (Russian `message`, no stacks) in `apps/api/src/http/http-exception.filter.ts`
- [X] T043 Implement `GET /api/health` in `apps/api/src/http/health.controller.ts` returning `{ status: "ok" }`
- [X] T044 Implement `POST /api/rooms` in `apps/api/src/http/rooms.controller.ts` per OpenAPI (`201 { roomId }` / `503 SERVICE_AT_CAPACITY` with «Сервис переполнен. Попробуйте позже.»)
- [X] T045 Serve OpenAPI + Scalar at `/api/docs` from `apps/api/src/main.ts` (Express adapter; global prefix `api`)
- [X] T046 Implement `socketId → participantId` map (never expose socket.id) in `apps/api/src/realtime/socket-participant.map.ts`
- [X] T047 Implement `RoomsGateway` in `apps/api/src/realtime/rooms.gateway.ts`: Zod on inbound events; acks from `libs/contracts/realtime`; `disconnect` → `LeaveRoom`; Socket.IO room `room:{roomId}`; unicast signaling; no domain logic in the gateway
- [X] T048 Wire `AppModule` in `apps/api/src/app.module.ts` (use cases, in-memory registry, HTTP, gateway) and CORS from `CORS_ORIGINS`
- [X] T049 Add Vite proxy in `apps/web/vite.config.ts` for `/api` and `/socket.io` to the API; disable client reconnection in `libs/web/realtime/src/lib/socket-client.ts` (`reconnection: false`)
- [X] T050 Implement room command client (join/leave/chat/media/signal + typed acks) in `libs/web/realtime/src/lib/room-client.ts`
- [X] T051 Implement `SignalingPort` interface in `libs/web/webrtc/src/lib/signaling.port.ts` and Socket.IO adapter in `libs/web/realtime/src/lib/signaling-socket.adapter.ts` (web-webrtc must not import socket.io)
- [X] T052 Add light-theme semantic CSS variables (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`) plus Inter via fontsource in `apps/web/src/app/styles.css` and `libs/web/ui` tokens; structure `.dark` slots but do not ship a dark theme
- [X] T053 Add shadcn primitives (Button, Input, Textarea, Card, Tooltip, Avatar, Badge, Separator, ScrollArea, Alert) plus `cn` (clsx + tailwind-merge) in `libs/web/ui/src/`; Lucide only; no second icon pack
- [X] T054 Implement TanStack Router in `apps/web/src/app/router.tsx` with `/` and `/room/$roomId`; QueryClient for HTTP only; no localStorage
- [X] T055 Implement meeting-session store (`useSyncExternalStore`) in `apps/web/src/features/meeting-session/model/meeting-session.store.ts` with connection-state union; do not put realtime into TanStack Query
- [X] T056 Create empty FSD public APIs: `apps/web/src/pages/start-page.tsx`, `apps/web/src/pages/room-page.tsx`, `apps/web/src/widgets/control-bar/`, `apps/web/src/widgets/video-grid/`, `apps/web/src/widgets/chat-panel/`, `apps/web/src/widgets/participant-list/`
- [X] T057 Document every env var (no secrets) in `.env.example`

**Checkpoint**: Foundation ready — `pnpm nx serve api` health + Scalar work; web shell routes render; user stories can start

---

## Phase 3: User Story 1 - Enter a display name (Priority: P1) 🎯 MVP

**Goal**: User must give a valid display name before any room entry. Invalid names are blocked with Russian hints. Client truncates to 30; server rejects >30 and illegal characters.

**Independent Test**: Open the app, submit empty, over-length, illegal-character, and valid names; only valid names proceed. Duplicate-name distinction is covered under US4 (hidden ParticipantId).

### Implementation for User Story 1

- [X] T058 [US1] Build start name field + client rules (trim; truncate to 30; charset `letters/digits/spaces/hyphens/apostrophes`) in `apps/web/src/features/enter-room/ui/display-name-field.tsx`
- [X] T059 [US1] Show «Введите имя» for empty/whitespace and charset hint «Имя может содержать буквы, цифры, пробелы, дефис и апостроф» in `apps/web/src/features/enter-room/ui/display-name-field.tsx`
- [X] T060 [US1] Hold display name in session memory only (not localStorage) in `apps/web/src/features/enter-room/model/display-name.store.ts`
- [X] T061 [US1] Compose start screen (name + «Создать комнату» disabled until valid) in `apps/web/src/pages/start-page.tsx` using `libs/web/ui` Input/Button
- [X] T062 [US1] Add name gate on `apps/web/src/pages/room-page.tsx` with «Войти» using the same field (invite path); escape name at render (no `dangerouslySetInnerHTML`)

**Checkpoint**: Name validation is independently testable with one user; room create/join may still be stubbed until US2/US4

---

## Phase 4: User Story 2 - Create a room (Priority: P1)

**Goal**: «Создать комнату» mints a unique room id, navigates to `/room/{id}`, and the user becomes the first participant with self-view + empty-room hint.

**Independent Test**: Enter a name, create a room, confirm URL contains the id and the user is alone in the room with copyable invite affordance.

### Implementation for User Story 2

- [X] T063 [US2] Call `POST /api/rooms` via TanStack Query mutation in `apps/web/src/features/enter-room/api/mint-room.ts` using generated `apps/web/src/shared/api/schema.d.ts`
- [X] T064 [US2] On 201, navigate to `/room/$roomId` then `room:join` in `apps/web/src/features/enter-room/model/enter-room.ts`; map `SERVICE_AT_CAPACITY` to «Сервис переполнен. Попробуйте позже.»
- [X] T065 [US2] Show connecting state spinner + «Подключение…» in `apps/web/src/features/enter-room/ui/connecting-indicator.tsx` until join ack, room view, or a named failure (never a blank screen)
- [X] T066 [US2] After join, show self-view PIP + hint «Пока никого нет. Скопируйте ссылку, чтобы пригласить участников.» in `apps/web/src/widgets/video-grid/ui/video-grid.tsx` (local preview may be a placeholder until US6)
- [X] T067 [US2] Integration test mint + first join creates exactly one in-memory room in `apps/api/src/http/rooms.controller.spec.ts` and `apps/api/src/realtime/rooms.gateway.spec.ts`

**Checkpoint**: One user can create and occupy a room

---

## Phase 5: User Story 4 - Join through the link (Priority: P1)

**Goal**: Opening `/room/{id}` with a name joins that room, or creates it if absent (no “not found”). Unrestricted access. Connecting indicator required.

**Independent Test**: Second session opens the URL, enters a name, joins that room; unused id creates a new room; guessed id joins the live room.

### Implementation for User Story 4

- [X] T068 [US4] Parse `roomId` from TanStack Router in `apps/web/src/pages/room-page.tsx` and join via `room:join` after valid name (FR-004/FR-005)
- [X] T069 [US4] Apply join ack: self `participantId` (never shown), roster, authored `messages`, `iceServers` in `apps/web/src/features/meeting-session/model/meeting-session.store.ts`
- [X] T070 [US4] Handle `room:participant-joined` / `room:participant-left` in `libs/web/realtime/src/lib/room-client.ts` updating the store
- [X] T071 [US4] Allow duplicate display names in UI (both visible as the same name; distinguish only by hidden id) in `apps/web/src/entities/participant/ui/participant-name.tsx`
- [X] T072 [US4] Integration test: missing id creates room; existing id joins; two «Алекс» both admitted in `apps/api/src/realtime/rooms.gateway.spec.ts`

**Checkpoint**: Two sessions can share a room by URL (media may still be absent)

---

## Phase 6: User Story 8 - Shared text chat (Priority: P1)

**Goal**: Shared chat with sender name, local `HH:MM` 24-hour, auto-scroll, XSS-safe text, empty rejected, 1000-char and 10/10s limits with hints. Late joiners get authored history only.

**Independent Test**: Two sessions send messages; delivery, timestamp, empty blocked, markup inert, auto-scroll, late joiner sees prior authored messages only.

### Implementation for User Story 8

- [X] T073 [US8] Chat panel (ScrollArea, list, Textarea, send) in `apps/web/src/widgets/chat-panel/ui/chat-panel.tsx` as a secondary column at ≥1024px
- [X] T074 [US8] `chat:send` + `chat:message` handling in `apps/web/src/features/send-chat/model/send-chat.ts`; render `text` as text nodes only in `apps/web/src/entities/chat-message/ui/chat-message.tsx`
- [X] T075 [US8] Format `sentAt` as 24-hour `HH:MM` in the viewer locale clock in `apps/web/src/entities/chat-message/lib/format-time.ts`
- [X] T076 [US8] Block empty/whitespace send; show «Сообщение не длиннее 1000 символов» and «Слишком много сообщений. Подождите немного.» from acks in `apps/web/src/features/send-chat/ui/chat-composer.tsx`
- [X] T077 [US8] Auto-scroll on new message in `apps/web/src/widgets/chat-panel/ui/chat-panel.tsx`; seed history from join ack only (no replayed system events)
- [X] T078 [US8] Integration test chat broadcast, trim/empty reject, 1000-cap, rate limit in `apps/api/src/realtime/chat.gateway.spec.ts`

**Checkpoint**: Chat works without video

---

## Phase 7: User Story 6 - Real-time video and audio (Priority: P1)

**Goal**: Mesh WebRTC between participants; adaptive remote grid; separate self-view; names overlay tiles; mic/camera default on; join without devices with those tracks off; LAN delay target ≤500 ms (manual NFR).

**Independent Test**: Two+ sessions see/hear each other in the grid with name overlays; self-view separate; no-device session still joins.

### Implementation for User Story 6

- [X] T079 [US6] Implement `LocalMedia` acquire/release in `libs/web/media/src/lib/local-media.ts` (`getUserMedia`; default mic+camera on; absent devices → off, still join)
- [X] T080 [US6] Implement `PeerLink` (`RTCPeerConnection`, STUN from join `iceServers`, no TURN) in `libs/web/webrtc/src/lib/peer-link.ts`
- [X] T081 [US6] Implement `MeshCallSession` in `libs/web/webrtc/src/lib/mesh-call-session.ts`: existing peers offer to newcomer; max 3 PCs; `addPeer`/`removePeer`/`dispose`; React must not import this file’s internals
- [X] T082 [US6] Wire session in `apps/web/src/features/meeting-session/model/use-mesh-call.ts` (hook only; no `RTCPeerConnection` in JSX)
- [X] T083 [US6] Remote adaptive grid (1/2/3 remotes; 4th person is self PIP) + name overlay in `apps/web/src/widgets/video-grid/ui/video-grid.tsx` and `apps/web/src/entities/participant/ui/remote-tile.tsx`
- [X] T084 [US6] Self-view PIP in `apps/web/src/entities/participant/ui/self-view.tsx`; camera-off uses silhouette + name (FR-018)
- [X] T085 [US6] Treat entry click as autoplay gesture; if remote audio still blocked show «Включить звук» in `apps/web/src/features/meeting-session/ui/enable-sound-button.tsx`
- [X] T086 [US6] Unit-test mesh add/remove/dispose with mocked `RTCPeerConnection` in `libs/web/webrtc/src/lib/mesh-call-session.spec.ts`

**Checkpoint**: Multi-party call is demonstrable on localhost

---

## Phase 8: User Story 3 - Share the invite link (Priority: P2)

**Goal**: Copy current room URL and show «Ссылка скопирована».

**Independent Test**: In a room, copy control copies the URL and shows confirmation.

### Implementation for User Story 3

- [X] T087 [US3] Copy-link control (Lucide `Copy`, Tooltip, `aria-label`) always on the control bar in `apps/web/src/features/copy-invite-link/ui/copy-invite-button.tsx`
- [X] T088 [US3] Write `window.location.href` to clipboard and show «Ссылка скопирована» in `apps/web/src/features/copy-invite-link/model/copy-invite.ts`

**Checkpoint**: Invite link is copyable without using the address bar

---

## Phase 9: User Story 5 - The four-participant limit (Priority: P2)

**Goal**: Fifth join is refused with «Комната заполнена» and «Повторить вход» for the same `roomId`. Last-slot race admits exactly one.

**Independent Test**: Fill 4, fifth rejected; two concurrent joins for one slot → one in, one full.

### Implementation for User Story 5

- [X] T089 [US5] Map `ROOM_FULL` ack to full-room state (not a blank room) in `apps/web/src/features/enter-room/ui/room-full-state.tsx` with «Комната заполнена» and «Повторить вход» retrying the same id
- [X] T090 [US5] Integration test: 4 joins then 5th `ROOM_FULL`; two overlapping `tryJoin` on 3-occupied room admits one in `libs/api/infra-memory/src/lib/in-memory-room-registry.spec.ts`

**Checkpoint**: Cap is authoritative and visible

---

## Phase 10: User Story 7 - Control the microphone and camera (Priority: P2)

**Goal**: Toggle mic (Must) and camera (Should). Mic off → struck-through icon on tiles. Camera off **stops** the video track (hardware light off) and shows silhouette. Lost device: stream stops; no in-app device picker.

**Independent Test**: Toggle on one session; the other sees mute icon / silhouette; camera light extinguishes when off.

### Implementation for User Story 7

- [X] T091 [US7] Mic/camera icon toggles with Tooltip + `aria-label` in `apps/web/src/widgets/control-bar/ui/control-bar.tsx` using Lucide `Mic`/`MicOff`/`Video`/`VideoOff`
- [X] T092 [US7] Camera off calls `stop()` on the video track and `replaceTrack(null)` in `libs/web/media/src/lib/local-media.ts` and `libs/web/webrtc/src/lib/mesh-call-session.ts`; camera on re-acquires
- [X] T093 [US7] Publish `media:state` and render remote `media:state-changed` as MicOff overlay + silhouette in `apps/web/src/entities/participant/ui/media-indicators.tsx` (state not by color alone)
- [X] T094 [US7] On `ended`/device lost, set that track off with no in-app recovery UI in `libs/web/media/src/lib/local-media.ts`

**Checkpoint**: Privacy toggles match FR-015–FR-020

---

## Phase 11: User Story 9 - Participant list and session events (Priority: P2)

**Goal**: Live roster; live join/leave system chat lines (not replayed to late joiners). No «соединение потеряно».

**Independent Test**: Add/remove sessions; list updates; system messages appear for those present.

### Implementation for User Story 9

- [X] T095 [US9] Participant list widget in `apps/web/src/widgets/participant-list/ui/participant-list.tsx` bound to meeting-session roster
- [X] T096 [US9] Append `chat:system` live as «{name} присоединился к комнате» / «{name} вышел из комнаты» in `apps/web/src/entities/chat-message/ui/system-event.tsx`; do not seed these from join history
- [X] T097 [US9] Server emits system events on join/leave in `apps/api/src/realtime/rooms.gateway.ts` without storing them on `Room`

**Checkpoint**: Roster and live system lines work

---

## Phase 12: User Story 10 - Leaving and the room lifecycle (Priority: P2)

**Goal**: Leave removes the tile and notifies others. Tab close = leave. Reload = new entry (name again). Last leave deletes room + chat. Creator has no extra privileges. Two tabs = two slots.

**Independent Test**: Leave/close/reload as specified; last leave then same URL is a new empty room.

### Implementation for User Story 10

- [X] T098 [US10] Leave control (`PhoneOff`, destructive variant, Tooltip, `aria-label`, **no confirm dialog**) calling `room:leave` then dispose mesh/media and navigate `/` in `apps/web/src/features/leave-room/ui/leave-button.tsx`
- [X] T099 [US10] `beforeunload`/socket disconnect already maps to `LeaveRoom` in `apps/api/src/realtime/rooms.gateway.ts`; client teardown in `apps/web/src/features/meeting-session/model/teardown-session.ts`
- [X] T100 [US10] Integration test: last leave deletes registry entry and chat; same id join is empty in `libs/api/infra-memory/src/lib/in-memory-room-registry.spec.ts`

**Checkpoint**: No phantom tiles; rooms do not leak after last leave

---

## Phase 13: User Story 12 - Device access denial (Priority: P2)

**Goal**: Permission deny shows a clear message; user stays in the room with devices off; others see silhouette / muted mic.

**Independent Test**: Deny prompt on entry; remain in room; chat usable; remote placeholders correct.

### Implementation for User Story 12

- [ ] T101 [US12] Catch `NotAllowedError` in `libs/web/media/src/lib/local-media.ts`, join with media off, show Alert «Нет доступа к камере или микрофону. Вы в комнате, устройства выключены.» in `apps/web/src/features/meeting-session/ui/media-permission-alert.tsx`
- [ ] T102 [US12] Ensure denied/absent camera uses silhouette + name and denied mic uses MicOff in `apps/web/src/entities/participant/ui/remote-tile.tsx`

**Checkpoint**: Denial is not an ejection

---

## Phase 14: User Story 11 - Connection loss handling (Priority: P3)

**Goal**: One drop frees the slot; others continue; chat says left (not «соединение потеряно»); no auto-reconnect; two tabs are two participants.

**Independent Test**: Three sessions; kill one network; tile gone ≤5 s; remaining call+chat continue; return only by entering again.

### Implementation for User Story 11

- [ ] T103 [US11] Confirm client `reconnection: false` and on unexpected socket close while InRoom run FR-035-safe teardown only when **server** is gone; peer drop uses leave path in `apps/web/src/features/meeting-session/model/socket-lifecycle.ts`
- [ ] T104 [US11] On remote leave, `MeshCallSession.removePeer` in `apps/web/src/features/meeting-session/model/use-mesh-call.ts` so remaining links stay up
- [ ] T105 [US11] Document two-tabs-two-slots in `apps/web/src/features/enter-room` (no merge of tabs); integration test disconnect frees slot in `apps/api/src/realtime/rooms.gateway.spec.ts`

**Checkpoint**: Partial failure is isolated

---

## Phase 15: User Story 13 - Environment compatibility and infrastructure errors (Priority: P3)

**Goal**: Distinct Russian states for server unreachable (entry and mid-call), WebRTC unsupported, autoplay, per-tile media failure (not infinite loading). Mid-call server loss: message, tear down PCs, release devices, return to start, no reconnect.

**Independent Test**: Unreachable API, kill API mid-call, old browser stub, blocked autoplay, failed STUN pair — each distinct, no blank screen.

### Implementation for User Story 13

- [ ] T106 [US13] Feature-detect WebRTC before join; show «Ваш браузер не поддерживает WebRTC» in `apps/web/src/features/enter-room/ui/webrtc-unsupported.tsx`
- [ ] T107 [US13] On connect failure show «Не удалось подключиться к серверу» on start in `apps/web/src/features/enter-room/ui/server-error.tsx`
- [ ] T108 [US13] Mid-call server loss: same message, `dispose` mesh, `LocalMedia.stopAll`, navigate `/`, no reconnect in `apps/web/src/features/meeting-session/model/teardown-session.ts`
- [ ] T109 [US13] Peer ICE failed/disconnected-timeout → tile silhouette + «Не удалось подключить медиа» without blocking chat/roster in `apps/web/src/entities/participant/ui/remote-tile.tsx` and `libs/web/webrtc/src/lib/peer-link.ts`
- [ ] T110 [US13] Connecting-media tile must not look like FR-034 failed or infinite load (`connecting | connected | failed`) in `apps/web/src/entities/participant/model/peer-connection-state.ts`

**Checkpoint**: SC-010 failure matrix is specified in UI

---

## Phase 16: Polish & Cross-Cutting Concerns

**Purpose**: Docker, a11y, E2E, quickstart commands. No extra product features.

- [ ] T111 [P] Multi-stage `apps/api/Dockerfile` (Node 22, pnpm, non-root runtime, prune-lockfile if used) with context repository root
- [ ] T112 [P] Multi-stage `apps/web/Dockerfile` (build static → nginx; proxy `/api` and `/socket.io` with websocket upgrade; non-root; SPA fallback)
- [ ] T113 Add root `.dockerignore` excluding `node_modules`, `dist`, `.git`, `.nx`, `.env`, coverage
- [ ] T114 Add `docker-compose.yml` (services `api`+`web`, bridge network, published ports, api healthcheck `GET /api/health`, **no app volumes**, no DB/Redis/TURN)
- [ ] T115 Add root scripts in `package.json`: `compose:up`, `compose:down`, `compose:rebuild`, `compose:logs`, plus nx serve/test shortcuts from quickstart.md
- [ ] T116 Enable `@nx/docker` inferred `docker:build` / `docker:run` for `api` and `web` in `nx.json`
- [ ] T117 Keyboard + visible `focus-visible` on meeting controls; contrast via tokens; icon-only names already required — pass in `apps/web/src/widgets/control-bar/ui/control-bar.tsx` and room page (WCAG 2.2 AA as applicable, desktop ≥1024)
- [ ] T118 Playwright journeys in `apps/web-e2e/src/` with fake media flags: create room, join by link, room full, chat, media toggles, leave (constitution E2E list)
- [ ] T119 XSS e2e: name and chat markup render inert in `apps/web-e2e/src/xss.spec.ts`
- [ ] T120 Run `pnpm nx run-many -t lint,typecheck,test` and execute [quickstart.md](./quickstart.md) locally (serve + compose) without adding unspecified features

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1**: After Phase 2
- **US2**: After US1 (needs name)
- **US4**: After US2 (needs rooms)
- **US8**: After US4 (needs two participants)
- **US6**: After US4 (needs two participants); can proceed in parallel with US8 after US4
- **US3**: After US2 (needs a room URL)
- **US5**: After US4
- **US7**: After US6
- **US9**: After US4 + US8 (roster + chat surface)
- **US10**: After US4
- **US12**: After US6
- **US11**: After US6 + US9 + US10
- **US13**: After US6 + US10
- **Polish**: After all desired stories; Docker can start after Phase 2 but should land last so images include the app

### User Story Dependencies

- **US1 (P1)**: Foundation only
- **US2 (P1)**: US1
- **US4 (P1)**: US2
- **US8 (P1)**: US4
- **US6 (P1)**: US4; parallel with US8
- **US3 (P2)**: US2
- **US5 (P2)**: US4
- **US7 (P2)**: US6
- **US9 (P2)**: US4, US8
- **US10 (P2)**: US4
- **US12 (P2)**: US6
- **US11 (P3)**: US6, US9, US10
- **US13 (P3)**: US6, US10

### Within Each User Story

- Domain/application tests in Phase 2 are written to fail first
- Models/ports before use cases before gateway/UI
- Do not import Nest/Socket/Zod into `libs/api/domain`
- Do not orchestrate `RTCPeerConnection` or Socket.IO inside React components

### Parallel Opportunities

- T003–T004; T008–T016; T021–T026; T037–T038; T111–T112
- After US4: US6 and US8 in parallel
- After US2: US3 in parallel with US4

---

## Parallel Example: User Story 6 + 8 (after US4)

```bash
# Developer A — chat
Task: "Chat panel in apps/web/src/widgets/chat-panel/ui/chat-panel.tsx"
Task: "Send/receive in apps/web/src/features/send-chat/model/send-chat.ts"

# Developer B — media
Task: "LocalMedia in libs/web/media/src/lib/local-media.ts"
Task: "MeshCallSession in libs/web/webrtc/src/lib/mesh-call-session.ts"
```

---

## Implementation Strategy

### MVP First (US1, then US1+US2)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1 (name) — **STOP**: validate Independent Test for US1
4. Phase 4 US2 (create room) — first demoable product increment
5. Continue US4 → US8 and/or US6

### Incremental Delivery

1. Setup + Foundational
2. US1 → US2 → US4 (link join)
3. US8 (chat fallback) and US6 (media)
4. P2: US3, US5, US7, US9, US10, US12
5. P3: US11, US13
6. Polish: Docker + Playwright + quickstart

### Parallel Team Strategy

1. Together: Setup + Foundational
2. Then: A = US1–US5 entry/cap, B = US8–US9 chat/roster, C = US6–US7–US12 media
3. Integrate US10–US13 + Docker

---

## Notes

- [P] = different files, no incomplete-task dependency
- Do not add a database, auth, Redis, TURN, SFU, Zustand, or a second icon library
- Socket.IO client `reconnection: false` is mandatory
- `POST /api/rooms` must not insert a 0-participant room
- Constitution Definition of Done applies at each story checkpoint (`tsc`, boundary lint, cleanup of tracks/PCs/sockets)
- `/speckit-implement` executes this list; it must not tick checkboxes in `checklists/`

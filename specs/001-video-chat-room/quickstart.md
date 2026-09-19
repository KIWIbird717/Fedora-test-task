# Quickstart: Video Chat Room

Validation guide for the local stack after implementation.

Prerequisites: Node.js 22, pnpm 12.4.2 (see root `packageManager`), Docker with Compose v2, Chrome/Firefox/Edge 100+ for media.

## 1. Configure

```bash
cp .env.example .env
```

Required variables are documented in `.env.example` (see `plan.md` Environment variables). This product has **no secrets**. Do not add dummy API keys.

## 2. Install and check the workspace

```bash
pnpm install
pnpm nx graph
pnpm nx run-many -t lint,typecheck,test
```

Expected: tagged projects `api`, `web`, `web-e2e`, and the libraries listed in `plan.md`; boundary lint passes.

## 3. Run services separately (iteration)

```bash
pnpm nx serve api
pnpm nx serve web
```

- API: `http://localhost:3000` (HTTP prefix `/api`, Socket.IO `/socket.io`, Scalar `/api/docs`)
- Web: `http://localhost:5173` with Vite proxy to the API
- Browser must use `localhost` (secure context, NFR-004)

Open Scalar and confirm `GET /api/health` and `POST /api/rooms` match [`contracts/openapi.yaml`](./contracts/openapi.yaml).

## 4. Run the complete application (Compose)

From the repository root, after images exist:

```bash
pnpm compose:up          # docker compose up --build -d
pnpm compose:logs        # docker compose logs -f
pnpm compose:rebuild     # docker compose build --no-cache
pnpm compose:down        # docker compose down
```

Expected: `web` on `WEB_PORT` (default 8080), `api` on `API_PORT` (default 3000, also reached via nginx `/api` and `/socket.io`). No database container. No named volume for application state.

Open `http://localhost:8080`. Media still flows **peer-to-peer**; Compose must not be documented as a media proxy.

## 5. Tests

```bash
pnpm nx run-many -t test
pnpm nx e2e web-e2e
```

Playwright uses fake media devices for camera/mic scenarios. Critical journeys: create room, join by link, room full, chat delivery, media toggles, leave.

## 6. Manual happy path (maps to SC-001 / SC-002)

1. Browser A: start screen → name → «Создать комнату» → room URL changes → self-view + empty-room hint + copy link.
2. Browser B: paste URL → name → «Войти» → both see/hear each other; chat works; roster shows two people.
3. Repeat to 4 participants; 5th sees «Комната заполнена» and retry.
4. Last participant leaves; same URL opens a **new** empty room (no old chat).

Failure checks: deny devices (stay in room), stop API mid-call (return to start, camera light off), unsupported WebRTC message.

Details: [`spec.md`](./spec.md), [`data-model.md`](./data-model.md), [`contracts/realtime.md`](./contracts/realtime.md).

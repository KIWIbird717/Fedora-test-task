# Feature Specification: Video Chat Room

**Feature Branch**: `main` (no dedicated feature branch — the Spec Kit git extension is not installed, so no `before_specify` branch hook ran)

**Created**: 2026-09-19

**Status**: Draft — ready for planning (specification clarifications resolved 2026-09-19; see Clarifications)

**Input**: User description: "Create the complete product specification for this project. The authoritative product requirements are in `docs/prd.md`. Additional technical/design requirements are in `docs/prd-design.mdc`. Project architectural rules are defined in `.specify/memory/constitution.md`. `docs/prd.md` is authoritative for product requirements. Do not invent functionality. Do not remove or weaken requirements. Do not choose implementation technologies during specification. Focus on WHAT and WHY. Preserve functional requirements, non-functional requirements, constraints, user stories, acceptance criteria and non-goals. Identify ambiguities instead of silently assuming. Inspect the repository before generating the specification. Do not implement application code."

**Sources**: `docs/prd.md` (PRD v1.0, authoritative for product requirements) · `docs/prd-design.mdc` (TDD authoring rule) · `.specify/memory/constitution.md` (v1.1.0, architectural governance)

**Language note**: This specification is written in English, per the project's English-language documentation convention. The product's user interface language is Russian only, so user-facing strings mandated by the PRD are preserved verbatim in Russian (for example «Комната заполнена»).

## Overview

A no-registration web application for a group video call with a built-in shared text chat, for **up to 4 participants** in one room at a time. A user opens the application, enters a display name, creates a room and shares an invite link; others join through that link. Inside the room every participant sees and hears the others in real time and can exchange text messages in a shared chat.

**Problem.** Small groups (a team, friends, a candidate and an interviewer) need an instant way to talk face to face directly in a browser — without registration, app installation or complex setup. Existing heavyweight services require accounts and are excessive for a quick four-person call.

**Why this shape.** "Open the link, say who you are, start talking": real-time video and audio, a shared text chat and session events, with no authentication and no server-side history storage.

## Clarifications

### Session 2026-09-19

- Q: When two participants cannot establish a direct connection to each other (traversal helper unavailable, or strict NAT blocking that pair), what should those two participants see? → A: A per-tile error state on the affected participant's tile — silhouette placeholder plus a short message that their media could not connect — while the rest of the call and the chat keep working.
- Q: Should the server cap room creation to keep memory bounded, given there is no authentication? → A: A server-wide ceiling on concurrent rooms; beyond it, creating a new room is refused with a clear message, while existing rooms keep working. No per-client rate limiting.
- Q: What should the connecting state and the alone-in-room state look like? → A: Both explicit — a "connecting…" indicator while entering, and once inside alone, the participant's own self-view plus a hint that nobody else has joined, with the invite link ready to copy.
- Q: What exactly replays in the chat history for a participant who joins mid-conversation? → A: Only the messages participants typed; join and leave system messages are shown live from the moment of joining onward and are not replayed.
- Q: What should happen to participants already in a call when the server becomes unreachable (crash or redeploy)? → A: Treat it as the end of the session — show the server error message, tear down peer connections, release camera and microphone, and return the participant to the start screen.

## User Scenarios & Testing *(mandatory)*

Every user story below is traced to its source story in `docs/prd.md` §3. Acceptance scenarios preserve the PRD's Given/When/Then criteria, including error and edge scenarios.

### User Story 1 - Enter a display name (Priority: P1)

**PRD source**: US-1 · As a participant, I want to state a display name before entering the room, so that other participants recognise me in the call and in the chat.

**Why this priority**: Identity is the precondition for every other journey — no tile label, no chat attribution and no join flow exists without it. It is the first screen the user meets.

**Independent Test**: Open the application, submit names covering the valid, empty, over-length, special-character and duplicate cases, and confirm entry is permitted or blocked with the correct feedback in each case — testable with a single user and no second participant.

**Acceptance Scenarios**:

1. **Given** the user has opened the application, **When** they enter a name and press «Создать комнату» or «Войти», **Then** they enter the room **And** their name is shown to other participants on their video tile and in the chat.
2. **Given** the name field is empty or contains only whitespace, **When** the user attempts to enter, **Then** entry does not happen **And** a hint about the need to enter a name is shown.
3. **Given** the user enters a name longer than 30 characters, **Then** the name is not accepted in that form — it is truncated to 30 characters.
4. **Given** the user enters a name containing a character outside the permitted set (letters, digits, spaces, hyphens, apostrophes), **Then** the name is not accepted **And** a hint explaining the permitted characters is shown.
5. **Given** a participant named «Алекс» is already in the room, **When** another participant enters and also states the name «Алекс», **Then** both are in the room under the name «Алекс» **And** the system distinguishes them by a unique internal identifier that is never shown in the interface.

---

### User Story 2 - Create a room (Priority: P1)

**PRD source**: US-2 · As an initiator, I want to create a new room, so that I can start a call and invite people into it.

**Why this priority**: Room creation is the entry point to the product; nothing can be joined before something can be created.

**Independent Test**: Enter a name, press «Создать комнату», and confirm a unique room identifier appears in the resulting URL and the user is the room's first participant — testable with one user.

**Acceptance Scenarios**:

1. **Given** the user has entered a name on the start screen, **When** they press «Создать комнату», **Then** the system generates a unique room identifier **And** redirects the user to a URL containing that identifier **And** the user becomes the room's first participant.
2. **Given** the user has just created a room and is its only participant, **Then** they see their own self-view together with a hint that no one else has joined yet **And** the invite link is available to copy from that state.

---

### User Story 3 - Share the invite link (Priority: P2)

**PRD source**: US-3 · As an initiator, I want to copy the invite link, so that I can send it to other people by any channel.

**Why this priority**: The link is the only invitation mechanism, but a participant can already invite others by copying the URL from the address bar, so the dedicated copy affordance is a usability improvement on top of a working journey rather than a blocker.

**Independent Test**: From inside a room, press the copy button and confirm the current room URL is on the clipboard and a confirmation is shown — testable with one user.

**Acceptance Scenarios**:

1. **Given** the user is inside a created room, **When** they press the copy-link button, **Then** the current room URL is copied to the clipboard **And** the user sees confirmation that the link was copied.

---

### User Story 4 - Join through the link (Priority: P1)

**PRD source**: US-4 · As an invited participant, I want to open the invite link and enter the room, so that I can join the call.

**Why this priority**: Without joining there is no multi-party call, which is the product's core value.

**Independent Test**: Open a room URL in a second browser session, enter a name, and confirm the participant is connected to that specific room; separately open an unused identifier and a third party's identifier and confirm the defined behaviour — testable with two sessions.

**Acceptance Scenarios**:

1. **Given** the user has opened a URL containing the identifier of an active room, **When** they enter their name and confirm entry, **Then** the system reads the identifier from the URL and connects them to that room **And** they see and hear the other participants.
2. **Given** no room with that identifier exists — it was never created or has been deleted, **When** the user opens the URL with that identifier and enters a name, **Then** the system immediately creates a new room with the same identifier **And** the user enters it as its first participant. There is deliberately no separate "room not found" state — any URL either creates or opens a room.
3. **Given** an active room exists, **When** an unrelated user enters or guesses its identifier and opens the URL, **Then** they join that call — this is intended behaviour, because room access is deliberately unrestricted.
4. **Given** the user has confirmed entry, **When** the connection is still being established, **Then** a progress indicator is shown rather than a blank or unchanging screen **And** the attempt ends either in the room view or in one of the defined failure states.

---

### User Story 5 - The four-participant limit (Priority: P2)

**PRD source**: US-5 · As a participant, I want to be sure the room never holds more than 4 people, so that call quality stays stable.

**Why this priority**: The cap is a hard product and architectural boundary, but the core call works before it is enforced; it becomes mandatory before release because the media topology depends on it.

**Independent Test**: Fill a room with 4 participants, attempt a 5th entry and confirm rejection with the required message and retry affordance; separately drive two simultaneous entries against a single free slot and confirm exactly one succeeds.

**Acceptance Scenarios**:

1. **Given** the room already holds 4 participants, **When** a fifth user attempts to enter, **Then** the system rejects the connection **And** shows the message «Комната заполнена» with a button to retry entry.
2. **Given** the room holds 3 participants, **When** two users attempt to enter simultaneously, **Then** the limit check is performed atomically by the authoritative server-side owner of room state **And** only one of them enters the room, while the second receives «Комната заполнена».

---

### User Story 6 - Real-time video and audio (Priority: P1)

**PRD source**: US-6 · As a participant, I want to see and hear the other participants, so that we can talk face to face.

**Why this priority**: This is the product. Everything else is supporting behaviour around it.

**Independent Test**: Join a room from two or more sessions and confirm each participant's stream is rendered in the grid with a name overlay, own video appears as a separate self-view, devices start enabled, a session without physical devices still joins, and measured media delay on a LAN stays within budget.

**Acceptance Scenarios**:

1. **Given** two or more participants are in the room, **When** the call is active, **Then** video streams are displayed in an adaptive grid (for example 2×2) **And** own video is shown separately as a self-view **And** each participant's name is displayed over their tile.
2. **Given** a user enters the room and has granted device access, **Then** their microphone and camera are enabled by default.
3. **Given** a user physically has no camera and/or microphone, **When** they enter the room, **Then** they still join **And** the absent devices are off for them.
4. **Given** all participants are on the same local network, **When** audio and video are exchanged, **Then** media delay does not exceed 500 ms.

---

### User Story 7 - Control the microphone and camera (Priority: P2)

**PRD source**: US-7 · As a participant, I want to switch my microphone and camera on and off, so that I control what the others hear and see.

**Why this priority**: Privacy control is expected in any call product and the PRD marks the microphone toggle Must and the camera toggle Should, but a call is demonstrable before the toggles exist.

**Independent Test**: With two sessions, toggle the microphone and camera on one side and confirm on the other side that transmission stops, the muted-microphone icon appears, the placeholder replaces the video, and that the local hardware camera indicator goes dark when the camera is switched off.

**Acceptance Scenarios**:

1. **Given** a participant's microphone is on, **When** the participant switches the microphone off, **Then** their audio stops being transmitted to the others **And** a struck-through microphone icon is displayed on their tile.
2. **Given** a participant's camera is on (the camera's hardware indicator light is lit), **When** the participant switches the camera off, **Then** the video track is released, the camera physically stops being used and the indicator light goes out **And** a placeholder with a person silhouette and the participant's name is shown in place of the video.
3. **Given** the selected device became unavailable during the call (unplugged, or taken over by another application), **When** the device is lost, **Then** the corresponding stream stops **And** to restore it the user selects a device in the browser or operating system settings.

---

### User Story 8 - Shared text chat (Priority: P1)

**PRD source**: US-8 · As a participant, I want to send and read messages in a shared chat, so that I can share links and information during the call.

**Why this priority**: The chat is an explicitly required deliverable of equal standing with the call, and it is the fallback channel when audio fails.

**Independent Test**: With two sessions, send messages and confirm real-time delivery with sender name and `HH:MM` timestamp, that empty and whitespace-only sends are refused, that markup payloads render inert, that the view auto-scrolls, and that a session joining later sees earlier messages.

**Acceptance Scenarios**:

1. **Given** a participant is in the room, **When** they enter non-empty text and send the message, **Then** the message appears in the shared chat for all participants in real time **And** contains the sender's name and the time in `HH:MM` format in the client's local time.
2. **Given** the input field is empty or contains only whitespace, **When** the participant attempts to send, **Then** sending does not happen.
3. **Given** a participant sends text containing HTML or JavaScript markup, **When** the message is displayed to the others, **Then** it is escaped and not executed (XSS protection).
4. **Given** the chat holds a message history, **When** a new message arrives, **Then** the chat automatically scrolls to the latest message.
5. **Given** a conversation is already under way in the room, **When** a new participant enters that room, **Then** they see the participant-authored messages sent before they joined, for the lifetime of the room **And** join/leave system messages from before their arrival are not replayed, while subsequent ones appear live.

---

### User Story 9 - Participant list and session events (Priority: P2)

**PRD source**: US-9 · As a participant, I want to see who is currently in the room and when someone joins or leaves, so that I understand the composition of the call at any moment.

**Why this priority**: Session awareness prevents confusion in a multi-party call, but the call itself is usable without an explicit roster.

**Independent Test**: With two or more sessions, add and remove participants and confirm the list updates in real time and the corresponding system messages appear in the chat.

**Acceptance Scenarios**:

1. **Given** a participant is in the room, **When** the room composition changes, **Then** the participant list is updated in real time.
2. **Given** a participant is in the room, **When** another participant enters or leaves the room, **Then** a system message is added to the chat stating that the participant joined or left the room.

---

### User Story 10 - Leaving and the room lifecycle (Priority: P2)

**PRD source**: US-10 · As a participant, I want to leave the room, so that I can end the call without leaving a stale tile behind for the others.

**Why this priority**: Without clean teardown the remaining participants see phantom tiles and rooms accumulate state, which degrades every other journey — but it only becomes observable once joining works.

**Independent Test**: With two sessions, leave explicitly, close the tab and reload, confirming the tile disappears for the other side, the system message appears, a reload requires the name again, and that re-opening the URL after the last participant leaves yields an empty room with no prior history.

**Acceptance Scenarios**:

1. **Given** a participant is in the room, **When** they press the leave button, **Then** they leave the room **And** their tile disappears for the others **And** the others receive a system message about their departure.
2. **Given** a participant is in the room, **When** they close the tab, **Then** this is treated as leaving; **When** they reload the page, **Then** this counts as a new entry, with the name entered again.
3. **Given** one participant remains in the room, **When** they leave or lose their connection, **Then** the room, its identifier and its chat history are deleted completely **And** entering again with the same identifier creates a new, empty room.

---

### User Story 11 - Connection loss handling (Priority: P3)

**PRD source**: US-11 · As a remaining participant, I want the call to continue when someone's connection drops, so that one person's failure does not break the call for everyone.

**Why this priority**: Resilience matters for a credible product but is only exercisable once the multi-party call, the roster and teardown all work, so it is sequenced after them.

**Independent Test**: With three sessions, sever one session's connectivity and confirm its slot is freed, its tile disappears, the remaining call continues uninterrupted, the chat shows a departure message, and no automatic reconnection occurs.

**Acceptance Scenarios**:

1. **Given** several participants are in the room, **When** one of them loses their connection, **Then** their slot is freed and their tile disappears **And** the others continue the call without interruption **And** a system message is added to the chat stating that the participant left. The wording «соединение потеряно» is deliberately not used, because a dropped connection cannot be reliably distinguished from an intentional departure.
2. **Given** a participant dropped out due to a connection loss, **When** they want to return, **Then** they open the link again and enter as a new participant **And** no automatic reconnection is performed.
3. **Given** one user has opened the room in two tabs, **Then** each tab counts as a separate participant and occupies a slot.

---

### User Story 12 - Device access denial (Priority: P2)

**PRD source**: US-12 · As a participant, I want clear feedback when camera or microphone access is refused, so that I understand why I cannot be seen or heard.

**Why this priority**: Permission denial is a common first-run outcome, and mishandling it drops the user out of the product entirely, so it must be handled before release.

**Independent Test**: Deny the browser permission prompt on entry and confirm a clear message is shown, the participant stays in the room with the devices off, and that the other side sees the silhouette placeholder and the muted-microphone icon.

**Acceptance Scenarios**:

1. **Given** a user is entering the room, **When** they reject the camera or microphone access request, **Then** a clear message about the missing access is shown **And** the user remains in the room with the devices switched off, without being ejected from the application.
2. **Given** a participant has no video (camera off, absent, or access not granted), **Then** the others see a person silhouette and their name on their tile **And** if audio is off, a struck-through microphone icon is shown on the tile.

---

### User Story 13 - Environment compatibility and infrastructure errors (Priority: P3)

**PRD source**: US-13 · As a user, I want to understand when something is wrong with my browser or with the server, so that I do not end up staring at a blank screen.

**Why this priority**: These are terminal states outside the happy path; they are required for release quality but cannot be meaningfully verified before the application runs end to end.

**Independent Test**: Run the application against an unreachable server, kill the server mid-call, run it in an environment without real-time media support, and run it under a blocked-autoplay policy, confirming each produces its own explanatory message, that the mid-call case ends the session cleanly, and that none produces a blank screen.

**Acceptance Scenarios**:

1. **Given** the application cannot connect to the server (the signalling server is unreachable), **Then** a clear server error message is shown.
2. **Given** a participant is already in an active call, **When** the server becomes unreachable (crash or redeploy), **Then** the same server error message is shown **And** the peer connections are torn down, the camera and microphone are released and the participant is returned to the start screen **And** no automatic reconnection is attempted.
3. **Given** the user opened the application in a browser without real-time media support or in one that is too old, **Then** a message is shown stating that WebRTC is not supported.
4. **Given** the browser blocks audio autoplay without a user action, **When** a participant enters the room, **Then** the application requests a user gesture (for example the entry action, or an "enable sound" action) **And** after that, remote audio is played.
5. **Given** media with one specific participant cannot be established (the traversal helper is unavailable, or that pair is unreachable under strict NAT), **Then** that participant's tile shows the silhouette placeholder with a short message that their media could not be connected **And** the remaining tiles, the chat and the participant list continue to work **And** the tile does not stay in an indefinite loading state.

---

### Edge Cases

All edge cases below are drawn from `docs/prd.md` and each is covered by an acceptance scenario or requirement above.

**Name and identity**

- Empty or whitespace-only name → entry blocked with a hint (FR-001, US-1).
- Name longer than 30 characters → truncated to 30 (FR-038).
- Name containing a character outside the allowlist (letters, digits, space, hyphen, apostrophe) → rejected with a hint explaining what is permitted (FR-038).
- Two participants choosing the same display name in one room → both allowed, distinguished by a hidden internal identifier (FR-030).
- Name or message containing HTML/JavaScript markup → rendered as inert text (FR-039).

**Rooms and capacity**

- URL with an identifier that never existed, or belonged to a deleted room → a new room with that identifier is created instantly; no "not found" state (FR-005).
- A stranger guessing an active room identifier → admitted; access is deliberately unrestricted (FR-006).
- A 5th entry attempt → rejected with «Комната заполнена» and a retry button (FR-008).
- Two users racing for the last free slot → the capacity check is atomic; exactly one is admitted (FR-007).
- The last participant leaving → room, identifier and chat history are destroyed; the same URL later yields a new empty room (FR-009).
- The server-wide ceiling on concurrent rooms reached → creating a further room is refused with a "service at capacity" message; joining existing rooms is unaffected (FR-041).

**Devices and media**

- No physical camera and/or microphone → the user still joins with those devices off (FR-014).
- Browser permission denied → clear message, user stays in the room with devices off (FR-033).
- Device disappears mid-call (unplugged or captured by another application) → that stream stops; recovery happens through browser/OS settings (FR-020).
- Camera switched off → the video track is released so the hardware indicator goes dark, not merely muted (FR-019).
- A participant with no video at all → silhouette placeholder with their name on their tile for everyone else (FR-018).

**Transitional and empty states**

- Entry confirmed but the connection not yet established → a progress indicator is shown; the attempt always resolves into the room view or a defined failure state, never a blank screen (FR-042).
- Sole participant in a room → self-view plus a hint that nobody else has joined, with the invite link copyable from that state (FR-043).

**Session lifecycle**

- Tab closed → treated as leaving (FR-028).
- Page reloaded → treated as a brand-new entry, with the name re-entered, because nothing is persisted on the client (FR-028, NFR-005).
- Same user in two tabs → two independent participants, two slots consumed (FR-029).
- Connection dropped → the participant is removed from call and chat, the slot is freed, the others continue, and the chat reports a departure without using "connection lost" wording; there is no automatic reconnection (FR-031).

**Chat**

- Empty or whitespace-only message → sending refused (FR-024).
- Message longer than 1000 characters, or an 11th message within 10 seconds → sending prevented with a hint stating why; the message is not silently dropped (FR-040).
- New message arriving → the chat auto-scrolls to the latest message (FR-023).
- Participant joining mid-conversation → earlier participant-authored messages of the room's lifetime are visible; earlier join/leave system events are not replayed (FR-023).

**Environment and infrastructure**

- Signalling server unreachable at entry → a clear server error message (FR-035).
- Server lost mid-call (crash or redeploy) → the session ends: server error message, peer connections torn down, camera and microphone released, participant returned to the start screen, no automatic reconnection (FR-035).
- Browser without real-time media support, or too old → an explicit unsupported message (FR-036).
- Autoplay policy blocking remote audio → the application secures a user gesture, after which remote audio plays (FR-037).
- Network-traversal helper (STUN) unavailable → the application must not end up in an unusable state; affected tiles show the placeholder plus a "media could not connect" message (FR-034).
- A single participant pair unreachable because of strict NAT → acceptable; scoped to that pair, shown as a per-tile error state rather than an indefinite loading tile, with the rest of the room unaffected (FR-034).

## Requirements *(mandatory)*

Requirement numbering is 1:1 with the numbered functional requirements in `docs/prd.md` §4, so `FR-0NN` corresponds to PRD item `NN`. The parenthesised `F-NN` identifiers are the traceability IDs the PRD carries from the source test assignment. Priorities preserve the PRD's **Must** / **Should** designation.

### Functional Requirements

**Entry, rooms and lifecycle**

- **FR-001** (F-01, Must): The system MUST ask for a display name before room entry and MUST show that name to the other participants.
- **FR-002** (F-02, Must): On «Создать комнату» the system MUST generate a unique room identifier and redirect the user to a URL containing it; that URL serves as the invite link.
- **FR-003** (F-03, Must): The system MUST let a participant copy the invite link (the current room URL) and MUST confirm visibly that it was copied.
- **FR-004** (F-04, Must): When a URL containing a room identifier is opened, the system MUST read the identifier from the URL and connect the user to that room once a name has been entered.
- **FR-005** (Must): If no room with the given identifier exists, the system MUST immediately create a new room with that identifier and make the user its first participant. A separate "room not found" state MUST NOT exist.
- **FR-006** (Must): Entering an existing room with a guessed or third-party identifier MUST be permitted and treated as intended behaviour — room access is not restricted, because there is no authentication.
- **FR-007** (F-05, Must): The system MUST limit a room to 4 simultaneous participants, and the "no more than 4" check MUST be performed atomically by the authoritative owner of room state, so that simultaneous connections cannot exceed the limit.
- **FR-008** (Must): The system MUST refuse the 5th connection with the message «Комната заполнена» and a button to retry entry.
- **FR-009** (Must): A room MUST be retained while at least one participant is present; when the last participant leaves or drops, the room, its identifier and its chat history MUST be deleted completely. Entering again with the same identifier MUST create a new, empty room.

**Video and audio**

- **FR-010** (F-06, Must): The system MUST transmit each participant's camera video and microphone audio to the other participants in real time.
- **FR-011** (F-07, Must): The system MUST display the streams in an adaptive grid of 1–4 tiles (for example 2×2) and MUST show the participant's own video separately as a self-view.
- **FR-012** (F-08, Must): The system MUST display each participant's name as an overlay over their tile.
- **FR-013** (Must): On entering a room, a participant's microphone and camera MUST be enabled by default.
- **FR-014** (Must): If a camera or microphone is physically absent, the user MUST still enter the room, with the corresponding devices switched off for them.

**Microphone, camera and state indication**

- **FR-015** (F-09, Must): The system MUST let a participant switch the microphone on and off, and MUST show its status to the other participants.
- **FR-016** (Must): While a participant's microphone is off, a struck-through microphone icon MUST be displayed on their tile.
- **FR-017** (F-10, Should): The system SHOULD let a participant switch the camera on and off.
- **FR-018** (Must): When a camera is switched off, absent or unavailable, a placeholder with a person silhouette and the participant's name MUST be displayed in place of the video.
- **FR-019** (Must): Switching the camera off MUST release the video track — the camera physically stops being used and its hardware indicator light goes out — and switching it on MUST re-acquire the track.
- **FR-020** (Must): When the selected device is lost during a call, the corresponding stream MUST stop; recovery is performed by the user selecting a device in browser or operating-system settings, and the application is not required to offer in-app recovery.

**Text chat**

- **FR-021** (F-12, Must): The system MUST let participants send messages to a shared chat, visible to all participants in real time.
- **FR-022** (F-13, Must): For every message the system MUST show the sender's name and the time in `HH:MM` format in the client's local time.
- **FR-023** (F-14, Must): The system MUST display the current session's message history and MUST auto-scroll the chat to the newest message. A participant who joins later MUST see the participant-authored messages sent in the room before they joined, for the lifetime of the room. System join and leave events MUST NOT be replayed to a later joiner — they are shown live from the moment of joining onward (see FR-025), because they describe a room composition the newcomer never observed and the participant list already conveys who is present.
- **FR-024** (Must): The system MUST refuse to send an empty message or a message consisting only of whitespace.
- **FR-025** (F-15, Should): The system SHOULD add system messages to the chat when participants join and leave.

**Session and participants**

- **FR-026** (F-16, Must): The system MUST display an up-to-date participant list and MUST update it in real time.
- **FR-027** (F-17, Must): The system MUST let a participant leave the room: their tile disappears for the others, and the others receive a system message about the departure.
- **FR-028** (Must): Closing the tab MUST be treated as leaving; reloading the page MUST count as a new entry, with the display name entered again.
- **FR-029** (Must): One user MAY be present in a room in several tabs simultaneously; each tab is a separate participant and occupies a slot.
- **FR-030** (Must): Each participant MUST be assigned an automatically generated unique internal identifier that does not collide with others and is never displayed in the interface; identical display names within one room MUST be permitted.
- **FR-031** (F-18, Must): On a connection loss, the participant MUST be removed from the call and the chat, their slot MUST be freed and the others MUST continue the call; a system message MUST be added to the chat stating that the participant left. The wording «соединение потеряно» MUST NOT be used. Automatic reconnection MUST NOT be performed — returning happens only by entering again.
- **FR-032** (Must): The room creator MUST have no special privileges; all participants are equal.

**Environment, compatibility and infrastructure errors**

- **FR-033** (Must): When the browser refuses camera or microphone access, the system MUST show a clear message, and the user MUST remain in the room with those devices switched off rather than being ejected.
- **FR-034** (Should): The system SHOULD react correctly to the unavailability of the network-traversal helper service (public STUN, per `docs/prd.md` §7) without ending up in an unusable state. When media with a specific participant cannot be established for any reason — traversal helper unavailable, or a pair unreachable under strict NAT — the failure MUST stay scoped to that pair: the affected participant's tile MUST show the silhouette placeholder together with a short message that their media could not be connected, while the remaining tiles, the chat and the participant list continue to work. The tile MUST NOT remain in an indefinite loading state.
- **FR-035** (Must): If the connection to the server cannot be established (the signalling server is unreachable), the system MUST show a clear server error message. If the server becomes unreachable while the participant is already in a call, the session MUST be ended rather than left half-working: the system MUST show the same server error message, tear down the peer connections, release the camera and microphone, and return the participant to the start screen. Media MUST NOT be left flowing while chat, the participant list and new joins are silently inoperative, and no automatic reconnection MUST be attempted — the participant returns by entering again (consistent with FR-031).
- **FR-036** (Must): If the browser does not support WebRTC or is too old, the system MUST show a message stating that WebRTC is not supported.
- **FR-037** (Must): The system MUST accommodate browser autoplay policies: because playing remote audio and video may require a user gesture, the application MUST provide such a gesture (for example the entry action, or an "enable sound" action), after which remote audio is played.

**Validation and security**

- **FR-038** (Must): The system MUST limit a participant's display name to 30 characters, MUST accept only letters (Cyrillic and Latin), digits, spaces, hyphens and apostrophes, and MUST reject any other character with a visible hint explaining what is allowed, so that injections are excluded. Accepted names MUST still be escaped at render time (see FR-039) — the character allowlist is a validation rule, not a substitute for escaping. Length and character rules MUST both be enforced authoritatively on the server; client-side checks are a usability affordance only.
- **FR-039** (Must): The system MUST filter or escape participant names and message text to protect against XSS when they are rendered in tile overlays and in the chat.
- **FR-040** (Should): The system SHOULD limit a chat message to 1000 characters and SHOULD limit a participant to 10 messages per 10 seconds; on exceeding either limit, sending MUST be prevented with a hint stating why, rather than failing silently or dropping the message. Empty and whitespace-only messages MUST be rejected in all cases (see FR-024).

**Service capacity and transitional states** *(added during clarification; not present in `docs/prd.md`)*

- **FR-041** (Must): The system MUST enforce a configured server-wide ceiling on the number of rooms that exist at once, so that memory stays bounded without authentication. When the ceiling is reached, an attempt to create a new room MUST be refused with a clear message explaining that the service is at capacity, while all existing rooms continue to work unaffected. Joining an already-existing room MUST NOT be refused by this ceiling. Per-client rate limiting is deliberately not required.
- **FR-042** (Must): The system MUST show an explicit progress indicator between the moment a participant confirms entry and the moment the room view is ready, and MUST NOT leave the user on a blank or unchanging screen during that transition. Every entry attempt MUST end in one of three defined states: the room view, or one of the specified failure states (room full, service at capacity, device access denied, server unreachable, real-time media unsupported).
- **FR-043** (Must): While a participant is the only one in a room, the system MUST show their own self-view together with a hint that no one else has joined yet, and MUST make the invite link available to copy from that state (see FR-003). An empty room MUST NOT appear indistinguishable from a broken one.

### Requirements Traceability

The PRD carries traceability identifiers `F-01` … `F-18` from the source test assignment. This specification covers `F-01`–`F-10` and `F-12`–`F-18`. **`F-11` is absent from `docs/prd.md`** and therefore absent here.

**Resolved**: `F-11` is treated as deliberately superseded by the Non-Goals in `docs/prd.md` §5 — the likely subject being in-application camera and microphone device selection, which §5 explicitly places out of scope. The gap is recorded here for audit purposes and introduces no requirement. The source document (`Fora_Soft_PRD_final.md`) is not present in this repository, so this mapping cannot be verified from the repository alone; should that document be added later, `F-11` should be re-checked against it.

### Non-Functional Requirements

Sourced from `docs/prd.md` §2 (goal 7), §6 and §7.

- **NFR-001** (Must): Media delay MUST NOT exceed 500 ms when all participants are on the same local network. No bitrate ceiling is specified.
- **NFR-002** (Must): The application MUST work in current desktop browsers — Chrome, Firefox and Edge version 100 and above.
- **NFR-003** (Must): The layout MUST work correctly at viewport widths from 1024px upward, and the video grid MUST rearrange itself for 1, 2, 3 and 4 participants.
- **NFR-004** (Must): The application MUST be served in a secure context, because camera and microphone capture is only available there (HTTPS, or localhost during development).
- **NFR-005** (Must): No client-side state MUST be retained between page reloads or restarts — neither the display name nor anything else.
- **NFR-006** (Must): Room, participant and chat state MUST live only in server memory for the lifetime of the room; no persistent storage MUST be introduced. Because that memory is unauthenticated and unbounded by default, total memory MUST stay bounded by the room ceiling of FR-041 and by the per-message and per-participant limits of FR-040.
- **NFR-007** (Must): The interface language MUST be Russian only, with no internationalisation.
- **NFR-008** (Should): Visual design is assessed as "it works and it is comprehensible" rather than aesthetically; readability and obviousness of controls take priority.

### Constraints *(inherited — not chosen by this specification)*

Recorded for traceability only. `docs/prd.md` §7 fixes these as product-level constraints originating in the test assignment, and per the constitution's precedence order the PRD outranks downstream documents. This specification neither selects nor extends them; how they are realised is owned by the design and planning stage.

- **C-001**: Mandatory stack from the test assignment §6.1 — JavaScript (ES6+), Node.js on the server, React for the UI, Socket.io for signalling and the text chat, WebRTC for video and audio transport.
- **C-002**: Media topology is WebRTC mesh (peer-to-peer): every participant holds a direct connection to every other, i.e. N·(N−1)/2 connections, which is 6 connections per room at 4 participants. **This is the stated reason the participant limit is fixed at 4** (FR-007).
- **C-003**: A Socket.io signalling server exchanges session-negotiation messages and ICE candidates between clients, serves the text chat and system events, and atomically enforces the four-participant limit.
- **C-004**: NAT traversal uses public Google STUN (`stun.l.google.com`). No TURN server is used; an individual unreachable peer pair caused by strict NAT is acceptable and its handling is left to the implementer.
- **C-005**: Room and participant state lives in server memory — no database and no persistent store; nothing is retained on the client between reloads.
- **C-006**: A participant's internal identifier is generated automatically (for example a socket id or UUID), is unique within the room, and is never displayed in the UI.
- **C-007**: The reference demo at `https://chat.forasoft.com` is a reference for **features and UX only, not for media architecture**. `docs/prd.md` §7 records that the demo is actually built on a media server (LiveKit/SFU) and deliberately rejects that approach in favour of the assignment's plain mesh WebRTC stack.
- **C-008**: `.specify/memory/constitution.md` v1.1.0 imposes further binding architectural and stack constraints (Nx monorepo with `apps/web` and `apps/api`, hexagonal backend with pragmatic DDD, Feature-Sliced frontend, strict TypeScript, boundary validation, generated contracts, Tailwind-first styling, no database, no authentication). Those are governance constraints on the design and implementation, not product requirements, and they are honoured at the planning stage.

### Key Entities

- **Room**: a call space identified by a unique identifier that appears in its URL. Holds at most 4 participants, owns the chat history for its lifetime, is created implicitly by the first entrant with a given identifier, and ceases to exist — identifier and history included — when the last participant leaves.
- **Participant**: one browser session inside a room. Carries a display name (up to 30 characters, not unique) and a hidden internal identifier that is unique within the room, plus the current state of its microphone and camera. Two tabs of the same person are two distinct participants. No participant holds privileges over another.
- **Display Name**: the human-readable label a participant chooses before entry, shown on their video tile and against their chat messages. Length-limited and sanitised; not an identity, not persisted.
- **Media State**: for each participant, whether the microphone and camera are currently on, and whether each device is absent or access to it was refused. Visible to all participants through tile indicators, since it determines what the others see and hear.
- **Chat Message**: a text message authored by a participant, carrying the sender's display name, the message text and the time shown as `HH:MM` in the viewer's local time. Lives only as long as the room.
- **System Event**: a chat entry generated by the system, not by a participant, announcing that someone joined or left the room. Delivered live to whoever is present at the time and not part of the history replayed to later joiners, which distinguishes it from a Chat Message.
- **Invite Link**: the room's URL. The only mechanism for inviting others, and deliberately the only credential needed to enter.

## Out of Scope (Non-Goals)

Preserved from `docs/prd.md` §5. These are **deliberately excluded** from this version. Implementing any of them counts as unspecified functionality.

- **Authentication and authorisation.** A display name is sufficient; there are no accounts, passwords or roles, and access to a room by identifier is not restricted.
- **Any client-side state retention.** The display name and any other information are not remembered across reloads or restarts (no local storage or equivalent).
- **Persistent server-side message storage.** Chat history exists only for the room's lifetime and disappears with it.
- **Automatic reconnection.** A participant who drops out returns only by entering manually.
- **Active-speaker indication.**
- **Moderator or creator privileges** (muting someone else's microphone, removing a participant). All participants are equal.
- **Built-in device selection** for camera and microphone is not required; changing a device happens through browser or operating-system settings.
- **A TURN server.** Public STUN is sufficient for local and office environments; an individual unreachable pair caused by strict NAT is acceptable.
- **Quality and bitrate normalisation.** No bitrate ceiling is set.
- **Sounds** for joining, leaving and new messages.
- **Internationalisation.** The interface is Russian only.
- **Mobile adaptation.** Target screens are desktop from 1024px.
- **More than 4 participants**, webinar-style rooms, a lobby or waiting room, and breakout rooms.
- **Screen sharing, call recording, virtual backgrounds, reactions and emoji.**
- **Extended chat**: files and images, editing and deleting messages, private messages, message reactions.
- **End-to-end encryption** beyond the DTLS-SRTP that the real-time media transport provides by default.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from opening the application to being present in a room with their camera and microphone live, without any registration step, in under 30 seconds.
- **SC-002**: An invited person can go from receiving a link to being present in the same room in under 20 seconds, entering nothing but a display name.
- **SC-003**: With 4 participants on one local network, every participant sees and hears every other participant, and the media delay measured between them stays within 500 ms.
- **SC-004**: A room admits at most 4 participants in 100% of attempts, including repeated trials where two entrants race for a single free slot — a 5th participant is never present.
- **SC-005**: A message sent by any participant is visible to all other participants within 1 second on a local network, showing the correct sender name and `HH:MM` time.
- **SC-006**: A participant joining a room that already has a conversation sees every participant-authored message sent earlier in that room's lifetime, with no gaps and no replayed join/leave notices.
- **SC-007**: When a participant leaves, closes their tab or loses connectivity, their tile disappears for everyone else within 5 seconds, the remaining participants' call continues without interruption, and the chat reports the departure.
- **SC-008**: Switching the camera off extinguishes the device's hardware indicator light in 100% of checks, and switching it back on restores video for the other participants.
- **SC-009**: After the last participant leaves, re-opening the same room URL yields an empty room containing none of the previous conversation, in 100% of checks.
- **SC-010**: Each of the defined failure conditions — room full, device access denied, server unreachable, browser unable to support real-time media, audio playback blocked until the user acts, media with one participant not connectable — produces its own distinct, actionable Russian-language message, and none of them results in a blank screen, an indefinite loading state or an unrecoverable state.
- **SC-011**: Every attempt to inject HTML or JavaScript through a display name or a chat message renders as inert text, with nothing executed, in 100% of attempts.
- **SC-012**: At a 1024px viewport width, every control (microphone, camera, leave, copy link, chat input) is reachable and legible without horizontal scrolling, for 1, 2, 3 and 4 participants.
- **SC-013**: A participant whose camera and microphone are absent, or whose access was refused, still completes entry to the room and remains able to use the chat, in 100% of attempts.
- **SC-014**: With the configured room ceiling reached, every further room-creation attempt is refused with a clear "service at capacity" message, and every already-running room continues without interruption or data loss.
- **SC-015**: In 100% of entry attempts, the user sees either progress feedback, the room view, or a named failure state — never a blank or unchanging screen — and a participant alone in a room can tell from the screen that the room works and how to invite others.
- **SC-016**: When the server is stopped mid-call, every participant is informed and returned to the start screen with their camera and microphone released — verifiable by the camera's hardware indicator going dark — in 100% of trials, with no participant left in a room whose chat and participant list no longer function.

## Assumptions

Reasonable defaults recorded where `docs/prd.md` leaves a detail open. Items the PRD explicitly delegates to the implementer are marked as such. None of these adds functionality beyond the PRD.

- **A-001**: The room identifier is an opaque, automatically generated, URL-safe value. The PRD fixes neither its format nor its length; because it deliberately doubles as the only access credential yet the PRD equally deliberately accepts guessed entry (FR-006), the length is treated as a usability choice for the design stage rather than a security control.
- **A-002**: "Real time" for the chat and the participant list is assumed to mean sub-second delivery on a local network, as reflected in SC-005; the PRD states no numeric target for either.
- **A-003**: Media delay in NFR-001 is assumed to be measured as glass-to-glass latency between two participants on the same local network, since the PRD names the 500 ms budget without defining the measurement method.
- **A-004**: The retry button shown with «Комната заполнена» is assumed to re-attempt entry into the same room, not to create a new one.
- **A-005**: Resolved during clarification and now stated in FR-023 — a later joiner receives the participant-authored messages from earlier in the room's lifetime, and system join/leave events are shown live from the moment of joining rather than replayed.
- **A-006**: Display names are assumed not to be reserved or deduplicated in any way, since FR-030 explicitly permits duplicates.
- **A-007**: Timestamps are assumed to be rendered from the viewing client's own locale and clock, per FR-022, so two participants in different time zones may legitimately see different `HH:MM` values for the same message.
- **A-008**: Participants are assumed to be on reasonably capable desktop machines and networks, since mesh topology (C-002) means each client sends its stream to every other participant. The PRD sets no minimum bandwidth or hardware requirement and explicitly declines to normalise bitrate.
- **A-009**: The PRD delegates the message length limit and flood protection to the implementer (§4 item 40). Concrete, testable values were agreed during specification and are now stated in FR-040 (1000 characters, 10 messages per 10 seconds). The user-visible handling of an unreachable peer pair and of traversal-helper unavailability was also agreed during clarification and is now stated in FR-034; what remains delegated to the implementer is only the technical means of detecting those conditions.
- **A-011**: The display-name character allowlist in FR-038 (letters, digits, space, hyphen, apostrophe) was agreed during specification to resolve the PRD's "forbidden or escaped" ambiguity. It is assumed to be sufficient for Russian and Latin-script names; names requiring other scripts or punctuation are out of scope, consistent with the Russian-only interface (NFR-007).
- **A-010**: No feature flags, staged rollout, analytics, monitoring or migration concerns are assumed, as the PRD describes a greenfield application with no existing users or data.
- **A-012**: The numeric value of the room ceiling in FR-041 is a deployment configuration parameter, not a product decision; the planning stage selects a default and validates it at startup. The requirement is the mechanism and the user-visible refusal behaviour, not a specific number.

## Dependencies

- **D-001**: `docs/prd.md` v1.0 is authoritative for every product requirement in this specification. Any change there supersedes this document.
- **D-002**: `Fora_Soft_PRD_final.md`, the source test assignment that `docs/prd.md` derives from and whose `F-NN` identifiers it cites, is **not present in this repository**. Traceability to the original assignment therefore cannot be verified from the repository alone — this is the root of the `F-11` gap noted under Requirements Traceability.
- **D-003**: A secure context is required at runtime for camera and microphone capture (NFR-004), so hosting must terminate HTTPS or the application must be reached over localhost.
- **D-004**: A publicly reachable network-traversal helper (public STUN, C-004) is an external dependency outside the team's control; FR-034 requires graceful behaviour when it is unavailable.
- **D-005**: `docs/prd-design.mdc` governs the authoring of the downstream Technical Design Document, including its 14 mandatory sections and its own output path convention. Its relationship to this Spec Kit feature's `plan.md` needs to be settled before planning — see the note below.

## Notes for the Planning Stage

Recorded here because they concern process rather than product, and so do not belong in the requirements above.

- `docs/prd-design.mdc` prescribes saving the Technical Design Document to `/prds/[feature-name]/design-[feature-name].md`, while Spec Kit produces `specs/001-video-chat-room/plan.md`, and the constitution repeatedly requires that the library set "MUST be derived from the approved TDD" without identifying which document is the TDD. Whether `plan.md` *is* the TDD, or whether a separate document under `prds/` precedes it, should be decided before `/speckit-plan` runs.
- The repository currently contains no application code, no Nx projects, no `packages:` globs in `pnpm-workspace.yaml`, and no TypeScript, lint, formatting or test configuration, while the constitution mandates strict `tsc`, Nx tags and dependency-constraint lint rules as build-failing gates. Establishing that workspace foundation is implementation work for the plan and tasks stages, not a product requirement.

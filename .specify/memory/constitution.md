<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0 (styling principles added; no existing principle modified)
Modified principles: none — Principles I–XII are unchanged
Added sections:
  - XIII. Tailwind-First Styling
  - XIV. Design Tokens Over Arbitrary Values
  - XV. Component Styling and Variants
  - XVI. Accessible and Intentional Responsive Behavior
Extended in place (additive only):
  - Technology Stack & Platform Constraints → Tailwind CSS added to the fixed frontend stack
  - Development Workflow & Quality Gates → one Definition of Done item, anti-pattern list entries
Removed sections: none
Templates requiring review: plan-template.md, spec-template.md, tasks-template.md read this
  constitution at runtime; no edits made by this command.
Follow-up TODOs: none
Note: PRD Non-Goals exclude mobile adaptation (target is desktop ≥1024px). Principle XVI adopts
  mobile-first as an authoring convention only; it does not add mobile layouts to scope.
-->

# Fedora Meetings Constitution

This constitution governs the video chat room application (`video-chat-room`), a production-quality
web application built as an Nx monorepo. It is the decision-making framework for every human and AI
contributor when creating files, modules, dependencies, APIs, domain logic, tests and
infrastructure. MUST / MUST NOT are non-negotiable. SHOULD / SHOULD NOT are strong defaults that
require a written justification in the plan or PR description when not followed.

## Core Principles

### I. Nx Boundaries Enforce Architecture

The repository MUST be organized as Nx applications plus purpose-scoped libraries, not one source
tree. Applications (`apps/web`, `apps/api`) MUST contain only composition, wiring and runtime entry
points; all reusable domain, application, infrastructure, UI and utility code MUST live in
libraries. The concrete library set MUST be derived from the approved TDD, never generated
mechanically.

Every library MUST declare Nx tags and MUST expose a deliberate public entry point. Consumers MUST
import only through that entry point; deep imports into another library's internal files, relative
path escapes and `tsconfig` path hacks that bypass module boundaries are forbidden. Circular
dependencies between projects MUST NOT be introduced. Architectural layering MUST be expressed as
Nx dependency constraints in lint configuration so violations fail CI rather than code review.

A generic catch-all `shared` library is forbidden; shared code MUST be split by explicit
responsibility (for example contracts, validation schemas, UI kit) and MUST be domain-neutral when
it sits in a low-level layer.

**Rationale**: Boundaries that are only documented decay; boundaries that fail the build hold.

### II. Dependencies Point Inward

The backend dependency direction MUST be Presentation → Application → Domain. Infrastructure MAY
implement ports declared by Application or Domain, and MUST NOT be depended on by them.

The domain layer MUST NOT import NestJS, Socket.IO, HTTP or WebSocket transport types, Zod, Scalar,
database or ORM clients, the filesystem, `process.env`, external API clients, or framework
decorators. The application layer MUST NOT contain infrastructure implementation details. Business
logic MUST remain runnable without any framework present.

Frontend dependency direction follows Feature-Sliced Design: `app` → `pages` → `widgets` →
`features` → `entities` → `shared`. A lower layer MUST NOT import from a higher one, and
cross-imports between sibling slices of the same layer MUST NOT be used to share business behavior.

**Rationale**: Stable business rules must outlive the frameworks and transports around them.

### III. Pragmatic Domain-Driven Design

DDD tactical patterns MUST be used for meaningful business concepts (room, participant, membership
limit, chat message, media state) and MUST NOT be applied to trivial data movement.

Domain objects MUST encapsulate their invariants: value objects MUST validate on construction and
be immutable; entities MUST have stable identity, protect invariants and expose intentional
behavior instead of arbitrary public setters; aggregates MUST be introduced only where a real
consistency boundary exists. Mutable internal state MUST NOT be exposed to callers. Domain failures
MUST be modeled as explicit, named domain errors, never as bare `Error` or boolean flags.

Anemic data containers are acceptable only where no meaningful behavior exists. Generic base
abstractions (`BaseEntity`, `BaseRepository`, `BaseService`, `BaseController`, `GenericUseCase`,
`GenericMapper`) MUST NOT be created unless they resolve a demonstrated, repeated problem.

**Rationale**: Invariants enforced in one place cannot be bypassed by a new caller.

### IV. Ports and Adapters

Contracts required by the core MUST be declared as ports owned by the domain or application layer.
Infrastructure and presentation code MUST implement or consume those ports, never the reverse.

Inbound adapters (HTTP controllers, Socket.IO gateways) translate transport input into use case
input. Outbound adapters (repositories, in-memory state stores, event publishers, external clients)
implement outbound ports. The core MUST depend on the port abstraction; concrete adapter classes
MUST NOT be imported by domain or application code. NestJS dependency injection MUST be used at
composition boundaries (modules) rather than as a domain construct.

**Rationale**: Swappable edges keep the core testable without infrastructure.

### V. Use Cases Own Orchestration

Each application use case MUST accept explicit input, check application-level preconditions, load
domain objects through ports, invoke domain behavior, coordinate outbound ports, and return an
explicit result type.

A use case MUST NOT know how it was invoked — HTTP, Socket.IO, CLI or test MUST be
indistinguishable from inside it. Transport concerns (status codes, socket rooms, headers, event
names) MUST NOT appear in the application layer. Controllers and gateways MUST remain thin adapters
containing no business rules. Provider classes that accumulate unrelated operations ("god
services") MUST NOT be created; prefer cohesive, narrowly-scoped use cases.

**Rationale**: One orchestration path per operation, reusable across every transport.

### VI. Validate at Boundaries, Enforce Invariants in the Domain

All external input MUST be treated as untrusted and validated at the system boundary with Zod: HTTP
bodies, query and route params, Socket.IO event payloads, configuration/environment variables, and
external API responses where applicable.

Three concerns MUST remain separate and MUST NOT be collapsed into each other:
transport validation (shape and type of untrusted input), application validation (preconditions and
authorization of an operation), domain invariants (rules that make a domain object valid).
The same rule MUST NOT be duplicated across all three layers. The domain MUST remain free of Zod.

Environment configuration MUST be validated at startup and exposed as typed configuration;
`process.env` MUST NOT be read from business logic. Client-side validation is a UX affordance only
and MUST NOT be trusted by the server.

**Rationale**: Untrusted data is stopped at the edge; correctness is guaranteed at the core.

### VII. Explicit, Generated Contracts

HTTP APIs MUST be described by an OpenAPI document and served through Scalar as the documentation
interface. Request and response shapes MUST be explicit transport DTOs.

Domain entities MUST NOT be serialized directly to HTTP or Socket.IO clients. Mapping MUST be
explicit in both directions: Transport DTO → Application input → Domain, and Domain/Application
result → Transport DTO → response. Frontend API types MUST be generated from the OpenAPI contract
with `openapi-typescript`; hand-written duplicates of server contracts MUST NOT be committed.
Socket.IO event names and payload types MUST live in a single shared contract library consumed by
both `apps/api` and `apps/web`.

**Rationale**: A single source of truth for contracts removes an entire class of drift bugs.

### VIII. Realtime and WebRTC Are Isolated

Socket.IO is transport only. Gateways MUST NOT hold domain logic and MUST NOT become a second
application layer. Transport events, application commands, domain operations and emitted events
MUST be distinguishable, separately named concerns.

Realtime lifecycle MUST explicitly handle connection, disconnection, reconnect attempts, duplicate
and out-of-order events, invalid payloads, race conditions, and resource cleanup. Room and
participant state has exactly one owner. Where the PRD requires in-memory state, a database or any
persistence layer MUST NOT be introduced; that state MUST sit behind a port so the application
layer does not depend on the storage mechanism, and capacity checks (the four-participant limit)
MUST be applied atomically from the application's point of view.

WebRTC MUST be isolated behind explicit abstractions covering peer connection lifecycle, media
stream acquisition and release, signaling message exchange, ICE candidates, offer/answer
negotiation, connection state and teardown. React components MUST NOT orchestrate
`RTCPeerConnection`, media device or Socket.IO lifecycles directly. The signaling layer transports
negotiation messages and MUST NOT own WebRTC decision logic. Peer failures, remote disconnects,
renegotiation, track changes, denied browser permissions and unsupported devices MUST each have a
defined handling path.

**Rationale**: Mesh WebRTC and realtime state are the riskiest parts of this product; they only
stay debuggable when their lifecycles are explicit and owned in one place.

### IX. Feature-Sliced Frontend, Smallest State Scope

The frontend MUST follow Feature-Sliced Design. Layers are created because a slice needs them, not
because the folder convention exists. Business logic MUST NOT live in JSX, route definitions, or
inline event handlers when it belongs in a feature or entity slice. Components primarily render
state, receive explicit props, trigger actions and compose smaller components.

State MUST use the smallest appropriate scope: local component state for local UI concerns, feature
state for feature-scoped state, TanStack Query for server state, and a dedicated realtime store for
Socket.IO- and WebRTC-driven state. TanStack Query MUST NOT be used as a general global state
manager or as a container for transient UI state, and realtime events MUST NOT be pushed into the
query cache by default. TanStack Router owns routing and route-level data loading.

A global state library (Zustand, Redux or equivalent) MUST NOT be added unless the approved TDD
requires it or a concrete, documented need exists. Hooks MUST NOT be created to wrap a single line
of code.

**Rationale**: Scoped state keeps realtime UI predictable and prevents an unmaintainable god store.

### X. Strict TypeScript

TypeScript MUST run in strict mode across every project. `any` MUST NOT be used; prefer `unknown`
with narrowing. Non-null assertions and type assertions MUST NOT be used without a comment stating
why the compiler cannot prove the invariant. `@ts-ignore`, `@ts-expect-error` and lint-disable
comments MUST NOT be used to make failing code pass.

Types MUST communicate domain intent: model invalid states out of existence where practical, use
discriminated unions for finite state machines (connection state, media state, room lifecycle), and
use branded or value-object types where primitive confusion carries real risk (room id, participant
id). Prefer literal unions over enums. Excessive generics and type-level complexity that reduce
maintainability MUST NOT be introduced.

**Rationale**: The type system is the cheapest test suite available.

### XI. Errors Are Categorized and Mapped

Errors MUST be intentional and classified as domain, application, validation, infrastructure,
transport, or unexpected. A generic `Error` MUST NOT be thrown where a meaningful typed error
exists.

Errors MUST NOT be silently swallowed; an empty `catch`, a bare `console.log` in place of handling,
or a discarded promise rejection is a defect. Errors crossing an architectural boundary MUST be
mapped: domain and application errors are translated into transport errors (HTTP status plus error
code, or a typed Socket.IO error event) at the adapter. Internal exception details, stack traces
and infrastructure identifiers MUST NOT reach clients. Every user-facing failure path defined in
the PRD (room full, device access denied, server unreachable, WebRTC unsupported) MUST surface a
distinct, actionable message.

**Rationale**: Categorized errors make failure paths testable instead of incidental.

### XII. Simplicity Over Speculation

Abstractions MUST have a present, concrete reason to exist. Architecture MUST NOT be added for its
own sake, and functionality that is not specified in the PRD or TDD MUST NOT be implemented.

Code MUST be readable, explicit, cohesive and testable, organized by architectural responsibility
and feature boundary rather than by technical type. Structures such as `services/`, `controllers/`,
`utils/` that mix unrelated business functionality MUST NOT be used as the primary organizing
scheme, and generic `utils` dumping grounds are forbidden. God classes, god services, god
components, giant utility files, deeply nested conditionals, hidden side effects and duplicated
business rules MUST be avoided. Modules expose a small public surface; internals stay internal.

Comments explain WHY, and MUST be written in English. Comments restating WHAT the code does and
bulk generated documentation inside source files MUST NOT be added.

Performance work MUST be evidence-driven; premature optimization is forbidden. Correct defaults are
mandatory though: bounded memory, removal of listeners, tracks and peer connections on teardown, no
duplicate event handlers, no unnecessary renegotiation, and no network request that can be avoided.
Caching MUST NOT be added without a defined invalidation strategy. React memoization is applied
only where a measured or structurally obvious benefit exists.

**Rationale**: Every unnecessary abstraction is permanent cost paid for a hypothetical benefit.

### XIII. Tailwind-First Styling

Tailwind CSS is the primary and default styling solution for the React application. Component and
layout styling MUST be expressed with Tailwind utilities: layout, spacing, typography, colors,
borders, shadows, responsive behavior, interaction states, transitions, and animation where
appropriate.

CSS-in-JS solutions (styled-components, Emotion or equivalent) MUST NOT be introduced. CSS Modules
MUST NOT be introduced unless a concrete technical problem exists that Tailwind cannot reasonably
solve, with the reason recorded in the plan. Custom CSS MUST stay minimal and justified; global
stylesheet content is limited to the Tailwind entry point, the application reset and font
declarations. Inline `style` objects MUST NOT be used for ordinary styling — genuinely dynamic
runtime values, such as a computed video grid dimension, are the only exception. `!important` MUST
NOT be used unless technically unavoidable.

Existing utilities SHOULD be composed rather than wrapped in custom CSS abstractions. A wrapper
component MUST NOT be created solely to avoid repeating a small number of classes. When a group of
classes represents a meaningful, reusable UI concept, extract a React component or a typed variant
rather than a large global CSS class. Styling stays close to the component or feature that owns it.

**Rationale**: One styling mechanism with no escape hatches keeps the UI diffable and prevents two
competing style systems from coexisting.

### XIV. Design Tokens Over Arbitrary Values

The Tailwind theme configuration is the foundation of the design system. Colors, the typography
scale, spacing that deviates from the defaults, border radii, shadows and breakpoints MUST be
defined there as tokens.

Semantic tokens MUST be preferred over raw values for concepts that belong to the design system:
`bg-background`, `bg-primary`, `text-foreground`, `text-muted` and `border-border` rather than
hardcoded hex values or arbitrary classes. Arbitrary Tailwind values are permitted only when a
value is genuinely one-off and cannot reasonably be represented by an existing token. The same
visual value MUST NOT be hardcoded repeatedly; a value that represents a stable product-level
concept — brand color, semantic background, text color, border color, standard radius, standard
shadow, typography step — MUST be promoted to a token.

The token set stays small and intentional. Tokens MUST NOT be created speculatively; each requires
a demonstrated need, per Principle XII.

**Rationale**: Tokens make a visual change one edit instead of a repository-wide search.

### XV. Component Styling and Variants

React components encapsulate their own visual structure. Global selectors that reach into
unrelated components MUST NOT be used, and bare HTML element selectors MUST NOT be styled globally
except as part of the intentional application-wide reset or base typography.

Reusable UI primitives MUST expose their variants through a consistent, typed API instead of
duplicated class strings at call sites, and a variant MUST NOT be reimplemented in more than one
place. When conditional styling becomes non-trivial, a single small class composition utility (for
example a `cn`/`clsx` helper, or the project's established variant utility) MUST be used; large
class strings assembled from nested ternaries MUST NOT be written. A new class composition or
variant library MUST NOT be added when an existing project dependency already solves the problem.
A component abstraction MUST NOT be introduced merely because two elements share a few classes.

Tailwind usage MUST respect the Feature-Sliced Design boundaries of Principle IX: shared UI
primitives live in the shared UI layer, feature-specific styling stays inside the feature, and
entity-specific styling stays inside the entity. A global component or style abstraction MUST NOT
be created merely because several features use similar colors or spacing.

**Rationale**: Variants typed in one place stay consistent; copied class strings drift silently.

### XVI. Accessible and Intentional Responsive Behavior

Responsive behavior MUST use Tailwind responsive utilities and SHOULD be authored mobile-first:
unprefixed base styles refined by `md:` and `lg:` modifiers. Separate desktop and mobile
implementations of the same screen MUST NOT be built unless the interaction model genuinely
differs. Responsive behavior follows the product requirements: the PRD targets desktop from 1024px
and places mobile adaptation out of scope, so mobile-first is an authoring convention here and
MUST NOT be read as authorization to design and ship mobile layouts.

Styling MUST NOT compromise accessibility. Hover, focus, active, disabled, selected and error
states MUST each be visually distinct for interactive elements. Keyboard focus MUST remain
visible; focus outlines MUST NOT be removed without an accessible replacement, and `focus-visible`
and `motion-reduce` utilities SHOULD be used where appropriate. Color alone MUST NOT be the sole
carrier of meaning — in this product, muted-microphone and disabled-camera indicators MUST convey
state through an icon or text, not color alone. Responsive or accessibility behavior MUST NOT be
disabled for implementation convenience.

**Rationale**: Focus and state visibility are cheap to build in and expensive to retrofit.

## Technology Stack & Platform Constraints

**Fixed stack.** Monorepo: Nx, pnpm, TypeScript (strict). Backend: NestJS, Socket.IO, Zod, OpenAPI,
Scalar, hexagonal architecture with pragmatic DDD. Frontend: React, Vite, TanStack Router, TanStack
Query, Socket.IO client, `openapi-typescript`, Tailwind CSS, Feature-Sliced Design. Tooling:
ESLint (or the configured linter), Prettier, `tsc`, Nx affected and project graph, pnpm. Deviating
from this stack requires a constitution amendment.

**No persistence.** A database, ORM or persistent store MUST NOT be introduced unless the PRD or
approved TDD explicitly requires one. Room, participant and chat state is in-memory and dies with
the room, per the PRD.

**No authentication.** Authentication and authorization MUST NOT be added unless required by the
PRD or TDD. Unrestricted room access by identifier is a deliberate product decision.

**Security baseline.** All external input is untrusted (Principle VI). Participant names and
message text MUST be escaped or sanitized at render time to prevent XSS, and length limits from the
PRD MUST be enforced server-side. Secrets MUST NOT be exposed to the frontend bundle and MUST NOT
be committed: API keys, tokens, credentials, private certificates and environment secrets stay out
of the repository. Least privilege applies to every configuration default.

**Dependency management.** Before adding a package the agent MUST verify that existing tooling
cannot solve the problem, that the package is actively maintained, what its runtime and bundle cost
is, and whether it introduces architectural coupling. Popularity is not a justification. Two
libraries solving the same problem MUST NOT coexist. Workspace dependencies MUST be declared
correctly per Nx project.

**Testing strategy.** Use the framework already configured by the Nx tooling. Unit tests cover
domain invariants and use cases and MUST run without NestJS or infrastructure. Application tests
use fake or mocked ports. Integration tests exercise real adapters (HTTP endpoints, Socket.IO
gateway, in-memory stores). E2E tests cover critical user journeys: create room, join by link, room
full rejection, chat delivery, media toggles, participant leave. Tests MUST verify behavior, not
implementation details, MUST be deterministic, and MUST NOT rely on arbitrary timeouts. Tests
written solely to raise coverage numbers MUST NOT be added, and tests MUST NOT be weakened to make
an implementation pass.

## Development Workflow & Quality Gates

**Change management.** Changes MUST be small and logically cohesive. Unrelated refactoring MUST NOT
be mixed into feature work. Existing behavior MUST be preserved unless the task explicitly requires
changing it. Before modifying an existing module the agent MUST inspect its dependencies, public
API and consumers. Prefer extending an existing abstraction over duplicating it.

**AI agent obligations.** Before implementing, an agent MUST read the PRD, the approved TDD, and
this constitution. During implementation an agent MUST:

1. Inspect existing code before modifying it.
2. Implement one task or one cohesive task group at a time, aligned with the approved plan.
3. Never invent product requirements and never silently change an architectural decision.
4. State assumptions explicitly in its report.
5. Ask for clarification instead of guessing when requirements are ambiguous.
6. Stop and explain the conflict when the implementation contradicts the PRD or TDD.
7. Never mark incomplete work as complete.

**Definition of Done.** A task is complete only when all of the following hold:

- The specified requirements are implemented, and nothing unspecified was added.
- Architectural boundaries in Principles I–IV are respected.
- `tsc` type checking passes with no suppressions added.
- Linting passes, including Nx module boundary rules, with no rules disabled.
- Relevant unit, integration and E2E tests pass.
- No unnecessary dependency was introduced.
- No unrelated behavior changed.
- Error cases and PRD edge cases are handled with mapped, user-appropriate errors.
- Listeners, media tracks, peer connections, timers and sockets are cleaned up.
- New interactive UI has visible focus and distinct hover, disabled and error states, and uses
  design tokens rather than hardcoded visual values.
- Generated API contracts (OpenAPI document and frontend types) are regenerated and in sync.
- The implementation matches the approved specification and technical plan.

**Anti-patterns that block merge.** Overengineering; speculative abstractions; premature
optimization; unnecessary patterns or global state; framework leakage into the domain; business
logic in controllers, gateways or React components; direct infrastructure access from the domain;
deep imports between Nx libraries; duplicated API contracts or validation; generic `utils` dumping
grounds; god services or components; silent error handling; `any`; disabled lint or type checks;
an unrequested database; unspecified functionality.

Styling-specific blockers: CSS-in-JS or styled-components; large custom CSS files; duplicated CSS
rules; arbitrary global selectors; excessive arbitrary Tailwind values; unreadable `className`
strings built from nested ternaries; duplicated variant implementations; inline `style` objects
for ordinary styling; `!important`; removed focus outlines; accessibility or responsive behavior
disabled for convenience.

## Governance

**Authority and precedence.** This constitution supersedes ad-hoc practice and prior habits. When
implementation decisions conflict, the following order applies, highest first:

1. Product requirements (PRD)
2. Approved technical design (TDD)
3. This constitution
4. The approved implementation plan
5. Existing architectural conventions in the repository
6. General engineering best practice

A lower-priority preference MUST NOT override a higher-priority requirement. When two requirements
of equal priority conflict, the agent MUST NOT silently pick one: it MUST report the conflict and
request clarification before proceeding.

**Amendment procedure.** Amendments are proposed as a change to `.specify/memory/constitution.md`
with a rationale, a version bump, and a note of any template or tooling impact. An amendment that
relaxes a MUST rule requires explicit human approval. Enforcement tooling (Nx tags, dependency
constraints, lint rules, `tsconfig` strictness) MUST be updated in the same change whenever the
amendment alters a mechanically enforceable rule.

**Versioning policy.** Semantic versioning applies to this document. MAJOR: a principle is removed
or redefined in a backward-incompatible way. MINOR: a principle or section is added or materially
expanded. PATCH: clarification, wording or typo fixes with no semantic change.

**Compliance review.** Every plan MUST include a constitution check before design, and every
implementation report MUST state which Definition of Done items passed. Complexity that deviates
from Principle XII MUST be justified in writing in the plan. Automated enforcement is always
preferred over documentation-only rules: if a rule here can be expressed as a lint rule, an Nx
boundary constraint or a compiler setting, it SHOULD be.

**Version**: 1.1.0 | **Ratified**: 2026-09-19 | **Last Amended**: 2026-09-19

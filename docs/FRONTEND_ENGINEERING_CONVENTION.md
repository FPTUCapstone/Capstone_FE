# TripMate Frontend Engineering Convention

Version: 1.0 · Established: 2026-10-14

Owner: TripMate Frontend Team

Maintainers: Frontend Lead + assigned reviewers

This is the canonical engineering guideline for the TripMate FE repository. It governs human contributors and coding agents developing the responsive Next.js Web application for Guest, Traveler, Tour Operator, and Administrator capabilities. It is not an Admin-only convention.

## 1. Authority, status, and change control

Three labels distinguish policy from implementation throughout this document:

- **Existing implementation:** observed source behavior at the audited revision; this does not establish that a capability is deployed or fully integrated.
- **Engineering standard:** the rule for new or materially changed code. Standards involving uninstalled tools describe the approved technology direction; adoption still requires a scoped dependency/configuration task.
- **Migration recommendation:** a future change with its own task, review, and verification. This document does not authorize a mass refactor, new screens, route renames, or package installation.

Product authority remains the latest approved SRS, then [WEB_SCOPE_MATRIX.md](WEB_SCOPE_MATRIX.md), approved Web Screen Specifications, reviewed UI, and the assigned implementation task. This convention defines how to implement that scope; it cannot override product requirements or backend contracts. An unresolved contract must be clarified rather than invented in the frontend.

For frontend engineering, this document supersedes overlapping guidance in [CODEBASE_RULES.md](CODEBASE_RULES.md). README is an onboarding/status guide and CONTRIBUTING is the workflow entry point. `AGENTS.md` remains the execution protocol for coding agents, including approval gates. Where a source inventory contradicts old documentation, source establishes current implementation only, never product authorization.

Maintainers review convention changes through a documentation PR into `develop`. Record the reason, affected rules, compatibility impact, and migration obligations. Exceptions require a reviewer-approved rationale, owner, and follow-up task in the PR; they do not become a second undocumented standard.

## Quick Rules

Before creating new frontend code:

1. Check existing features and patterns first.
2. Verify the approved requirement/task scope.
3. Create code inside the correct feature ownership boundary.
4. Reuse existing shared components before creating new ones.
5. Implement loading, empty, and error states where applicable.
6. Validate responsive behavior and accessibility.
7. Run required checks before creating a Pull Request.

## 2. Research and requirements baseline

### 2.1 Audit provenance

The integrated baseline is local `develop` at `5670067` (Merge pull request #41), audited on 2026-10-14. The supplied working checkout, `feature/web-operator-revenue-payouts` at `3a2a951`, was also inspected; it was 76 commits ahead of local `develop`. No remote freshness is claimed. Branch-specific observations below are not claims about integrated `develop`.

Evidence inspected:

| Source | Contribution and limits |
| --- | --- |
| `package.json`, lockfile, TypeScript/ESLint/Vitest configuration, CI | Installed tools, executable checks, compiler rules, actual test setup |
| `app/`, `src/features/`, `src/components/`, `src/lib/`, tests | Routes, feature boundaries, session/API behavior, naming, UI and storage patterns |
| README, CONTRIBUTING, CODEBASE_RULES, AGENTS, PR template | Existing policies and outdated statements requiring reconciliation |
| Report 1 — Project Introduction | Product objectives, shared Web/Mobile delivery, constraints |
| Report 2 — Project Management Plan | Delivery/review/testing activities, team coordination, risks; older UC references require checking against Report 3 |
| Report 3 — Software Requirement Specification | Responsive Next.js Web, shared backend, actors, 72 UCs, business rules and platform exclusions |
| Web scope matrix | Per-UC platform classification, requirement conflicts, interaction type; its September coverage snapshot is historical |
| Local `specs/`, `plans/`, sibling `Capstone_Docs/requirements` and `ux/web-screen-specifications` | Feature traceability, screen behavior, approved-task gates; file presence alone does not prove approval |
| Report3_Screens_All.html and reviewed UI artifacts | Visual reference; screen captions cannot override SRS platform scope |
| Installed Next.js guides under `node_modules/next/dist/docs/` | Version-matched Server/Client Components, Route Handlers, authentication and data-security guidance |

The reports were read from the sibling project workspace. Report 3's normal and `-V2` files have identical SHA-256 `c8d927a56b7720da3f8b4df38ffdd6eecc1ebd8d315e6bc104ca41c9b163f076`, matching the matrix's cited source. Their filenames do not establish separate approval versions. Keep approved requirement artifacts in the documentation repository rather than copying local machine paths into runtime code.

**Edura comparison: PENDING.** The requested [Edura Web repository](https://gitlab.com/edura/edura-web) project page was reachable, but raw files, repository tree/API retrieval, and Git source access were unavailable during research. No folder, API, hook, state, naming, or scalability decision is attributed to Edura. If access becomes available, record the inspected commit and compare suitable principles in a reviewed update. Edura remains a reference comparison, never TripMate's source of truth.

### 2.2 Product scope

| Area | Web responsibility | Boundary |
| --- | --- | --- |
| Guest / Public | Landing, supported account flows, POI and published-tour discovery | Public access does not authorize booking or administrative mutations |
| Traveler | Approved profile/preferences, planning/itinerary, discovery, booking/payment handoff, QR display, history/review capabilities | Active navigation/rerouting, offline trip synchronization, groups and specified commercial services remain Mobile-only |
| Tour Operator | Approved onboarding/profile, tour/coupon management, bookings, cancellation/refund requests, reporting and payout requests | QR check-in scanning remains Mobile-only; pending/rejected applications cannot use approved workspace capabilities |
| Administrator | Web administration, moderation, catalogue/configuration, monitoring, finance, reports and audit | Read-only monitoring does not authorize intervention or new financial operations |

The matrix classifies 72 numbered UCs: 32 shared Web/Mobile, 15 Mobile-only, 23 Admin Web-only, and 2 non-screen workflows. Landing is an additional unnumbered Public Web surface. A UC may be an action, dialog, or background process; it does not imply a route.

UC-30/31, UC-43, and UC-70 contain blocking platform/UI contradictions; UC-71 has actor discrepancies. Follow the matrix's conservative gates until corrected requirements are approved. Financial formula conflicts in UC-44/46 must be resolved by Product/BA and backend contract owners. The frontend must not independently compute authoritative refunds, commissions, settlement balances, itinerary feasibility, or payment completion.

### 2.3 Verified technology status

| Technology | Existing implementation | Engineering standard / adoption condition |
| --- | --- | --- |
| Next.js / React | Next.js 16.3.2 and React 19.2.8 in the audited installation | App Router; consult installed version guides before implementation |
| TypeScript | Strict compiler configuration, `@/*` maps to `src/*` | Preserve strictness and boundary typing |
| Tailwind CSS | Version 4, PostCSS plugin, CSS-first `@theme` | Primary styling system; preserve established tokens during migration |
| ESLint | Version 9, flat config, Next Core Web Vitals and TS rules | Run repository lint; new exceptions need rationale |
| Firebase | Web SDK installed; used by account flows | Preserve approved identity integration; never include Admin credentials |
| React Query | Not installed | Proposed TanStack Query direction for interactive remote state, not all fetching |
| Zustand | Not installed | Proposed small client-state stores only when cross-component need is demonstrated |
| Zod | Not installed; manual runtime parsers exist | Proposed runtime schema validation for approved adoption tasks |
| Axios | Not installed; native `fetch` is used | Proposed browser transport option; preserve Next.js server `fetch` behavior |
| Prettier | Not installed; no formatter script/config | Proposed deterministic formatting after a reviewed configuration task |
| Testing | Node tests, Vitest 3.2.4, Testing Library, jsdom | Use installed harness; browser E2E tooling is not installed |

Approval of this convention does not mean these five proposed libraries are already available. Do not import them before dependency adoption, install parallel state systems casually, or replace working services solely to match the direction list. Use npm and preserve `package-lock.json`.

### 2.4 Current patterns and technical gaps

| Observation | Evidence | Consequence / migration recommendation |
| --- | --- | --- |
| Thin routes and feature implementation already exist | `app/account/profile/page.tsx`, `src/features/account/profile/` | Retain composition pattern; move remaining substantial route logic when touched |
| Role areas coexist with business domains | `public`, `admin`, `operator`, `traveler`, `account`, `auth`, `scheduling` | Make ownership explicit; avoid wholesale folder relocation |
| Integrated URLs exceed old route inventory | `/account/*`, `/partner/*`, `/plan`, `/itinerary/[id]`, `/pois/*`, `/tours/*`, `app/api/*` | Do not rely on historical `/` and `/admin/*` statements as current inventory |
| Browser services and BFF proxies coexist | `src/lib/authApi.ts`, POI/tour services, `app/api/admin/*` | Select transport per approved session contract; normalize boundaries incrementally |
| Manual response parsing and error shapes vary | `poiApi.ts`, `auditLogAdminService.ts`, `authErrorMapper.ts` | Preserve verified parsers; introduce shared normalized errors only where contracts overlap |
| Shared session bootstrap is implemented | `authSession.ts`, `useWebSession.ts`, root `WebSessionProvider` | Preserve memory-only tokens and explicit restoring status; do not persist sessions in a new store |
| Administrator layout is composition, not a global authorization gate | `app/admin/(console)/layout.tsx` | Verify authorization per privileged data/action; navigation visibility is insufficient |
| Profile updates are local drafts | `travelerProfileApi.ts`: `LOCAL_DRAFT`, `PENDING_BE_INTEGRATION` | Never label them server persistence; integration needs a backend contract |
| Brand components have multiple homes | `components/BrandLogo.tsx`, `brand/BrandLogo.tsx`, `registration/BrandLogo.tsx` | Inspect differences before consolidating; retain visuals and import compatibility |
| Tokens and effects overlap | `app/globals.css`: brand/semantic colors, short aliases, repeated shadows/animations | Consolidate by reviewed visual scope, not a global repaint |
| Naming/layout styles vary | `admin/create-poi/services/poi-api.ts` versus `public/pois/services/poiApi.ts`; flat features versus subfolders | Apply the naming/organization rules below to new files; migrate only touched boundaries |
| Engineering docs are stale | Older no-API/no-env/no-test statements; outdated coverage in matrix | This audit replaces implementation assumptions; product classification remains authoritative |
| Architecture and format enforcement are incomplete | ESLint config; absence of Prettier and browser E2E setup | Review enforces boundaries now; automation is a separate task |
| Environment examples differ | Server origin uses port 5021; public example uses 5000; auth has a localhost fallback | Verify each service's configured target; remove implicit production fallbacks in a scoped fix |

**Branch-specific evidence:** the supplied feature checkout adds `bookings`, `reviews`, `trips`, wider Operator operations/finance, Admin configuration/monitoring/staff work, and HMAC-sealed Admin sessions with `TRIPMATE_ADMIN_SESSION_SECRET`. Its auth types include `Staff`. These are source observations outside the audited develop baseline; they neither prove deployment nor authorize new SRS actors. Re-audit capability status when integrating those branches.

## 3. Architecture principles and dependency boundaries

**Engineering standard:** organize by business capability, keep routes thin, keep runtime boundaries explicit, and share only proven duplication. Backend services own business authority; the Web owns presentation, interaction, safe request composition, and response interpretation.

Dependency direction:

```text
app route/layout -> feature composition -> feature UI / hooks
feature hooks or server composition -> feature services -> transport/backend
feature UI -> shared UI / framework-neutral utilities
server proxy -> server session/config + backend transport
```

Rules:

1. `app/` may import feature entry components and services; feature code must not import `app/` files.
2. Shared UI in `src/components/ui` must not import features, routes, session logic, or services. It receives data/callbacks through typed props. Existing auth/navigation composites are higher-level shared components, not generic primitives.
3. Framework-neutral helpers in `src/lib` must not depend on feature UI. Existing `authApi.ts` imports auth session policy: treat this as a legacy coupling, not a template for unrelated shared helpers.
4. Services must not import visual components. Schemas/types/utils must not import hooks or React components. Pure business transformations must be testable without rendering.
5. Cross-feature imports are permitted only for a deliberate public contract, such as the shared auth session or reusable domain types. Do not import another feature's private form, store internals, or deep UI implementation. Promote truly shared logic after demonstrated reuse.
6. Prevent cycles. Use explicit imports rather than a root barrel exporting the entire application. A feature may expose a small `index.ts`, but never mix server-only exports into a client-facing barrel.
7. Mark privileged modules with `import 'server-only'`. Never import them through a Client Component dependency graph. A folder named `server` alone is not enforcement.
8. Do not add repository/DAL/event-bus layers, global providers, UI frameworks, or general-purpose abstractions without a demonstrated task need and approval.

## 4. Folder structure and feature ownership

**Existing implementation:** this abbreviated tree reflects integrated develop; it is not a complete route inventory.

```text
app/                         Next.js route composition and framework files
  account/                   Traveler account pages
  admin/                     Login, catalogue creation, (console) layout/pages
  api/                       Existing Web API/BFF Route Handlers
  partner/                   Operator onboarding/application/context
  plan/  itinerary/          Planning and suggested itinerary
  pois/  tours/              Public discovery/detail
  layout.tsx  globals.css
src/
  components/                Shared UI, brand, navigation, auth/layout composites
  features/
    public/  traveler/  operator/  admin/
    account/  auth/  scheduling/
  lib/                       Shared helpers/routes; server/ session/backend modules
  data/                      Existing prototype data
  types/                     Existing shared types
  legacy/mobile/             Historical visual references; never production imports
specs/  plans/               Task specifications and plans; verify approval per task
tests/                      Node tests and test-only stubs
docs/                       Engineering, scope and integration documentation
```

**Engineering standard:** new role-specific capabilities belong in `src/features/<public|traveler|operator|admin>/<capability>/`. Existing domain roots remain valid homes for related work: `account` for shared account UI, `auth` for session/access flows, `scheduling` for itinerary planning. A new cross-role domain root requires explicit ownership and review; domain ownership does not change route URLs.

TripMate-specific ownership examples are `src/features/traveler/itinerary/`, `src/features/operator/tour-management/`, and `src/features/admin/poi/`. These illustrate architecture only: they are not declarations of existing folders or authorization to create features, routes, or requirements. Existing feature homes remain valid under the rules above.

Example of an optional feature layout (create only needed directories):

```text
src/features/operator/<capability>/
  components/                UI owned by this capability
  hooks/                     Interactive orchestration, useX naming
  services/                  Request/response handling and transport adapters
  schemas/                   Runtime validators after approved adoption
  types/                     Request, response, domain and view types
  utils/                     Pure parsing/formatting/query helpers
  resources/                 Product text where the feature uses resource files
  data/                      Explicitly gated demo fixtures, if required
  __tests__/                 Tests when colocated files would obscure navigation
```

Use `services/` for new transport-facing modules; existing `api/` folders remain until a scoped rename. Server proxy modules may stay next to their feature service and must be server-only. Use shared `src/services/` only when real reuse warrants a transport/configuration boundary; it is not required scaffolding. Do not create empty `hooks`, `stores`, `schemas`, or feature directories for all 72 UCs.

For example, an approved Admin POI capability could organize its feature-owned form/table and service contract as follows, using the existing camelCase convention for non-component files:

```text
src/features/admin/poi/
  components/
    PoiForm.tsx
    PoiTable.tsx
  services/
    poiService.ts
  types/
    poiTypes.ts
```

`PoiForm` and `PoiTable` compose existing shared controls; `poiService.ts` owns request/response handling and uses the approved transport boundary. This illustrative layout does not relocate the existing `admin/create-poi` implementation.

## 5. Server and Client Components

**Engineering standard:** pages/layouts are Server Components by default. Keep metadata, server session/data boundaries, and static composition there. Extract interactive forms, dialogs, filters, browser storage and map widgets into narrow Client Components using `'use client'`.

- Props crossing the server/client boundary must be serializable and minimal. Never serialize credentials, privileged DTO fields, service instances, or arbitrary callbacks from server composition.
- Pass server-rendered children into a client provider when required; wrapping children does not automatically make every child a Client Component. Avoid client imports of server modules.
- Keep browser APIs out of module initialization and server rendering. Client Components can be prerendered; read storage in safe lifecycle logic and handle unavailable storage.
- Preserve the existing root session bootstrap. Mount future Query/Zustand providers only where needed; use request-isolated server state and avoid user data in server module singletons.
- Await version-specific request APIs such as `params`, `searchParams` and `cookies()` where required by installed Next.js. Read the installed guides, not examples from older versions.
- Server Components should call server services directly rather than loop back through the application's own HTTP BFF merely to reuse code.
- An error boundary's retry must not repeat an unsafe mutation. Choose route-level `loading.tsx`, `error.tsx`, `not-found.tsx` or section-level states according to failure scope.

Illustrative route composition using an existing feature:

```tsx
import { TravelerProfilePage } from '@/features/account/profile/TravelerProfilePage';

export default function Page() {
  return <TravelerProfilePage />;
}
```

This illustrates composition only; it does not add a server authorization guarantee to the existing profile page.

## 6. Routing and role-based access

**Existing implementation:** public discovery uses `/pois` and `/tours`; account/planning URLs include `/account`, `/plan`, and `/itinerary`; Operator URLs use `/partner`; Administrator URLs use `/admin`. The `(console)` route group shares an Admin layout without appearing in URLs. Some Admin routes are outside that group. Preserve these URLs until an approved route-change task.

**Engineering standard:**

- Use `page.tsx`, `layout.tsx`, `route.ts` and other App Router conventions. Segments are meaningful kebab-case; dynamic IDs use `[id]` or the established descriptive parameter.
- Route groups organize layout, not roles or authorization by themselves. Do not create `/traveler` or `/operator` merely because a folder example suggests it.
- Use `next/link` for internal navigation; `router.push/replace` for navigation resulting from client behavior. Reserve full browser navigation for approved external identity/payment handoffs or a documented requirement.
- Reuse `src/lib/routes.ts` and deliberately owned feature route helpers. Validate dynamic identifiers; never concatenate untrusted return destinations. Allow only approved same-origin return paths.
- URL query state owns shareable filters, sort and pagination. Parse and bound query values; reset pagination when filters change. Direct load, refresh, back/forward and copied URLs must work.
- Distinguish `restoring`, authenticated and unauthenticated states. Do not redirect or render Guest-only decisions before session restoration settles.
- Resolve role and account/application status from the approved session contract. Pending/rejected Operators go to application/status/resubmission flows; unresolved status fails closed for privileged workspace actions.
- Hide unauthorized controls for usability, but enforce privileged reads and writes at the server/BFF and backend boundaries. A client guard or layout is not an authorization boundary.
- Test direct URL access, cross-role denial, expired sessions, status transitions and object ownership. A valid role must not grant access to another user's booking/application by changing an ID.

Staff behavior on a branch must use its approved capability contract; do not automatically equate Staff with all Administrator permissions.

## 7. Naming and TypeScript

| Item | Convention | Example |
| --- | --- | --- |
| Components / component files | PascalCase, `.tsx`, one primary responsibility | `TourCard.tsx`, `TourCardProps` |
| Types, interfaces, schemas' inferred types | PascalCase; no blanket `I` prefix | `TourSummary`, `CreateTourRequest` |
| Functions, values and ordinary `.ts` files | camelCase; descriptive names | `parseTourQuery`, `tourApi.ts` |
| Hooks | `use` prefix; camelCase filename | `useTravelerProfile.ts` |
| Feature/route directories | kebab-case, except established domain names | `tour-operator-applications` |
| Module constants | UPPER_SNAKE_CASE when fixed configuration | `MAX_PAGE_SIZE` |
| Runtime schema values | camelCase with `Schema` suffix | `createTourSchema` |
| Tests | Source name plus `.test.ts`/`.test.tsx` | `TourCard.test.tsx` |

Preserve Next.js required lowercase filenames. Existing kebab-case service files do not justify unrelated rename churn. Prefer named exports for ordinary modules; use default exports where framework conventions require them. Use `@/` across module boundaries and short relative imports within a feature. Separate external imports, shared imports and local imports; use `import type` where appropriate.

Keep strict TypeScript. Parse external values as `unknown`; narrow them before use. Do not make `as SomeDto` the only validation of JSON. Avoid `any`, non-null assertions and suppression comments; unavoidable library exceptions require a documented explanation. Prefer discriminated unions for loading/result/permission states and explicit component props. Keep transport DTOs distinct from form drafts/view models when their semantics differ; do not duplicate the same domain contract with incompatible field types.

## 8. Shared UI and design system

**Existing implementation:** `ActionButton`, `FeedbackAlert`, `FormControls`, `StatusBadge`, `LegalModal` and `ScrollReveal` exist under `src/components/ui`; layout/navigation/brand components exist elsewhere in `src/components`.

**Engineering standard:** reuse the nearest compatible component before adding another. Generic primitives own semantics, accessibility and visual variants; features own fetching, permissions and business actions. Promote feature code only after genuine cross-feature reuse, with explicit props and tests for relevant interaction. Prefer composition and small variants over one component with many unrelated modes.

Buttons express actions, links express navigation. Shared inputs support labels, error associations, disabled/loading states and keyboard behavior. Dialogs support focus entry, containment, Escape behavior where permitted, and return focus. Tables, filters and pagination must provide loading, success, empty and error behavior without concealing partial failures. Do not add a UI framework or a second design system without approval.

### Styling and tokens

Use Tailwind 4 utilities as the default. Maintain shared theme tokens in `app/globals.css` using existing CSS-first `@theme` patterns. Prefer semantic roles (surface, text, border, action, error) for new shared primitives, mapped to reviewed brand values. Do not invent a new palette to resolve overlapping current tokens.

- Reuse established spacing, typography, radii, shadows, colors and focus treatments. A repeated arbitrary value is a candidate token; a one-off visual value is not automatically a global token.
- Keep global CSS for resets, tokens, genuinely shared utilities and third-party needs. Feature-specific selectors must be scoped; use a CSS module when utility composition is insufficient and no new styling dependency is needed.
- Use inline styles only for inherently dynamic values or library requirements. Build Tailwind class variants from complete class strings so tooling can detect them.
- Responsive implementation starts with narrow content layouts and adds breakpoints as needed. Verify at least a narrow phone (~360px), tablet (~768px) and desktop (~1280px), plus content stress cases; these are test targets, not compulsory new breakpoint tokens.
- Prevent page-level horizontal overflow. Wide tables may use a labelled, keyboard-accessible scroll region with visible scroll affordance. Do not remove important data on mobile without a reviewed alternative.
- Respect reduced motion for all newly added animation, including custom keyframes. Avoid continuously animating offscreen content.
- Preserve approved visuals when consolidating duplicate brand components/tokens; include before/after evidence and rollback scope.

## 9. State ownership

**Existing implementation:** local React state/hooks, a module-memory auth store with subscribers and a session bootstrap, URL parsing helpers, owner-scoped browser drafts/preferences, and service requests. There is no React Query or Zustand adoption.

**Engineering standard:** choose one owner for each value:

| State | Owner | Examples / restrictions |
| --- | --- | --- |
| Backend data rendered on server | Server service and explicit Next.js caching policy | Public catalogue or protected account DTO; never cache private responses across users |
| Interactive remote state | Existing service/hook; React Query after adoption | Lists, details, mutation outcomes; no duplicated Zustand cache |
| Shareable navigation state | URL | Search, filters, sort, pagination |
| Local interaction state | Component `useState`/`useReducer` | Dialog, field draft, active tab, selected rows |
| Shared client UI state | Narrow context; Zustand only after demonstrated need | Temporary multi-component workflow; not backend truth or sessions |
| Authentication | Existing approved session boundary | Preserve restoration/expiry/logout semantics; no persisted tokens |
| Browser drafts/preferences | Feature storage adapter | User-scoped, validated, versioned where needed; explicitly local persistence |

Derive values rather than synchronizing redundant copies. Do not copy URL filters into an unrelated store or store the same backend entity in component state, Query and Zustand. Handle storage errors and corrupted payloads; specify retention, owner-switch cleanup and logout behavior. Local storage is neither secure storage nor evidence of server persistence.

### React Query adoption standard (proposed)

Use stable feature-owned query keys including resource, normalized parameters and user/tenant identity where data is private. Never put tokens into keys. Forward `AbortSignal` to services. Define stale time, refetch, pagination and retry behavior per data volatility; do not rely silently on library defaults. Cache public and private data separately.

Invalidate/update the precise affected keys after successful mutations. Disable automatic retries for unsafe writes unless backend idempotency makes them safe. Use optimistic updates only with a proven rollback/conflict strategy; payment/refund/payout/moderation outcomes require authoritative confirmation. On logout/account switch clear private cache and cancel outstanding requests. If hydrating server data, create a QueryClient per server request; never share one user's dehydrated data with another request.

### Zustand adoption standard (proposed)

Use small feature stores with selectors and explicit actions. Keep server entities, credentials, financial truth and derived values out. Persistence is opt-in for approved non-sensitive UX state, with schema/version/user isolation and reset behavior. SSR must not use a process-global mutable user store. Preserve the existing auth contract instead of rebuilding it in Zustand.

## 10. API integration and error handling

**Existing implementation:** feature services use native fetch, runtime parsers and feature error types. `src/lib/server/backend.ts` validates the configured backend origin, uses a 15-second timeout, disables caching and rejects redirects. Browser auth services use `NEXT_PUBLIC_API_URL`; several public/Admin features use same-origin Route Handler proxies.

**Engineering standard:**

1. Pick the approved transport/session path per capability: browser -> feature service -> same-origin BFF -> backend, or approved direct browser -> backend. Do not migrate credential ownership by changing the client library.
2. Keep backend base URL/configuration in the transport boundary. No scattered absolute URLs or implicit production localhost fallback. Server secrets stay server-only; public configuration is not secret.
3. Keep Route Handlers thin: validate request/session/origin, call feature proxy/server service, and return safe status/body/cache headers. They are not a second implementation of backend business rules.
4. Define request DTO, runtime response parser, domain/view mapping, supported query parameters and errors from the approved API contract. Handle non-JSON, empty, malformed and partial responses explicitly. A resolved HTTP request is not automatically business success.
5. Support cancellation and bounded timeouts; ignore obsolete responses after filter/identity changes. Aborted reads should not show generic failure alerts.
6. Normalize errors at the feature boundary. Preserve status, stable backend code and known field errors, then map to safe product text. Prefer a consistent result/error model for new shared adapters, not a forced rewrite of every current error class.
7. Map 401 to expiry/sign-in behavior; 403 to access denied; 400/422 to contract-defined field errors; 404 to missing/unavailable; 409 to conflict; 429 to backoff; network/5xx to safe retry guidance. Exact backend semantics control.
8. Retry safe reads only with bounded backoff. For idempotent writes, preserve the key across retries of the same logical payload; change it for a new operation according to backend rules. Do not retry booking/payment/refund/payout writes automatically without an idempotency contract.
9. User-facing success requires the contract's real confirmation, not a mock timer, a redirect query flag or a fabricated ID. Backend computes financial amounts and operation status. Payment return URLs initiate status verification rather than proving payment.
10. Keep demo fixtures separate and explicitly gated. Production must fail safely when integration is unavailable, not fall back to fabricated successful data. Category/demo flags cannot be presented as implemented production capabilities.

**Axios adoption (proposed):** introduce a reviewed browser instance only if needed, with base URL, timeout, cancellation and safe error normalization. Interceptors must not create refresh loops or replay unsafe writes; refresh is single-flight and retries are bounded. Do not indiscriminately attach bearer credentials to external origins. Do not set a manual multipart boundary. Keep Next.js server fetch for framework caching/revalidation semantics; Axios does not inherit them.

## 11. Validation and forms

**Existing implementation:** handwritten response guards, contract validators, form checks and auth error mapping; Zod is absent.

**Engineering standard:** validate user inputs for usability, validate untrusted data at service/request/storage boundaries, and retain backend validation as final authority. Use the same approved constraints/messages across Web flows; do not invent required fields, money limits, allowed transitions or file types from mockups.

- Distinguish form strings from API values. Handle blank versus zero, optional versus null, IDs, enum values, decimal precision, date-only values and UTC timestamps explicitly.
- Apply timezone rules from the contract; display formatting must not silently alter the submitted instant. Test Vietnam local-date boundaries for scheduling where relevant.
- Keep pure validators separate from rendering. After Zod adoption, put schemas beside the owning feature and infer types where useful; use safe parsing at untrusted boundaries and map issues to known fields.
- Keep response validation even with TypeScript or generated DTOs. Validate shape, required fields, enum values and business-critical numeric bounds before treating data as usable.
- Associate inline errors with inputs, retain user entries after failure, prevent duplicate submission, expose pending state, and focus the first invalid field or error summary.
- Check upload size/type/count against the approved contract; backend performs independent verification. Revoke preview object URLs when done and avoid persisting sensitive legal documents in browser drafts.
- Do not introduce a form library solely for this convention. Existing React forms may remain when maintainable.

## 12. Security and configuration

**Existing implementation:** develop has an HttpOnly Admin cookie with Secure in production and SameSite Strict; shared public session context retains access tokens in memory and optional storage metadata excludes tokens. These observations are not a claim that every route is protected or that deployment security was verified.

**Engineering standard:**

- Enforce authorization at every privileged server/API operation, including object ownership and account/application status. A decoded unsigned JWT payload or browser role claim is not proof of authorization.
- Follow approved cookie/session/refresh contracts. Never persist access or refresh tokens in localStorage/sessionStorage, Query persistence or Zustand persistence. Never serialize privileged server tokens into Client Component props.
- Fail closed when session verification/configuration is missing. Do not create test-token bypasses, unsigned-role shortcuts, or hardcoded role grants.
- Protect cookie-authenticated mutations with the established origin/CSRF policy; SameSite alone is not a blanket replacement. Never accept arbitrary forwarded hosts or proxy origins as trusted configuration.
- Prevent credential forwarding via redirects or arbitrary backend URLs. Validate application-owned paths and identifiers. Use HTTPS for production backend traffic.
- Treat all `NEXT_PUBLIC_*` values as public. Firebase Web config is public client configuration; Firebase Admin/service-account credentials are secrets and belong outside this repository's browser code.
- Keep local env files, logs, credentials, generated artifacts and uploaded documents out of commits. Update `.env.example` and setup docs for every new configuration requirement using safe placeholders.
- Avoid raw HTML. If a reviewed feature requires it, sanitize with an approved implementation and test malicious content. Validate link/media URL schemes and destinations.
- Never log tokens, passwords, full auth payloads or personal/legal documents. Use approved observability with safe codes/correlation IDs; show no raw stack traces or upstream internals to users.
- Review remote image allowlists, security headers and CSP as deployment tasks; do not claim they are enforced merely because the guideline requires them. Suspected secret exposure requires rotation and incident handling, not only deletion from the latest commit.

## 13. Accessibility, responsive UX, and content

**Engineering standard:** target WCAG 2.2 AA for new or materially changed screens. Automated checks alone do not establish compliance.

- Use semantic landmarks, headings, tables and lists. Keep heading order meaningful and provide skip-navigation where the shell requires it.
- Give every input a label and describe help/error text through accessible associations. Use proper autocomplete/input types. Provide meaningful names for icon-only buttons.
- Support keyboard operation, visible focus, logical order, modal focus return and non-pointer alternatives. Do not use clickable divs for actions.
- Do not convey status solely by color. Check contrast for text, controls and focus indicators. Provide meaningful image alt text; use empty alt for decoration.
- Announce asynchronous status/error changes without flooding live regions. Use `aria-busy`/status semantics appropriately and keep skeletons from becoming repeated noise.
- Test zoom/reflow, long names, empty lists, validation messages, loading and permission states. Maps and visual itinerary timelines need a readable text/list alternative.
- Use approved message resources and locale strategy. Existing English and Vietnamese text does not authorize an unrequested i18n framework. Format currencies, numbers and dates explicitly; backend currency and timestamp semantics remain authoritative.

## 14. Performance and caching

**Engineering standard:** optimize measured bottlenecks without weakening correctness or adding speculative abstractions.

- Keep client boundaries small. Load heavy map/editor/chart code only where needed; browser-only lazy loading must respect installed Next.js rules.
- Use server rendering and metadata for public discovery where the approved screen supports it. Avoid effect-only request waterfalls when server data is appropriate.
- Choose caching intentionally: public stable data may cache with a documented freshness policy; session/user-specific and finance/admin responses must not enter shared public caches. Existing protected transport uses no-store.
- Define revalidation/invalidation after writes; Next.js cache and future Query cache are separate owners and may both need explicit updates.
- Use suitable `next/image` sizing/remote policy for supported images, reserve dimensions to avoid layout shifts, and avoid eagerly loading all gallery assets. Approved raw-image exceptions need rationale.
- Use `next/font` or approved local fonts. Current build-time Google Font fetching introduces a network dependency; self-hosting is a future task, not a silent validation workaround.
- Paginate large result sets and debounce expensive search where behavior allows. Introduce virtualization only after measurement and accessibility review.
- Avoid premature `useMemo`/`useCallback`; use stable identifiers as React keys. Check memory cleanup for subscriptions, requests, timers and object URLs.
- Measure Core Web Vitals, bundle impact and request count for performance-sensitive screens. Set feature-specific budgets with maintainers; no monitoring pipeline or numeric production SLO is claimed here.

## 15. Testing and verification

**Existing implementation:** `npm test` runs `node --test tests/*.test.cjs`, then Vitest. Vitest uses jsdom, Testing Library, cleanup setup and a test-only `server-only` stub. Tests are both colocated and under `__tests__`. The command contains a legacy cooldown `.ts` exclusion; the actual `.tsx` test still runs. No browser E2E runner, enforced coverage threshold or dedicated accessibility scanner is installed.

**Engineering standard:** choose tests by risk and changed behavior:

| Layer | Verify |
| --- | --- |
| Pure unit | Query parsing, validators, transformations, date/money rules, permission decisions |
| Service / Route Handler | Request contract, cancellation, malformed success, status/errors, origin/session/ownership, no-store and safe credential handling |
| Component / hook | User interaction, accessible names, validation, loading/empty/error/success, duplicate submit, restoration races |
| Route composition | Correct feature wiring, metadata, guard/state integration and direct navigation contract |
| Browser E2E (future adoption) | Real navigation/refresh, identity boundaries, responsive interaction and agreed critical journeys |

Write a failing behavioral test before implementation where applicable, then minimal code, refactor and verify. Do not add tautological tests for documentation or tests that mirror internal variable names. Mock at transport/browser boundaries and include malformed data and failures; mocks do not prove backend integration. A test-only `server-only` stub does not replace production bundle checks.

Required validation before review:

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run build
```

CI uses `npm ci` for locked installation and runs test, lint, typecheck and build. Provide required public Firebase configuration locally according to `.env.example`; never commit a local env file to make a build pass. Do not hide font/network/tooling failures or substitute an alternative bundler and report the default build as passing.

For UI changes, also exercise direct refresh/back navigation, relevant roles/statuses, narrow/tablet/desktop viewports and keyboard interaction. Browser E2E adoption must define test backend/fixtures and safety boundaries before real payment or destructive administrative journeys are automated.

Documentation-only tasks require link/structure/consistency checks and the repository's required commands; they do not need fabricated behavior tests. Record any baseline failures before edits and distinguish them from regressions. A documentation-only change may be completed with an honestly reported environment-limited build; no application implementation should begin on a broken baseline without maintainer resolution.

## 16. Feature delivery, PRs, and review

Follow Explore -> Clarify -> Spec -> Plan -> TDD -> Atomic Execution -> Verify. Inspect nearby source, tests, approved requirements and installed framework guides. For non-trivial work, obtain spec and plan approval before implementation. A convention or SRS inventory is not an implementation assignment.

Before a visual Web screen, verify UC classification -> requirement/MVP/user flow -> approved Web Screen Specification -> reviewed UI -> approved implementation task. Stitch is optional for non-visual work or by maintainer approval. Specs define roles, routes, data/session contract, states, accessibility and edge cases; plans list exact files and verification. Use small independently reviewable tasks and two-pass review (scope compliance, then quality); agents follow the repository's subagent protocol when supported.

Branch from `develop` using `<type>/<lowercase-kebab-case>`: `feature`, `fix`, `refactor`, `chore`, `docs`, or `test`. Never develop/push directly to main/develop or alter unrelated history. Keep the existing checkout safe; use an isolated worktree when another feature is active. Use Conventional Commits, for example `docs(frontend): establish engineering convention`. AI-authored commits include `Co-Authored-By: Codex <noreply@openai.com>`.

Complete the [PR template](../.github/pull_request_template.md), target `develop` unless directed otherwise, and report:

- Requirement/task and UC IDs; exact approved scope and affected routes.
- Behavioral change, API/session assumptions and prototype/integration boundaries.
- Checks actually executed and failures/skips; screenshots for visual changes.
- Migration/compatibility impact, risks and owned follow-up work.

Review checklist:

- Product/platform gates and approved task satisfied; no invented Mobile Web equivalents.
- Route/feature ownership, dependency direction and narrow client boundary preserved.
- Authorization, object ownership, session expiry, origin and credential handling verified.
- DTO/runtime validation, cancellation, idempotency and safe error states covered.
- UI reuse, semantic tokens, responsive layout and accessibility preserved.
- Meaningful tests pass; no unrelated reformatting, debug output or generated files.

Critical findings (requirement breach, regression, security failure or architecture violation) block progression/merge. Minor findings need explicit reviewer agreement and owned follow-up if deferred. Do not silently waive checks. Completion does not authorize an agent to merge, push or open a PR; present merge/PR/keep/discard options and act only on the developer's choice.

## 17. Incremental migration checklist

These are recommendations for separately approved tasks, not work performed by this convention change. Migrate touched capabilities in small PRs; retain URLs, visuals and API/session behavior unless the task explicitly changes them.

| Priority | Action / owner | Acceptance evidence |
| --- | --- | --- |
| 1 | FE maintainers: reconcile stale coverage/setup claims in README, AGENTS and matrix coverage | Source-verified dated inventory; product classification unchanged |
| 1 | FE + Backend: catalogue each capability's transport, auth, contract and integration status | Explicit live/local/demo/pending status; no fabricated production success |
| 1 | FE + Security/Backend: review privileged route/object authorization and session differences before branch integration | Direct access/cross-role/object/expiry tests; approved session contract |
| 1 | FE + Backend: make browser/server environment targets explicit and remove unsafe implicit production defaults | Fail-fast config tests; safe `.env.example`; deployment docs |
| 2 | FE architecture owners: clarify feature public contracts and remove circular/shared-lib feature coupling | Small import diff, preserved APIs and passing regression tests |
| 2 | UI owners: consolidate duplicate BrandLogo/HeroPanel and token aliases where actually equivalent | Before/after responsive/keyboard evidence; no unapproved palette change |
| 2 | FE maintainers: adopt Prettier with reviewed settings and CI command | Separate initial format-only scope; lint compatibility; formatter check documented |
| 2 | FE + Backend: adopt Zod on one new/touched contract boundary | Malformed/optional/enum/number cases tested; backend contract unchanged |
| 2 | FE maintainers: pilot React Query for one interactive remote feature | Keys, private-cache clearing, retry/invalidation, cancellation and SSR isolation tested |
| 3 | Feature owners: introduce Zustand only for demonstrated shared UI need | No server cache/token duplication; reset/SSR/persistence behavior tested |
| 3 | FE maintainers: evaluate Axios browser adapter against current fetch services | Clear benefit, single-flight refresh, cancellation and error compatibility; server fetch retained |
| 3 | FE/QA: add architectural lint and browser E2E/accessibility tooling | Baseline addressed, safe fixtures, critical journeys defined and CI runs documented |
| 3 | FE/DevOps: address font network dependency and establish performance monitoring | Default reproducible build, reviewed typography and measured route budgets |
| Pending | FE architecture owners: Edura reference comparison if source becomes accessible | Inspected revision and evidence recorded; TripMate authority preserved |

For each migration:

- [ ] Identify the current behavior and approved intended change.
- [ ] Assign an owner, exact files, acceptance criteria and rollback scope.
- [ ] Confirm clean baseline and necessary dependency/API approvals.
- [ ] Add meaningful regression tests before changing behavior where applicable.
- [ ] Preserve URLs, credentials, data ownership and reviewed UI unless explicitly changed.
- [ ] Run checks; update this convention/status references if adoption changes the baseline.
- [ ] Resolve critical review findings before integration.

## 18. Definition of Done

A frontend task is complete when the approved scope is met, platform/screen gates are satisfied, boundaries and security are preserved, applicable states/responsiveness/accessibility are verified, meaningful tests and required checks are reported, and setup/contract documentation is current. No secrets, generated artifacts or unrelated changes are included. Prototype/local/demo behavior is labelled honestly. Review findings are resolved or explicitly owned, and branch finishing follows developer direction.

This convention establishes engineering policy. It does not certify production deployment, full RBAC coverage, backend integration, map/payment readiness, or adoption of the proposed libraries.

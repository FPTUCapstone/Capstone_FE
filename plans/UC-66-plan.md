# UC-66 Update Landing Page Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Screen #31 Landing Page Content Management workspace so that Backend can plug into a fixed contract later, with no fabricated success while Backend is missing.

**Architecture:** A server-guarded page renders a client screen. The screen talks only to a client service, which calls a same-origin catch-all proxy under `/api/admin/landing-content`; the proxy checks the sealed admin session and role, then forwards to `/api/v1/admin/landing-content/**` with the bearer token from the HttpOnly cookie. Same shape as UC-57 (`algorithmConfigService` / `algorithmConfigProxy`).

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library.

**Spec:** `specs/UC-66-web-screen-spec.md`

## Global Constraints

- Platform is Next.js Web only; do not touch `/`, `src/data/landingData.ts`, `src/lib/routes.ts`, `src/components/navigation/AdminNavigation.tsx`, `src/lib/server/adminSession.ts`.
- Allowed roles: `Administrator` and `Staff`; any other role fails closed (MSG126). Authorization is enforced in the proxy as well as the page (CR-11).
- All user-facing copy lives in `src/features/admin/landing-content/resources/en.ts` (CR-09).
- Exact SRS texts: MSG01 `This field is required.`; MSG65 `This tour package is currently unavailable for booking.`; MSG126 `You do not have permission to access this function.`; MSG127 `TripMate is temporarily unable to process your request. Please check your connection and try again.`; MSG129 `Operation completed successfully.`
- Images: at most 5 MB (`5 * 1024 * 1024` bytes accepted, one byte more rejected) and type `image/jpeg`, `image/png` or `image/webp` (assumption in the spec's amendment backlog).
- Dates shown as dd/MM/yyyy in `Asia/Ho_Chi_Minh` (CR-07). Banner period fields are `yyyy-MM-dd` strings; end before start is invalid, start equal to end is valid.
- Success is reported only after a `2xx` with a body that passes the type guard (CR-12). Publishing needs a CR-05 confirmation modal.
- Gates before the PR: `npm run typecheck`, `npm run lint`, `npm test`, `npx next build --webpack`, `git diff --check`.
- Commit message ends with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Decisions fixed by this plan

- A block is "in use" when any of its fields is non-empty after trimming. Hero is always in use. Rules: Hero requires headline, call-to-action label and call-to-action target; sub-headline and background image are optional. Each destination requires name, description and image. A banner in use requires image, link, start and end. Whitespace-only counts as empty.
- Field error keys are dotted paths: `hero.headline`, `hero.ctaLabel`, `hero.ctaTarget`, `destinations.<index>.name|description|image`, `banner.image|link|displayStart|displayEnd`.
- Draft concurrency uses `baseVersion: number` (published version number the draft was started from).

## Review Focus

- Whitespace-only text in a required field behaves as empty (MSG01) — Task 1.
- An image of exactly 5 MB is accepted and 5 MB + 1 byte is rejected; an `image/gif` is rejected — Task 1.
- Banner with start equal to end is valid; end before start is invalid — Task 1.
- A body from Backend missing required properties is treated as unavailable, not as empty content — Tasks 2 and 5.
- Double-clicking Publish sends exactly one request — Task 7.
- Removing or reordering destinations keeps each entry's errors attached to the right entry — Task 6.
- Unknown role cookie (not `Administrator`/`Staff`) is denied by both page and proxy — Tasks 3 and 4.

---

### Task 1: Content model, validators and copy

**Files:**
- Create: `src/features/admin/landing-content/landingContent.ts`
- Create: `src/features/admin/landing-content/resources/en.ts`
- Test: `src/features/admin/landing-content/landingContent.test.ts`

**Interfaces:**
- Produces (exported from `landingContent.ts`):
  - `interface ImageRef { mediaId: string; url: string }`
  - `interface HeroContent { headline: string; subHeadline: string; backgroundImage: ImageRef | null; ctaLabel: string; ctaTarget: string }`
  - `interface DestinationEntry { id: string; name: string; image: ImageRef | null; description: string }`
  - `interface BannerContent { image: ImageRef | null; link: string; displayStart: string; displayEnd: string }`
  - `interface LandingContent { hero: HeroContent; destinations: DestinationEntry[]; featuredTourIds: string[]; banner: BannerContent }`
  - `interface VersionSummary { versionId: string; versionNumber: number; publishedByName: string; publishedAtUtc: string }`
  - `interface LandingContentState { published: VersionSummary & { content: LandingContent }; draft: { baseVersion: number; content: LandingContent } | null; history: VersionSummary[] }`
  - `interface TourOption { tourId: string; title: string }`
  - `type ContentErrors = Record<string, string>` (value is a key of `landingContentEn.errors`)
  - `const MAX_IMAGE_BYTES: number`, `const ALLOWED_IMAGE_TYPES: readonly string[]`
  - `validateImageFile(file: { size: number; type: string }): 'tooLarge' | 'unsupportedType' | null`
  - `validateContent(content: LandingContent): ContentErrors`
  - `isLandingContentState(value: unknown): value is LandingContentState`
  - `isLandingContent(value: unknown): value is LandingContent`
  - `isVersionSummary(value: unknown): value is VersionSummary`
  - `isTourOptionList(value: unknown): value is TourOption[]`
  - `emptyContent(): LandingContent`
- Produces (`resources/en.ts`): `export const landingContentEn` with `errors` (keys `required`, `imageTooLarge`, `imageUnsupportedType`, `invalidPeriod`, `tourUnavailable`, `forbidden`, `unavailable`, `conflict`), `success` (keys `draftSaved`, `published`), plus labels for every screen element used in Tasks 5–7. Texts for `required`, `tourUnavailable`, `forbidden`, `unavailable` and `draftSaved` are the exact MSG01/65/126/127/129 texts above; `imageTooLarge`, `imageUnsupportedType`, `invalidPeriod`, `published` are descriptive copy.

- [ ] **Step 1: Write failing tests** in `landingContent.test.ts`:
  - `validateImageFile` returns `null` for `{ size: 5 * 1024 * 1024, type: 'image/png' }`, `'tooLarge'` for size `5 * 1024 * 1024 + 1`, `'unsupportedType'` for `image/gif`.
  - `validateContent(emptyContent())` has errors `hero.headline`, `hero.ctaLabel`, `hero.ctaTarget` all equal to `'required'` and no `banner.*` key.
  - Whitespace-only headline (`'   '`) yields `hero.headline: 'required'`.
  - A destination with only a name yields `destinations.0.description` and `destinations.0.image` errors and none for `destinations.0.name`.
  - A banner with only `link` filled yields `banner.image`, `banner.displayStart`, `banner.displayEnd` as `'required'`.
  - Banner start `2026-10-20`, end `2026-10-19` yields `banner.displayEnd: 'invalidPeriod'`; start equal to end yields no banner error.
  - `isLandingContentState` rejects `{}`, rejects a state whose `published.content.hero` is missing, accepts a complete state with `draft: null`.
- [ ] **Step 2: Run** `npx vitest run src/features/admin/landing-content/landingContent.test.ts` — expect FAIL (module not found).
- [ ] **Step 3: Implement** the interfaces and functions above in `landingContent.ts` and the copy in `resources/en.ts`. Type guards check every property type; keep them free of I/O.
- [ ] **Step 4: Run** the same command — expect PASS.
- [ ] **Step 5: Commit** `feat(web): add UC-66 landing content model, validators and copy`.

### Task 2: Client service

**Files:**
- Create: `src/features/admin/landing-content/landingContentService.ts`
- Test: `src/features/admin/landing-content/landingContentService.test.ts`

**Interfaces:**
- Consumes: Task 1 types and guards.
- Produces:
  - `class LandingContentError extends Error { constructor(status: number, errorCode?: string, fieldErrors?: ContentErrors) }` with public readonly `status`, `errorCode`, `fieldErrors`; status `0` means network failure or malformed body.
  - `getLandingContent(): Promise<LandingContentState>` (GET `/api/admin/landing-content`)
  - `saveDraft(baseVersion: number, content: LandingContent): Promise<{ baseVersion: number; content: LandingContent }>` (PUT `.../draft`)
  - `publishDraft(baseVersion: number): Promise<LandingContentState['published']>` (POST `.../publish`)
  - `restoreVersion(versionId: string): Promise<{ baseVersion: number; content: LandingContent }>` (POST `.../restore`)
  - `uploadImage(file: File): Promise<ImageRef>` (POST `.../media`, multipart field `file`)
  - `getApprovedTours(): Promise<TourOption[]>` (GET `.../approved-tours`)

- [ ] **Step 1: Write failing tests** with a mocked `fetch`: each function sends `credentials: 'same-origin'`, `cache: 'no-store'` and the right method and path; `saveDraft` sends JSON `{ baseVersion, content }` with `Content-Type: application/json`; a `422` body `{ errors: { 'hero.headline': 'required' } }` throws `LandingContentError` with `status 422` and those `fieldErrors`; `409`, `403`, `503` map to their status; a `200` body that fails the guard throws status `0`; `fetch` rejection throws status `0`.
- [ ] **Step 2: Run** the test file — expect FAIL.
- [ ] **Step 3: Implement** with one private `request<T>(method, path, body, guard)` helper in the style of `algorithmConfigService.request`; the multipart upload must not set `Content-Type` manually.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(web): add UC-66 landing content client service`.

### Task 3: Server proxy and API route

**Files:**
- Create: `src/features/admin/landing-content/landingContentProxy.ts`
- Create: `app/api/admin/landing-content/[[...path]]/route.ts`
- Test: `src/features/admin/landing-content/landingContentProxy.test.ts`

**Interfaces:**
- Consumes: `verifyAdminSessionFromCookies`, `isSameOriginRequest`, `jsonNoStore`, `clearAdminSession`, `ADMIN_ACCESS_TOKEN_COOKIE` from `@/lib/server/adminSession`; `fetchBackend` from `@/lib/server/backend`.
- Produces: `proxyLandingContent(request: Request, path: string[] | undefined): Promise<Response>`; the route file exports `GET`, `PUT`, `POST` that await `params` (`{ params: Promise<{ path?: string[] }> }`) and call it.

Allowlist (anything else → `404`): `GET []`, `PUT ['draft']`, `POST ['publish']`, `POST ['restore']`, `POST ['media']`, `GET ['approved-tours']`. Upstream base `/api/v1/admin/landing-content`.

- [ ] **Step 1: Write failing tests** (mock `next/headers`, `@/lib/server/backend`, `server-only`, follow `algorithmConfigProxy.test.ts`): no token cookie → `401`; invalid/unsealed session → `401` and cleared session; role `Staff` and role `Administrator` are forwarded with `Authorization: Bearer <token>`; a sealed session with any other role string → `403`; non-GET with a foreign `Origin` → `403`; a path outside the allowlist or a wrong method → `404` and no upstream call; `PUT draft` with non-JSON content type → `415`; upstream `5xx` or `fetchBackend` rejection → `503` with the MSG127 text and no raw upstream body; upstream `401` → `401` with cleared session; upstream `403/404/409/422` bodies are passed through with their status; the media upload forwards the multipart body.
- [ ] **Step 2: Run** the test file — expect FAIL.
- [ ] **Step 3: Implement** the proxy following `proxyAlgorithmParameters` (do not copy its Administrator-only check; allow both roles). Build the upstream path from the allowlist entry, never from user input.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(web): add UC-66 landing content proxy`.

### Task 4: Page route guard

**Files:**
- Create: `app/admin/(console)/landing-content/page.tsx`
- Test: `app/admin/(console)/landing-content/page.test.tsx`

**Interfaces:**
- Consumes: `verifyAdminSessionFromCookies`, `AdminAccessDeniedView`; `LandingContentScreen` from Task 5 (until then the test mocks it with `vi.mock`).
- Produces: default export `LandingContentPage(): Promise<JSX.Element>` with metadata title `Landing Page Content Management | TripMate Administration`.

- [ ] **Step 1: Write failing tests** copying the structure of `app/admin/(console)/users/page.test.tsx`: missing cookies, unsealed token, expired, tampered seal and token mismatch each call `redirect('/admin/login?returnUrl=%2Fadmin%2Flanding-content')`; `Administrator` and `Staff` render `LandingContentScreen`; a session whose role is neither (forge via `createAdminSessionSeal` only if the type allows, otherwise mock `verifyAdminSessionFromCookies`) renders `AdminAccessDeniedView`.
- [ ] **Step 2: Run** the test file — expect FAIL.
- [ ] **Step 3: Implement** the page with the same try/catch around `cookies()` used by the other admin pages; fail closed for unknown roles.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(web): add UC-66 landing content page guard`.

### Task 5: Screen shell — load, pending state, version panel

**Files:**
- Create: `src/features/admin/landing-content/LandingContentScreen.tsx` (client component, no props)
- Create: `src/features/admin/landing-content/components/VersionPanel.tsx`
- Test: `src/features/admin/landing-content/LandingContentScreen.test.tsx`, `src/features/admin/landing-content/components/VersionPanel.test.tsx`

**Interfaces:**
- Consumes: Task 2 service (mocked in tests with `vi.mock('./landingContentService')`), Task 1 types and copy.
- Produces: `LandingContentScreen`; `VersionPanel(props: { published: LandingContentState['published']; history: VersionSummary[]; onRestore: (versionId: string) => void; disabled: boolean })`. The screen keeps state `{ status: 'loading' | 'ready' | 'pending' | 'forbidden' | 'error'; data?: LandingContentState }` and passes the draft content to editor blocks in Task 6.

- [ ] **Step 1: Write failing tests**: while loading a `role="status"` element is shown and no content from a previous load; after success the published version number, `publishedByName` and the date formatted `dd/MM/yyyy` in `Asia/Ho_Chi_Minh` appear and history rows list each version; a service error with status `503` or `404` shows the pending banner containing the MSG127 text and an empty editor, never version data; status `403` shows the MSG126 text; status `401` calls `window.location.assign('/admin/login?returnUrl=%2Fadmin%2Flanding-content')`; a malformed body (status `0`) shows the MSG127 text with a Retry button that reloads.
- [ ] **Step 2: Run** both test files — expect FAIL.
- [ ] **Step 3: Implement** `LandingContentScreen` (load on mount, state machine above) and `VersionPanel`. Format dates with `Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', ... })`.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(web): add UC-66 landing content screen shell`.

### Task 6: Editor blocks, validation, Save Draft and Preview

**Files:**
- Create: `src/features/admin/landing-content/components/HeroBlock.tsx`, `DestinationsBlock.tsx`, `FeaturedToursBlock.tsx`, `BannerBlock.tsx`, `ImageField.tsx`, `PreviewPanel.tsx`
- Modify: `src/features/admin/landing-content/LandingContentScreen.tsx`
- Test: one `*.test.tsx` per new component plus additions to `LandingContentScreen.test.tsx`

**Interfaces:**
- Consumes: Task 1 validators, Task 2 `saveDraft`, `uploadImage`, `getApprovedTours`.
- Produces: block components share the props shape `{ value: T; errors: ContentErrors; onChange: (next: T) => void; disabled: boolean }` (`T` is the block's content type; `DestinationsBlock` value is `DestinationEntry[]`; `FeaturedToursBlock` value is `string[]` and also takes `tours: TourOption[]`); `ImageField(props: { label: string; value: ImageRef | null; error?: string; onChange: (next: ImageRef | null) => void; disabled: boolean })` validates with `validateImageFile`, rejects an invalid file with its message and keeps all other input, otherwise calls `uploadImage`; `PreviewPanel(props: { content: LandingContent })` renders text and images read-only and calls no service.

- [ ] **Step 1: Write failing tests**: each required field has an accessible label and shows the `required` text under the field when the screen validates; selecting a 5 MB + 1 byte file shows the `imageTooLarge` copy, does not call `uploadImage` and leaves other fields unchanged; destination add, remove and move up/down keep errors on the right entry (remove entry 0 when entry 1 has a name error: the error now sits on index 0); Save Draft is disabled until the form is dirty and valid, calls `saveDraft(baseVersion, content)` once, shows the `draftSaved` toast text (MSG129) only after a valid response, and a `422` response maps `fieldErrors` onto the fields; Preview shows the draft and the `saveDraft`/`publishDraft` mocks are not called; featured tours list only the tours returned by `getApprovedTours`.
- [ ] **Step 2: Run** the new tests — expect FAIL.
- [ ] **Step 3: Implement** the blocks and wire them into the screen with a single `draft` state and a `dirty` flag computed against the loaded content. Give every control an accessible name; disable controls while a request is in flight.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(web): add UC-66 landing content editor, draft saving and preview`.

### Task 7: Publish, restore and error mapping

**Files:**
- Create: `src/features/admin/landing-content/components/PublishDialog.tsx`
- Modify: `src/features/admin/landing-content/LandingContentScreen.tsx`
- Test: `src/features/admin/landing-content/components/PublishDialog.test.tsx`, additions to `LandingContentScreen.test.tsx`

**Interfaces:**
- Consumes: Task 2 `publishDraft`, `restoreVersion`, Task 5 `VersionPanel.onRestore`.
- Produces: `PublishDialog(props: { open: boolean; busy: boolean; onConfirm: () => void; onCancel: () => void })` — `role="dialog"`, `aria-modal`, focus moves into the dialog, Tab wraps inside it, Escape calls `onCancel`, focus returns to the Publish button on close.

- [ ] **Step 1: Write failing tests**: Publish validates first; invalid content shows field errors and opens no dialog; valid content opens the dialog and sends no request until confirmed; confirming twice quickly calls `publishDraft` once; success updates the version panel and shows the `published` copy only after a response that passes the guard; `5xx`/network failure shows the MSG127 text, keeps the previous published version displayed and offers Retry; `409` shows the `conflict` copy with a Reload action that reloads state; `422` with `{ errors: { 'featuredTourIds.<id>': 'tourUnavailable' } }` shows the MSG65 text on that tour and does not close as published; Restore calls `restoreVersion(versionId)`, loads the returned content into the draft and marks it dirty; Escape closes the dialog without a request.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** the dialog and the publish/restore handlers; guard re-entry with an in-flight flag.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(web): add UC-66 publish confirmation and restore`.

### Task 8: Verification and hand-off notes

**Files:**
- Modify: `specs/UC-66-web-screen-spec.md` (only to update the SRS amendment backlog if new gaps appeared)

- [ ] **Step 1: Run** `npm run typecheck`, `npm run lint`, `npm test`, `npx next build --webpack`, `git diff --check`; expect no errors (pre-existing lint warnings outside this change are acceptable and must be named).
- [ ] **Step 2: Manual check** at 1440, 768 and 320 px: no horizontal page overflow, keyboard-only operation of every block and the dialog.
- [ ] **Step 3: Write the PR description** listing: proposed Backend contract (link to the spec), the actor decision and the `WEB_SCOPE_MATRIX` line 151 follow-up for DatMNT, the suggested additive patch for `src/lib/routes.ts` (`admin.landingContent: '/admin/landing-content'`) and `AdminNavigation.tsx`, the SRS amendment backlog, and the exact command output from Step 1.
- [ ] **Step 4: Commit** any spec updates; do not push until the developer says so.

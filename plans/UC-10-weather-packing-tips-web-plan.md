# Weather packing tips on the itinerary page (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Show a read-only "Thời tiết ngày dd/MM" card with the backend's weather tips on the itinerary detail page, hidden whenever the backend has nothing.

**Architecture:** A never-throwing API function (`getItineraryWeatherTips`) with a contract check, a hook that requests once per itinerary after the detail has loaded and can be aborted, and a presentational card. The page mounts the hook and the card between the summary cards and the booked services.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest + Testing Library, Tailwind, Material Symbols (already loaded).

**Spec:** `specs/UC-10-weather-packing-tips-web-spec.md` (approved 2026-11-24). Backend contract: `Capstone_BE` PR #204.

## Global Constraints
- npm only; keep `package-lock.json` untouched. Pre-PR gate: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- No new library, no global state, no new route, no storage.
- Copy is Vietnamese and fixed: title `Thời tiết ngày dd/MM`; summary line `22–31°C · Mưa tối đa 60% · UV 8` (en dash; rounding already done by the backend); empty list sentence `Thời tiết thuận lợi, không cần chuẩn bị đặc biệt.`; region label `Gợi ý theo thời tiết`.
- The card shows the backend's `text` unchanged and in the received order; it never adds, translates or reorders tips.
- Warning style: `bg-amber-50 text-amber-700 border-amber-200` with a `warning` icon; Info tips use the neutral card style of `ItinerarySummaryCards` (`border-[#DCE2DD]`, `text-[#1C2928]`).
- All visible failures are silent: no banner, skeleton or retry (H2).
- Tests run from PowerShell (repo quirk). Existing page tests must keep passing without edits unless a test counts `fetch` calls (check in Task 4).

## Review Focus
- Weather request must not start before the itinerary loaded, and must not repeat after an edit changes the itinerary object (H1, H3). Task 3 tests.
- Unmount / id change must abort the request and a late answer must never show on another itinerary. Task 3 tests.
- A 200 with a wrong shape (missing `summary`, `tips` not an array, unknown `severity`) is treated as `null`, not rendered. Task 1 tests.
- `date` is formatted by string, never through `Date`, so the day cannot shift with the browser's time zone. Task 2 test `date 2026-11-25 shows 25/11`.
- The page still works when the weather request rejects or never settles. Task 4 tests.

---

### Task 1: Types, contract check and API function

**Files:**
- Modify: `src/features/scheduling/types/schedulingTypes.ts` (after `isValidItineraryDetailDto`)
- Modify: `src/features/scheduling/services/schedulingApi.ts` (next to `getItineraryById` / suggestions)
- Test: `src/features/scheduling/__tests__/schedulingApi.weatherTips.test.ts`

**Interfaces:**
- Produces (types file):
  - `export interface WeatherTipDto { code: string; severity: 'Info' | 'Warning'; text: string }`
  - `export interface WeatherTipsSummaryDto { minTempC: number; maxTempC: number; maxRainProbabilityPercent: number; maxUvIndex: number }`
  - `export interface WeatherTipsDto { date: string; timeZoneId: string; forecastAtUtc: string; summary: WeatherTipsSummaryDto; tips: WeatherTipDto[] }`
  - `export function parseWeatherTipsResponse(body: unknown): WeatherTipsDto | null` — accepts `{ weatherTips: null | WeatherTipsDto }`; returns the dto when every field has the right type, `date` matches `^\d{4}-\d{2}-\d{2}$`, `severity` is `Info` or `Warning`, `tips` is an array; returns `null` for `weatherTips: null` and for anything malformed.
- Produces (api file): `export async function getItineraryWeatherTips(itineraryId: number, options?: { accessToken?: string; signal?: AbortSignal }): Promise<WeatherTipsDto | null>` — `GET ${getApiBase()}/itineraries/${itineraryId}/weather-tips` through `requestJson` (token from `options.accessToken ?? AuthStorage.getContext()?.accessToken`); returns the parsed dto on 200, `null` on every other status, on a network error and on a malformed body; rethrows only an `AbortError`. An invalid id (`!isValidItineraryId`) returns `null` without a request.

- [ ] **Step 1: Write failing tests** (mock `fetch` as `schedulingApi.test.ts` does): `returns the tips on 200`; `returns null for { weatherTips: null }`; `returns null for 401, 403, 404 and 500`; `returns null when fetch rejects (network error)`; `returns null for a body without summary / tips not an array / severity "Critical" / date "25/11/2026"`; `rejects with AbortError when aborted`; `sends the bearer token and calls /itineraries/42/weather-tips`; `invalid id returns null without calling fetch`.
- [ ] **Step 2:** `npx vitest run src/features/scheduling/__tests__/schedulingApi.weatherTips.test.ts` — Expected: FAIL (missing exports).
- [ ] **Step 3:** Implement the types, `parseWeatherTipsResponse` (use `isRecord` from `@/lib/typeGuards`) and `getItineraryWeatherTips`.
- [ ] **Step 4:** Same command — Expected: PASS.
- [ ] **Step 5:** Commit `feat(scheduling): read weather tips for an itinerary (UC-10)`.

### Task 2: The card

**Files:**
- Create: `src/features/scheduling/components/ItineraryWeatherTipsCard.tsx`
- Test: `src/features/scheduling/__tests__/ItineraryWeatherTipsCard.test.tsx`

**Interfaces:**
- Consumes: `WeatherTipsDto` (Task 1).
- Produces: `export function ItineraryWeatherTipsCard({ tips }: { tips: WeatherTipsDto }): JSX.Element` — `<section role="region" aria-label="Gợi ý theo thời tiết">`, header with title and summary line, then a `<ul>`; each tip is a `<li>` (Warning: icon `warning`, amber classes; Info: neutral classes, dot); empty `tips` renders the empty-list sentence instead of the `<ul>`. Material icons are `aria-hidden`; a Warning `<li>` also carries `data-severity="Warning"` for tests.

- [ ] **Step 1: Write failing tests**: `shows the title with day and month from date` (2026-11-25 -> `Thời tiết ngày 25/11`, and does not change under `TZ`-shifted `Date`: no `Date` used); `shows the summary line` (`22–31°C · Mưa tối đa 60% · UV 8`); `lists tips in the received order with the backend text`; `marks a Warning tip with data-severity and a warning icon, an Info tip without`; `shows the empty sentence and no list when tips is empty`; `exposes a region named "Gợi ý theo thời tiết"`.
- [ ] **Step 2:** `npx vitest run src/features/scheduling/__tests__/ItineraryWeatherTipsCard.test.tsx` — Expected: FAIL.
- [ ] **Step 3:** Implement the component with the copy and classes of Global Constraints; format the date as `${day}/${month}` by splitting the string.
- [ ] **Step 4:** Same command — Expected: PASS.
- [ ] **Step 5:** Commit `feat(scheduling): add the itinerary weather tips card (UC-10)`.

### Task 3: The hook

**Files:**
- Create: `src/features/scheduling/components/useItineraryWeatherTips.ts`
- Test: `src/features/scheduling/__tests__/useItineraryWeatherTips.test.tsx`

**Interfaces:**
- Consumes: `getItineraryWeatherTips` (Task 1).
- Produces: `export function useItineraryWeatherTips(args: { itineraryId: number; itinerary: { itineraryId: number } | null }): WeatherTipsDto | null` — `'use client'`. Requests once the loaded itinerary has `itinerary.itineraryId === itineraryId`; the effect depends only on `itineraryId` and that boolean (so an edited itinerary object does not re-request); passes an `AbortController` signal, aborts on cleanup; ignores a rejected promise; keeps `{ itineraryId, tips }` in state and returns `tips` only when its id equals the current `itineraryId`.

- [ ] **Step 1: Write failing tests** (`renderHook`, `vi.spyOn(schedulingApi, 'getItineraryWeatherTips')`): `does not request while the itinerary is null`; `requests once after the itinerary has loaded and returns the tips`; `does not request again when the itinerary object changes but keeps the same id`; `aborts the request on unmount and ignores its late answer`; `a late answer for the previous id is not returned after the id changes` (id 1 pending, rerender id 2, resolve id 1, expect `null`); `returns null when the request rejects`; `returns null when the API answers null`.
- [ ] **Step 2:** `npx vitest run src/features/scheduling/__tests__/useItineraryWeatherTips.test.tsx` — Expected: FAIL.
- [ ] **Step 3:** Implement the hook.
- [ ] **Step 4:** Same command — Expected: PASS.
- [ ] **Step 5:** Commit `feat(scheduling): load weather tips after the itinerary (UC-10)`.

### Task 4: Mount on the page

**Files:**
- Modify: `src/features/scheduling/components/ViewSuggestedItineraryPage.tsx` (import, hook call near `useExplanationRefresh` ~line 298, card between `ItinerarySummaryCards` and `BookedServices` ~line 729-730)
- Test: `src/features/scheduling/__tests__/ViewSuggestedItineraryPage.weather.test.tsx` (reuse the mocks and `detail()` fixture style of `ViewSuggestedItineraryPage.explanation.test.tsx`)

**Interfaces:**
- Consumes: `useItineraryWeatherTips`, `ItineraryWeatherTipsCard`.
- Produces: the page renders `<ItineraryWeatherTipsCard tips={weatherTips} />` only when `weatherTips !== null`.

- [ ] **Step 1: Write failing tests**: `shows the weather card between the summary and the booked services` (compare `compareDocumentPosition` of the region with the summary stat text `Tổng thời lượng`); `shows no card and no error when the weather request returns null`; `shows no card and the itinerary normally when the weather request rejects`; `requests weather once for the itinerary id`; `does not request weather before the itinerary has loaded` (spy not called while `getItineraryById` is pending).
- [ ] **Step 2:** `npx vitest run src/features/scheduling/__tests__/ViewSuggestedItineraryPage.weather.test.tsx` — Expected: FAIL.
- [ ] **Step 3:** Add the hook call and the conditional card.
- [ ] **Step 4:** Run the new test, then all of `src/features/scheduling` (`npx vitest run src/features/scheduling`) — Expected: PASS. If an existing test counts `fetch` calls and now sees the extra weather call, make that test's mock return `null` for `getItineraryWeatherTips` via `vi.spyOn`; do not change product code for it.
- [ ] **Step 5:** Commit `feat(scheduling): show weather tips on the itinerary page (UC-10)`.

### Task 5: Verification
- [ ] **Step 1:** In PowerShell from the worktree: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Expected: all pass (note the repo's known vitest pool quirk if a run is flaky: rerun the failing file alone and report it).
- [ ] **Step 2:** `git status` shows only the files of this plan (and no `tsconfig.tsbuildinfo` change).
- [ ] **Step 3:** Hand over: BE endpoint not deployed, so this is verified with mocks only; push / PR only on the developer's go.

## Later
- **Mobile (`Capstone_Mobile`)**: own spec and plan after this PR is reviewed.
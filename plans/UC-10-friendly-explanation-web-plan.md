# UC-10 Web: show the AI explanation. Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task by task. Steps use checkbox syntax.

**Goal:** The Web shows `friendlyExplanation` and refreshes the itinerary detail after a create that answered `explanationPending: true`.

**Architecture:** Types and validators accept the new fields. A pure presentation helper picks the sentence. A tab-scoped in-memory handoff (same pattern as `itineraryEditHandoff.ts`) carries the "pending" flag and the template sentences from the create form to the detail page. A hook on the detail page refreshes on a fixed schedule measured from `createdAt`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest + Testing Library (jsdom).

**Spec:** `specs/UC-10-friendly-explanation-web-spec.md`

## Global Constraints
- Schedule: 20, 45, 75, 110 seconds after `createdAt` (not after page mount).
- Sentence shown: trimmed non-empty `friendlyExplanation`, else trimmed non-empty `recommendationReason`, never both.
- Handoff entry is taken only when `itineraryId` matches; read once.
- No new UI element. No backend change. Run tests from PowerShell (`npx vitest run <path>`), not Git Bash (path casing breaks vitest).
- Baseline: `npx vitest run src/features/scheduling` = 351 passed. `tsc --noEmit` already fails on missing `gsap` / `@microsoft/signalr`; compare only errors in `src/features/scheduling`.

## Review Focus
1. `friendlyExplanation` of only spaces: must not hide `recommendationReason` (Task 2).
2. Handoff for another itinerary id: must not be consumed or used (Task 3).
3. Attempt fails (network / 5xx): ignored, later attempts still run (Task 4).
4. Page unmounts while an attempt is in flight: no state update (Task 4).
5. Page opened after 110 s, or a fresh detail whose `sequenceNo` set differs: no request / no crash (Tasks 3, 4).

---

### Task 1: DTO fields and validators
**Files:** Modify `src/features/scheduling/types/schedulingTypes.ts` (interfaces near lines 55-70 and 170-195; validators `isValidItineraryDetailDto` ~276, `isValidSchedulingResponseDto` ~357). Test: `src/features/scheduling/__tests__/schedulingTypes.explanation.test.ts`.

**Produces:** `SchedulingItemDto.friendlyExplanation?: string | null`, `ItineraryDetailItemDto.friendlyExplanation?: string | null`, `SchedulingResponseDto.explanationPending?: boolean`.

- [ ] Write tests: a valid create response and detail still pass without the fields; they pass with `friendlyExplanation: 'x'` / `null` and `explanationPending: true`; `friendlyExplanation: 5` and `explanationPending: 'yes'` make the validators return false.
- [ ] Run `npx vitest run src/features/scheduling/__tests__/schedulingTypes.explanation.test.ts`; expect the two rejection tests to FAIL.
- [ ] Add the fields; in both validators use the existing `isOptional(value, isString)` / `isOptional(value, isBoolean)` helpers.
- [ ] Run the same file; expect PASS. Commit `feat(scheduling): accept friendlyExplanation and explanationPending in DTOs`.

### Task 2: Choose the sentence and render it
**Files:** Modify `src/features/scheduling/utils/itineraryPresentation.ts`, `src/features/scheduling/components/ItineraryTimeline.tsx` (block at ~319-326). Test: `__tests__/itineraryPresentation.test.ts`, `__tests__/ItineraryTimeline.test.tsx`.

**Produces:** `stopExplanation(item: { friendlyExplanation?: string | null; recommendationReason?: string | null }): string | null`.

- [ ] Write tests for `stopExplanation`: friendly wins over reason; `null`, `''` and `'   '` friendly fall back to reason; both empty or whitespace returns `null`; output is trimmed. Timeline tests: with friendly it renders the friendly text and the reason text is absent; with `'   '` friendly it renders the reason.
- [ ] Run both files; expect FAIL.
- [ ] Implement `stopExplanation`; in the Timeline compute it once per item and render the existing paragraph (same icon and classes) when it is not null.
- [ ] Run both files plus `ViewSuggestedItineraryPage*.test.tsx`; expect PASS. Commit `feat(scheduling): show friendlyExplanation with recommendationReason as fallback`.

### Task 3: Pending handoff and comparison helpers
**Files:** Create `src/features/scheduling/utils/explanationRefresh.ts`. Test: `__tests__/explanationRefresh.test.ts`.

**Produces:**
- `EXPLANATION_REFRESH_DELAYS_SECONDS: readonly [20, 45, 75, 110]`
- `interface ExplanationPendingHandoff { itineraryId: number; createdAt: number; template: ReadonlyMap<number, string> }`
- `registerExplanationPending(response: SchedulingResponseDto, now?: number): void` (no-op unless `explanationPending === true`; template = trimmed `friendlyExplanation ?? ''` by `sequenceNo`)
- `takeExplanationPending(itineraryId: number): ExplanationPendingHandoff | null`
- `hasNewExplanation(template: ReadonlyMap<number, string>, items: readonly { sequenceNo: number; friendlyExplanation?: string | null }[]): boolean` (true when some item has a non-empty trimmed sentence differing from `template.get(sequenceNo)`; an item whose `sequenceNo` is not in the template counts as differing when non-empty)
- `mergeExplanations(current: ItineraryDetailDto, fresh: ItineraryDetailDto): ItineraryDetailDto` (copies only `friendlyExplanation` from `fresh` items with the same `sequenceNo` that have a non-empty sentence; returns `current` itself when nothing changes)

- [ ] Write tests: register with `explanationPending` false and missing stores nothing; register + take returns the entry once, second take is `null`; `take(otherId)` returns `null` and the entry is still there for the right id; template is trimmed and keyed by `sequenceNo`; `hasNewExplanation` false for equal text, for whitespace-only and for null; true for a changed sentence; `mergeExplanations` leaves other fields (`isNavigationInProgress`, ids) untouched, ignores fresh items with unknown `sequenceNo` and returns the same reference when unchanged.
- [ ] Run; expect FAIL (module missing). Implement with a module-level `Map<number, ExplanationPendingHandoff>`. Run; expect PASS.
- [ ] Commit `feat(scheduling): add pending-explanation handoff and comparison helpers`.

### Task 4: Refresh hook, page wiring, form registration
**Files:** Create `src/features/scheduling/components/useExplanationRefresh.ts`. Modify `ViewSuggestedItineraryPage.tsx` (state `itinerary` at ~97; loader effect ~249), `CreateSchedulingRequestForm.tsx` (success branch ~362-374). Test: `__tests__/useExplanationRefresh.test.tsx`, `__tests__/ViewSuggestedItineraryPage.explanation.test.tsx`, a case in the existing form test file.

**Interfaces:**
- Consumes: Task 3 exports; `getItineraryById` from `../services/schedulingApi`.
- Produces: `useExplanationRefresh(args: { itineraryId: number; itinerary: ItineraryDetailDto | null; onFresh: (fresh: ItineraryDetailDto) => void }): void`.

Behavior: takes the handoff once per mount (a ref, so a StrictMode effect re-run does not lose it) the first time `itinerary` is non-null and its `itineraryId` equals the hook's. If `hasNewExplanation(template, itinerary.items)` already, do nothing. Otherwise for each delay whose time `createdAt + delay*1000` is still in the future, `setTimeout` for the remaining time; each timer calls `getItineraryById`, ignores errors, calls `onFresh(fresh)` and clears the other timers when `hasNewExplanation` is true. Cleanup clears all timers and sets a cancelled flag checked before `onFresh`.

- [ ] Hook tests with `vi.useFakeTimers()` and `getItineraryById` mocked: no handoff means no calls; calls happen at 20/45/75/110 s from `createdAt`; mounting at `createdAt + 30 s` skips the 20 s attempt; stops after the first fresh result with a changed sentence (no later call); a rejected attempt does not stop later ones; unmount before an in-flight promise resolves means `onFresh` is not called; handoff for another id is not consumed; initial itinerary already with the AI sentence means zero calls; mounting after 110 s means zero calls.
- [ ] Run; expect FAIL. Implement the hook. Run; expect PASS.
- [ ] Page wiring: call `useExplanationRefresh` in `ViewSuggestedItineraryPage` with `onFresh = (fresh) => setItinerary(prev => prev && prev.itineraryId === fresh.itineraryId ? mergeExplanations(prev, fresh) : prev)`. Page test: register a handoff, render the page with fake timers, `getItineraryById` first returns template text then AI text; after advancing to 45 s the stop shows the AI sentence and `getItineraryById` was called exactly twice.
- [ ] Form wiring: call `registerExplanationPending(result.data)` right after `setGeneratedItinerary(result.data)`. Form test: a create response with `explanationPending: true` makes `takeExplanationPending(itineraryId)` non-null; with `false` it is null.
- [ ] Run `npx vitest run src/features/scheduling`; expect all PASS (351 + new). Commit `feat(scheduling): refresh itinerary detail until the AI explanation arrives`.

### Task 5: Verification and docs
- [ ] `npx vitest run src/features/scheduling` and `npx eslint src/features/scheduling` pass; `npx tsc --noEmit` shows no error under `src/features/scheduling`.
- [ ] Add one paragraph on the Web behavior to `docs/UC10-...` if such a doc exists, otherwise skip. Commit.
- [ ] Present merge / PR / keep / discard to the developer (FE AGENTS.md: no push or PR unprompted).

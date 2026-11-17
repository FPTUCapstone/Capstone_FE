# UC-10: Show the AI explanation on the Web

Status: design approved by the developer on 2026-11-17. Follows `Capstone_BE/specs/UC-10-background-explanation-spec.md`
section 6 (BE PR #176, merged). Mobile follows in its own PR.

## Intent

With background mode on, the backend answers a create request at once with template sentences and writes the AI
sentence afterwards (`explanationPending: true`). The Web reads none of this: it only shows `recommendationReason`.
Travelers see no difference until the Web shows `friendlyExplanation` and fetches the itinerary again once the AI has
finished.

## Goals

1. Show `friendlyExplanation` where `recommendationReason` is shown today (`ItineraryTimeline`). The two are never
   shown together.
2. After a create that answered `explanationPending: true`, reload the itinerary detail a few times and show the AI
   sentences as soon as they arrive.

## Non-goals

- No "AI is rewriting" indicator, no skeleton, no toast. The text just changes (decided).
- No backend change and no new endpoint. The detail has no pending flag (BE spec B6).
- No polling for itineraries the traveler opens later from the trip list, or after a reload. Their stored sentences
  are already the AI's.
- No Mobile work here.

## Behavior

### Which sentence is shown (`stopExplanation`)
`friendlyExplanation.trim()` when it is not empty, else `recommendationReason.trim()` when it is not empty, else
nothing. A whitespace-only `friendlyExplanation` must never hide `recommendationReason`.

### Carrying the flag across the navigation
The create form only shows a banner with a link to `/itinerary/{id}`; the detail page is a fresh mount. Same pattern
as `itineraryEditHandoff.ts`: a tab-scoped in-memory store.

- On a successful create with `explanationPending === true` the form registers
  `{ itineraryId, createdAt (ms), template }`, where `template` maps `sequenceNo` to the trimmed template sentence.
  Any other response registers nothing.
- The detail page takes the entry only when `itineraryId` equals the page's itinerary; an entry for another id stays
  where it is. An entry is read once.

### Refresh schedule
- Delays after `createdAt`: 20, 45, 75 and 110 seconds (BE spec section 6). The clock is `createdAt`, not the page
  mount: a delay that has already passed when the page mounts is skipped.
- Each attempt calls `getItineraryById(itineraryId)`.
- The AI sentence has arrived when at least one item (matched by `sequenceNo`) has a non-empty trimmed
  `friendlyExplanation` that differs from its template text.
- Stop at once when: the AI sentence has arrived, the attempts are used up, or the traveler leaves the page.
  If the detail the page loaded first already has the AI sentence, no attempt is made at all.
- A failed attempt (network, 4xx, 5xx) is ignored and does not use up the other attempts. No error is shown.
- A fresh detail updates only `friendlyExplanation` of the items already on screen (matched by `sequenceNo`); every
  other piece of page state, such as an edit in progress, stays as it is.

## Contract changes (types only)
- `SchedulingItemDto.friendlyExplanation?: string | null`, `ItineraryDetailItemDto.friendlyExplanation?: string | null`,
  `SchedulingResponseDto.explanationPending?: boolean`.
- Both validators accept these fields when missing or null and reject a wrong type.

## Approaches considered
1. **In-memory handoff keyed by itinerary id, schedule measured from `createdAt`** (chosen): same pattern the repo
   already uses; fits the BE rule that nothing about the waiting list is stored.
2. `sessionStorage`: survives a reload, but after a reload the timing would be wrong and the template baseline stale.
3. Ask the BE for a pending flag on the detail: contradicts BE spec B6.

## Acceptance criteria
1. A stop with `friendlyExplanation` shows it and not `recommendationReason`; with null, empty or whitespace-only
   `friendlyExplanation` it shows `recommendationReason`.
2. Create with `explanationPending: true`, open the detail, AI answers at about 40 s: the stop text becomes the AI
   sentence at the 45 s attempt and no further request is sent.
3. Create with `explanationPending: false` or missing: the detail page makes no extra request.
4. Opening the detail of another itinerary does not consume or use the entry.
5. Leaving the page cancels pending attempts; no state update after unmount.
6. Opening the detail after 110 s makes no extra request.

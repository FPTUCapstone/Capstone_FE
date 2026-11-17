# Implementation Plan — UC-68 Submit Post-Trip Complaint (Frontend)

**Status:** Ready for implementation approval  
**Source specification:** [`specs/UC-68-submit-post-trip-complaint-fe-spec.md`](../specs/UC-68-submit-post-trip-complaint-fe-spec.md)  
**Scope:** Traveler Web only. The plan does not implement UC-69, UC-75, refunds, evidence retrieval, or any Operator/Staff/Admin action.

> `plans/UC-68-frontend-plan.md` is an unrelated historical plan for **View Audit Logs**. This plan intentionally has a distinct filename and does not replace it.

## 0. Preconditions and non-negotiable contract gate

Before production wiring, confirm that Backend exposes and documents both authenticated Traveler resources:

```text
GET  /api/v1/traveler/bookings/{bookingId}/post-trip-complaint
POST /api/v1/traveler/bookings/{bookingId}/post-trip-complaints
```

The GET resource must return the server-authoritative context from the approved FE spec: booking/end/deadline, `canSubmit`, `ineligibilityReason`, and nullable existing complaint with only safe evidence metadata. The POST resource must preserve the approved multipart names (`reasonCategory`, `reasonDetail`, repeated `evidence`), UUID `Idempotency-Key`, `201` fresh / `200` replay semantics, and error codes.

Do not substitute local dates, Trip History tab state, demo data, or client-calculated deadlines for this contract. If the GET endpoint is not available on the target Backend, implement its BFF/client tests against fixtures only and leave live integration explicitly blocked rather than showing an optimistic form.

## 1. Establish the complaint feature contract and local UX validation (TDD)

### Files

- **NEW** `src/features/complaints/submit/types/postTripComplaint.ts`
- **NEW** `src/features/complaints/submit/services/postTripComplaintResponse.ts`
- **NEW** `src/features/complaints/submit/services/postTripComplaintResponse.test.ts`
- **NEW** `src/features/complaints/submit/schemas/postTripComplaintValidation.ts`
- **NEW** `src/features/complaints/submit/schemas/postTripComplaintValidation.test.ts`
- **NEW** `src/features/complaints/submit/resources/en.ts` (or extend the established shared message-catalogue module if it already owns these backend codes)

### Work

1. Define narrow, read-only TypeScript types for complaint context, existing complaint, safe evidence metadata, submit input, and submit response. Keep IDs as decimal strings when the backend may exceed JavaScript safe-integer range.
2. Add runtime parsers for GET and successful POST JSON. Reject malformed data as a safe `complaint.invalid_response` / generic system failure; never cast untrusted JSON directly into a UI type.
3. Define the six approved category values and their display-message keys in one module. Do not use free-text categories or duplicate the list across components.
4. Implement pure client UX validation:
   - required category;
   - trimmed non-empty detail, maximum 2,000 characters;
   - JPG/JPEG, PNG, WebP, PDF only;
   - at most 5 files; at most 10 MB each; at most 30 MB total;
   - invalid newly selected files are rejected without removing already valid selections.
5. Map only approved backend codes to MSG127 and MSG157–MSG161 catalogue entries. Never render backend `detail`, trace IDs, storage keys, or raw exception text.

### Verification

Write failing tests first for valid parsing, malformed payload rejection, all six categories, whitespace-only/2,001-character detail, per-file/aggregate/count boundaries, rejected additions preserving valid files, and safe error-code mapping.

## 2. Add authenticated BFF GET and multipart POST boundaries (TDD)

### Files

- **NEW** `src/features/complaints/submit/services/postTripComplaintProxy.ts`
- **NEW** `src/features/complaints/submit/services/postTripComplaintProxy.test.ts`
- **NEW** `app/api/v1/traveler/bookings/[bookingId]/post-trip-complaint/route.ts`
- **NEW** `app/api/v1/traveler/bookings/[bookingId]/post-trip-complaints/route.ts`

### Work

1. Follow the existing server-only Traveler proxy pattern in `src/features/bookings/services/ticketProxy.ts` and the bounded multipart pattern in `src/features/reviews/services/canonicalReviewProxy.ts`.
2. Validate the decimal booking ID before contacting Backend.
3. Exchange the HttpOnly `tripmate_refresh` cookie server-side, require the `Traveler` role, and send the bearer token only upstream. The browser must never receive the token.
4. Implement GET forwarding with `Cache-Control: no-store`; parse and sanitize its successful response through the feature parser.
5. Implement POST forwarding with same-origin protection, a bounded request body (30 MB files plus reviewed multipart overhead), and a strictly allow-listed multipart shape. Preserve the original file bytes/names safely, but reconstruct the multipart boundary server-side as the review proxy does.
6. Forward an RFC-4122 UUID `Idempotency-Key` only for POST. Reject malformed/missing client keys with a safe validation error; do not mint keys in the proxy because replay identity belongs to the browser's logical submission.
7. Forward only safe error codes and status classes. Map unknown upstream/server failures to MSG127, and do not log multipart data, evidence names, cookies, or authorization headers.

### Verification

Write proxy/route tests before implementation for: invalid IDs, no refresh cookie, non-Traveler refresh response, GET upstream route/auth header/no-store behavior, POST same-origin rejection, body-size rejection, exact backend path, forwarded idempotency key, allowed multipart parts, unsafe/extra parts rejected, 201 and replay 200 responses, safe error filtering, and malformed success response to 502.

## 3. Implement same-origin browser clients and idempotency lifecycle (TDD)

### Files

- **NEW** `src/features/complaints/submit/services/postTripComplaintApi.ts`
- **NEW** `src/features/complaints/submit/services/postTripComplaintApi.test.ts`

### Work

1. Implement `getPostTripComplaintContext(bookingId, signal)` against the singular same-origin BFF route with `cache: 'no-store'`.
2. Implement `submitPostTripComplaint(bookingId, input, idempotencyKey, signal)` with `FormData` and the exact keys: `reasonCategory`, `reasonDetail`, repeated `evidence`.
3. Never manually set multipart `Content-Type`; the browser supplies its boundary. Use `credentials: 'same-origin'` and only the UUID idempotency header.
4. Represent expected API failures as a typed safe error so components can preserve the form and choose MSG157/158/159/160/127 correctly.
5. In the form state machine, retain one UUID while the unchanged form is retried. Invalidate/mint a new UUID only after the category, trimmed detail, or evidence list changes. Do not use localStorage or sessionStorage for complaint persistence.

### Verification

Test exact URLs, headers, multipart keys/duplicates, no manually specified `Content-Type`, aborted requests, fresh 201, replay 200, mapped errors, one unchanged retry key, and new-key behavior after each meaningful field/file mutation.

## 4. Add the route and authoritative state composition

### Files

- **NEW** `app/bookings/[id]/complaint/page.tsx`
- **NEW** `src/features/complaints/submit/components/PostTripComplaintPage.tsx`
- **NEW** `src/features/complaints/submit/components/PostTripComplaintPage.test.tsx`
- **MODIFY** `src/lib/routes.ts`

### Work

1. Add `ROUTES.bookingComplaint(bookingId)` and use encoded booking IDs everywhere. Do not hard-code pathname strings in entry components.
2. Keep the App Router page as Server Component route composition/metadata. Keep only the context fetch, interactive form, file picker, and navigation outcome in a narrow client component.
3. On direct load or refresh, fetch the BFF context and render exactly one state:
   - loading;
   - eligible Form;
   - closed/ineligible outcome (MSG157 for a closed complaint window, no form);
   - existing complaint read-only detail (MSG158, no form);
   - role-safe authentication/not-found/unknown failure.
4. Never decide eligibility from `TripListItem`, query parameters, browser time, or a preloaded Trip History record. After submit/replay, re-fetch context and render the returned server state.
5. Add the chosen booking-history/detail return route as a local constant using `ROUTES.account.trips`; Cancel must use `router.push()` to this in-app route, not `router.back()`.

### Verification

Test direct page context rendering, loading/error/closed/existing/form state exclusivity, no form in MSG157/MSG158 cases, server refresh after success/replay, and safe Cancel navigation.

## 5. Integrate the entry point with the existing Traveler trip detail

### Files

- **MODIFY** `src/features/trips/components/TripDetailDialog.tsx`
- **MODIFY** `src/features/trips/components/TripHistoryView.tsx` only if needed to preserve the currently opened commerce-booking detail on return
- **MODIFY** `src/features/trips/resources/en.ts` or the approved shared locale catalogue
- **NEW / MODIFY TESTS** `src/features/trips/components/TripDetailDialog.test.tsx` and related Trip History tests

### Work

1. The currently implemented Traveler booking detail is the commerce-booking section of `TripDetailDialog`; place the entry action there, rather than inventing a second unapproved booking-detail screen.
2. Add a small context-aware entry component that reads the UC-68 context for a live commerce booking. It displays **Submit Complaint** only when the server reports own booking, ended `Confirmed`/`Completed`, `canSubmit: true`, and no existing complaint.
3. For a server-returned existing complaint, show a read-only **View complaint** link to the complaint route. For closed/ineligible records, do not show a complaint creation action. Treat BFF failures as non-eligibility: do not expose a guessed action.
4. Never expose an entry/action for demo fixtures; demo IDs must not reach the live complaint BFF.
5. Keep the normal Trip History page as the direct-route Cancel fallback. If preserving dialog focus is approved and can be done without untrusted redirects, use a local fixed `returnTo` state/query only; otherwise return to `/account/trips` and do not emulate history navigation.

### Verification

Test an eligible live commerce booking shows the link, existing complaint shows read-only navigation, closed/error/demo/itinerary records do not show submit, and the action uses `ROUTES.bookingComplaint` with the numeric backend booking ID rather than a booking code or ticket ID.

## 6. Build accessible complaint UI components (TDD)

### Files

- **NEW** `src/features/complaints/submit/components/ComplaintContextCard.tsx`
- **NEW** `src/features/complaints/submit/components/PostTripComplaintForm.tsx`
- **NEW** `src/features/complaints/submit/components/EvidenceFileList.tsx`
- **NEW** `src/features/complaints/submit/components/ExistingComplaintDetail.tsx`
- **NEW** `src/features/complaints/submit/components/ComplaintOutcome.tsx`
- **NEW / MODIFY TESTS** adjacent `*.test.tsx` files

### Work

1. Use the established traveler teal visual tokens and existing shared controls (`ActionButton`, form controls, feedback/status components) where their public API fits. Do not add a UI library or duplicate generic controls.
2. Render a context card from parsed server data only: booking reference, tour/end context, submission deadline, and — for existing complaint — server-issued status, submitted time, response deadline, category/detail, and safe file metadata.
3. Implement accessible select, textarea, visible required labels, 2,000-character counter, multiple file input, selected-file list, and per-file remove buttons.
4. Provide a single `aria-live` request/result region; use `role="alert"` for actionable validation/errors. Disable duplicate submit while pending, preserve valid data on validation/network failure, and clear local form data only after successful server refresh.
5. Use semantic headings, labels, buttons, focus rings, non-colour status cues, and minimum 44px interaction targets. Render file names as text; do not create object URLs, previews, downloads, or private evidence links.
6. Layout as a one-column form on narrow screens and an appropriately constrained traveler content column at tablet/desktop widths, with no horizontal overflow.

### Verification

Write UI tests for labels/focus/error announcement, character count, file removal, invalid file retention behavior, keyboard-only form flow, pending submit disabled state, success/replay state transition, and mobile-width layout/overflow assertions supported by the current test harness.

## 7. Final verification and manual integration checklist

### Automated checks

Run in this order on a clean branch after implementation:

```powershell
npm install
npm test
npm run lint
npm run typecheck
npm run build
git diff --check origin/develop...HEAD
```

### Manual checks (live Backend only after the GET contract is deployed)

1. Sign in as the booking owner; open an ended confirmed/completed booking from **My Trips**; verify the server-authorized entry opens `/bookings/{id}/complaint`.
2. Submit valid category/detail with zero, one, five, 10-MB-boundary, and aggregate-boundary files. Confirm no private file URL/key appears in DevTools/browser logs.
3. Retry an unchanged failed request and verify one idempotency key; change the text/file set and retry with a new key.
4. Verify fresh 201 and replay 200 both end at one read-only complaint; refresh and direct navigation retain that state.
5. Verify expired window, duplicate, unsupported type, file/count/total limit, storage unavailable, unauthorized, and another Traveler's booking all show the specified safe state/message without leaking data.
6. Test Cancel from normal navigation and a direct URL; it always remains within TripMate and makes no submit request.
7. Inspect 375 px, 768 px, and 1280 px widths; complete the flow with keyboard only and verify focus, labels, live announcements, and visible focus indicators.

## Definition of done

- The accepted FE spec is satisfied and only the approved UC-68 Web scope changed.
- GET and POST both use same-origin BFF routes; no backend URL, token, storage key, or storage URL reaches browser code.
- The UI cannot offer a second complaint, infer eligibility client-side, or report a failed complaint as recorded.
- All automated checks pass and the live manual checklist is recorded once its BE dependency is available.
- Do not commit, push, open a PR, or merge until explicitly requested.

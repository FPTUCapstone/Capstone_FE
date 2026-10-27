# UC-29 View QR E-ticket — Web implementation plan

Spec: `specs/UC-29-view-qr-eticket-web-spec.md` (W1–W3). Contract: `Capstone_BE/docs/UC-29-api-contract.md`.
Branch: `feature/uc29-view-qr-eticket` from `develop` @ `050aa6f`.
Status: **Approved 2026-10-25; in progress.**

## 0. Ground rules

- TDD per `AGENTS.md`: failing test first (Vitest / Node tests already used by the bookings and trips features),
  minimum code, refactor; one task at a time with a spec and a quality self-review between tasks.
- Follow the UC-32 integration pattern (`src/features/trips/services/tripHistory*.ts`) rather than inventing a
  new one. The refresh-cookie exchange is copied per feature, as UC-32 did; sharing it is out of scope.
- No change outside the files listed. Baseline `npm test`, `lint`, `typecheck`, `build` run before Task 1.

## 1. Tasks

### Task 1 — Contract types and response parser
- Files: `src/features/bookings/types/ticket.ts` (rewrite), `src/features/bookings/services/ticketResponse.ts`
  (+ `.test.ts`).
- Tests first: a contract example parses with ids as decimal strings (including > 2^53); `qr: null` and a
  missing `meetingPoint`/`checkedInAtUtc` are accepted; an unknown `ticketStatus`, a missing required field or a
  non-object `qr` throws `InvalidTicketResponseError`; unknown fields are dropped.
- Verify: `npm test -- ticketResponse`.

### Task 2 — BFF proxy and route handlers
- Files: `src/features/bookings/services/ticketProxy.ts` (+ `.test.ts`); `app/api/v1/traveler/tickets/[ticketId]/route.ts`,
  `app/api/v1/traveler/tickets/[ticketId]/qr-code/refresh/route.ts`, `app/api/v1/traveler/bookings/[bookingId]/ticket/route.ts`.
- Tests first: no refresh cookie or non-Traveler role → 401 `UNAUTHENTICATED` without an upstream call; ids
  `0`, `-1`, `abc`, `9223372036854775808` → 404 `ticket.not_found` without an upstream call; GET and POST forward
  to the exact Backend paths with the bearer token; allowed `ticket.*` codes pass through with their status and
  `ticketStatus`; any other code or body → `MSG127`; malformed body → 502 `ticket.invalid_response`; network
  failure → 503 `MSG127`; every answer is `no-store`.
- Verify: `npm test -- ticketProxy`.

### Task 3 — Browser client and messages
- Files: `src/features/bookings/services/ticketClient.ts` (+ `.test.ts`), `src/features/bookings/resources/ticketMessages.ts`,
  `src/features/bookings/data/bookingDemoFixtures.ts` (demo ticket in contract shape), `src/features/bookings/services/bookingApi.ts`
  (remove `getTicket` and its `PENDING_BE_INTEGRATION` stub; keep the demo gate).
- Tests first: `getTicketById`, `getTicketByBooking`, `refreshTicketQr` map each proxy answer to a typed
  `TicketClientError` kind (`signIn`, `forbidden`, `notFound`, `notConfirmed`, `notRefreshable` with status,
  `system`); demo data only with `allowDemo` and the env flag, never in production.
- Verify: `npm test -- ticketClient bookingApi`.

### Task 4 — Real QR rendering
- Files: `package.json`, `package-lock.json` (`npm install qrcode.react@4.2.0 --save-exact`),
  `src/features/bookings/components/QrCodeDisplay.tsx` (+ `.test.tsx`).
- Tests first: the SVG is produced by `QRCodeSVG` with the unchanged `value`, level `M`, margin on; the
  accessible label is kept.
- Verify: `npm test -- QrCodeDisplay`.

### Task 5 — Ticket screen
- Files: `src/features/bookings/components/BookingTicketView.tsx` (rewrite) and `BookingTicketView.test.tsx`
  (rewrite), `BookingTicketPage.tsx` (accept `{ ticketId } | { bookingId }`, sign-in `returnUrl` per route).
- Tests first: loading state; each `ticketStatus` shows its label and message and shows/hides the QR; info area
  per spec §4 including a missing meeting point; Used shows the check-in time; refresh asks for confirmation,
  replaces the QR on success, re-reads on `not_refreshable`, re-reads on failure and shows MSG127 plus the
  stale-QR warning when the re-read fails too; the button is disabled offline and re-enabled online; each
  error of spec §4.2; the demo notice appears only in demo mode.
- Verify: `npm test -- BookingTicket`.

### Task 6 — Routes and entry points
- Files: `app/account/tickets/[ticketId]/page.tsx` (new), `app/bookings/[id]/ticket/page.tsx` →
  `app/bookings/[bookingId]/ticket/page.tsx`, `src/lib/routes.ts` (+ test if present), `src/features/trips/components/TripCard.tsx`
  (+ its test), `src/features/bookings/components/CheckoutResultView.tsx` and `CheckoutResultView.test.tsx`.
- Tests first: Trip History link is `/account/tickets/{ticketId}`; the paid result page shows [Xem vé điện tử]
  linking to `/bookings/{bookingId}/ticket`, keeps [Về trang chủ], and no longer navigates home by itself
  (fake timers advance past the old countdown).
- Verify: `npm test -- TripCard CheckoutResult routes`.

### Task 7 — Full validation and documentation
- `npm install`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; responsive, loading, error
  and accessibility checks from the Frontend Validation Checklist in a local run against the BE branch.
- `docs/UC29-API-INTEGRATION.md` in the style of `docs/UC32-API-INTEGRATION.md`; update the UC-29 row status in
  `docs/WEB_SCOPE_MATRIX.md` if that file tracks implementation status.

## 2. Risks

| Risk | Mitigation |
| --- | --- |
| BE PR #126 not merged when the Web PR is reviewed | The FE-first rule allows it; the PR links #126 and the contract. |
| Route rename breaks an existing link | Task 6 greps every `bookingTicket(` use; only `TripCard` and the old demo link use it today. |
| Local end-to-end run needs the BE with `TicketQr` keys | README §9.2 of the BE explains the user-secrets setup. |

## 3. Implementation notes (2026-10-25)

Tasks 1–6 implemented test-first; each task's tests, `tsc --noEmit` and ESLint were green before the next one.

| # | Deviation | Reason |
| --- | --- | --- |
| F1 | The old `getTicket` stub, `DEMO_TICKET_HOI_AN` and `TicketDto` were removed in Task 5, not Task 3. | `BookingTicketView` still used them until its rewrite; removing them earlier would have left `typecheck` red between tasks. |
| F2 | `ROUTES.account.ticket` was added in Task 5 (its test stayed in Task 6). | `BookingTicketPage` builds the sign-in `returnUrl` from it. |
| F3 | The booking-keyed page stays at `app/bookings/[id]/ticket` (the `id` param is the booking id). | Its siblings `pay` and `refund` use `[id]`; Next.js forbids two slug names at one level. |
| F4 | `QrCodeDisplay` has a second test file using the real encoder. | The main test mocks `qrcode.react`; the second proves 4.2.0 accepts `marginSize` and draws content-dependent modules. |
| F5 | The countdown test advances timers in two `act` blocks. | One block batches the status update until the end, so the countdown interval never started and the test passed on the old code. With two blocks it fails on the old code (56 `router.replace` calls in a minute) and passes on the new one. |
| F6 | `docs/WEB_SCOPE_MATRIX.md` is unchanged. | It records scope and grouped readiness, not per-UC implementation status. |

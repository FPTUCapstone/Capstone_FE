# UC-40 — View Customer Bookings (Web Specification)

## Status

Approved by the developer on 2026-10-27, with decisions D1–D4 confirmed as recommended (see **Decisions**).
Everything else follows the approved BE contract.

Authority: Report 3 §3.8.4.1, `docs/WEB_SCOPE_MATRIX.md` (UC-40 is `SHARED_WEB_MOBILE`; the SRS documents the
Next.js screen and this task is Web only), and the approved BE contract
`Capstone_BE/docs/UC-40-api-contract.md` (BE branch `feature/uc40-view-customer-bookings`, commit `d4d58782`,
not merged yet).

## Scope

The Customer Bookings screen `/partner/bookings` already exists (list, filters, summary, detail drawer, and the
UC-41 cancel / UC-42 refund dialogs) but runs only on demo fixtures. Outside demo mode it shows
`PENDING_BE_INTEGRATION` and an empty list. This task wires **UC-40 only** (list + detail, read-only) to the real
BE through the BFF and aligns the front-end model to the BE contract.

Included:
- BFF routes `GET /api/operator/bookings` and `GET /api/operator/bookings/[bookingId]`.
- `operatorBookingService`: live list, live detail, live tour options; demo mode kept.
- Model alignment to the BE contract (types, demo fixtures, components, resource strings).
- Real states on the screen: loading, empty (MSG128), authorization (MSG126), system error with Retry (MSG127),
  invalid date range, pagination, summary.
- Detail drawer loads the booking detail from the BE when opened.
- `docs/UC40-API-INTEGRATION.md`.

Excluded (unchanged behaviour):
- UC-41 cancel and UC-42 refund against the real BE. In real mode the cancel/refund buttons stay disabled with the
  existing "locked pending Backend integration" tooltip; the real cancel call (`POST /api/v1/bookings/{id}/cancellation`,
  `Idempotency-Key`) and refund flow are separate tasks.
- UC-43 check-in (mobile only). Until it ships, every booking reports `NotCheckedIn`.
- Mobile (`operator_bookings_view.dart`), BE changes, new BE endpoints.

## Contract mapping

### Request (browser → BFF → BE)

| FE state | BFF query forwarded to BE |
| --- | --- |
| tour filter (`tourId`, `ALL` omitted) | `tourId` |
| status filter (`ALL` omitted) | `status` |
| departure start / end date (`YYYY-MM-DD`) | `departureFrom` / `departureTo` |
| search keyword (trimmed) | `keyword` |
| page, page size (20, CR-01) | `pageNumber`, `pageSize` |

The BFF forwards only these keys (`tourId`, `scheduleId`, `status`, `paymentStatus`, `departureFrom`, `departureTo`,
`keyword`, `pageNumber`, `pageSize`); any other query key is dropped. `bookingId` in the detail route must be digits,
otherwise the BFF answers `400` without calling the BE.

### Model changes (BE enums are the source of truth)

| Current FE mock | New model |
| --- | --- |
| `BookingStatus` without `Expired` | adds `Expired` (badge, filter option, strings) |
| `contactName / contactEmail / contactPhone` | `booker.fullName`, `booker.email` (list); `booker.phoneNumber` (detail only) |
| `departureDate` | `schedule.startAtUtc` / `endAtUtc`, shown as `dd/MM/yyyy` in `Asia/Ho_Chi_Minh` (CR-07) |
| `participantsCount` | `quantity` |
| `createdAt` | `bookedAtUtc` |
| `tourName`, `tourId` | `tour.title`, `tour.tourId` |
| `participants[].age / specialNotes / id` | removed; participants are `{ fullName, participantType: Adult/Child/Infant }` |
| `paymentTransaction.paymentChannel` (`VNPay`/`PayOS`) | `payment.gateway` (`Mock`/`PayOS`/`VNPAY`/`MoMo`/`Stripe`) |
| `qrTicketValid` | removed; `ticket.status` (`Valid`/`Used`/`Cancelled`/`Expired`) |
| `cancellationWindowExpired` | removed; `canCancel` + `cancelBlockedReason` (`InvalidStatus` / `CheckedIn`) |
| `coupon.discountAmount` | `coupon { code, name, discountAmount }` |
| (new) | `paymentStatus`, `checkedInAtUtc`, `paidAmount`, `subtotalAmount`, `ticket`, `schedule.meetingPoint`, `cancelledAtUtc`, `cancelReason` |

Ids are JSON strings. The list item is the light shape; the detail shape is returned only by the detail
endpoint, so the drawer must fetch it (D3).

Runtime parsers validate every live response (shape, enums, ids, timestamps, money). A response that does not match
is treated as a system failure (MSG127); the UI never renders unvalidated data and never invents defaults.

## Screen behaviour

List (`GET /api/operator/bookings`):
- Columns follow the SRS: booking code, tour, departure date, contact (booker) name, number of participants,
  total amount, booking status, check-in status. Payment status is added as a badge because BE returns it and the
  filter list in the BE contract includes it (display only; no payment-status filter control is added: YAGNI).
- Summary cards use the BE `summary` as is (`totalBookings`, `totalParticipants`, `totalConfirmedAmount`). The
  client never recalculates them in live mode. Participants and amount count `Confirmed` + `Completed` only, so
  the card subtitles say so.
- Filters (tour, status, departure range, search) are enabled in live mode. Applying filters resets the page to 1
  and keeps CR-01/CR-02 behaviour (draft vs applied, URL sync). Search placeholder becomes
  "booking code, contact name or e-mail" (BE also matches e-mail).
- Tour options come from the existing `GET /api/operator/revenue/tours` BFF route (D2).
- Date range validation is done on the client before calling and again from the BE (`operator_booking.invalid_date_range`).

Detail drawer (`GET /api/operator/bookings/[bookingId]`):
- Opens immediately with the row's known fields and a loading skeleton for the detail sections, then replaces
  them with the detail response; a failed load shows MSG126/MSG127 with Retry inside the drawer.
- Shows participants (name + type), booker contact incl. phone, tour/schedule (+ meeting point), ticket and
  check-in (`checkedInAtUtc` when present), payment (gateway, transaction reference, amount, time; read-only, BR-77),
  paid amount, subtotal / discount / total, coupon, and cancellation info for cancelled bookings.
- `ticket` or `payment` or `coupon` being `null` hides that block; nothing is fabricated.
- Footer actions: Cancel is enabled only in demo mode and only when `canCancel` is true; the disabled tooltip
  uses `cancelBlockedReason` (`CheckedIn` → customer already checked in; `InvalidStatus` → booking can no longer be
  cancelled). In real mode both action buttons are disabled with the existing locked tooltip (D4).

Error and empty mapping:

| Situation | Message |
| --- | --- |
| BFF 401, BE 403 `operator_tour.access_required` / `operator_booking.forbidden`, detail 404 `operator_booking.not_found` | MSG126 |
| BE 400 `operator_booking.invalid_date_range` or client range check | MSG31 inline under the dates (D1) |
| 200 with no items | MSG128 |
| network error, 5xx, 400 `operator_booking.invalid_filter`, unparseable body | MSG127 + [Retry] |

## Demo mode

The demo flag is unchanged: `NODE_ENV !== 'production'` and `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`, plus
`?demo=1`. Demo fixtures are reshaped to the new model and still power the UC-41/UC-42 demo flows. Outside demo mode
no fixture is ever used and `PENDING_BE_INTEGRATION` no longer appears for list/detail (it stays only for the
not-yet-integrated cancel/refund service calls). The "cancellation deadline passed" demo scenario is removed: it
has no BE counterpart (UC-41 as built has no operator time window).

## Decisions (approved 2026-10-27; the alternatives below were not chosen)

- **D1 — invalid date range message.** SRS 3.8.4.1 names MSG29, but in the SRS message catalog MSG29 is the
  invalid latitude/longitude text, and MSG31 is "End date must be on or after the start date." The approved UC-44
  FE spec already chose MSG31 for the same situation. **Recommended:** use MSG31's text and name (replacing the
  non-SRS text currently under `MSG29` in `bookingLifecycle.ts`). Alternative: keep MSG29 naming with the current
  custom text.
- **D2 — tour filter source.** BE has no "my tours" endpoint for bookings. **Recommended:** reuse
  `GET /api/operator/revenue/tours` (BE `GET /api/v1/operator/revenue/tours`, lists every owned tour including
  historical ones) through a small bookings-local function; no BE change. If it fails, the list still works with
  "All Tour Packages" only and the select is disabled.
- **D3 — detail loading.** **Recommended:** the drawer fetches the detail endpoint on open (the list item lacks
  participants, payment, coupon, ticket). Alternative: widen the list payload (needs a BE change) — not proposed.
- **D4 — cancel/refund in real mode.** **Recommended:** leave both disabled (locked tooltip) until the UC-41/UC-42
  FE tasks; `canCancel` drives only the demo button and the tooltip text. Alternative: wire UC-41 now (needs
  idempotency key, reason mapping, refund follow-up) — out of this task's scope.

## Acceptance criteria

1. Outside demo mode the list and detail call only the BFF; no demo fixture and no `PENDING_BE_INTEGRATION` for them.
2. The BFF refuses unauthenticated or non-operator sessions (401), forwards only whitelisted query keys, rejects a
   non-numeric `bookingId` (400), sends `Cache-Control: no-store`, and never exposes the BE URL or token.
3. Query mapping is exact (`startDate/endDate` → `departureFrom/To`, `searchKeyword` → `keyword`, `page` →
   `pageNumber`; `ALL` omitted); an inverted range is blocked client-side and shows MSG31.
4. List renders BE items and summary unchanged; `Expired` has a badge and a filter option; money in VND, dates
   `dd/MM/yyyy` in `Asia/Ho_Chi_Minh`.
5. Every error row in the mapping table shows the stated message; loading, empty, error and Retry states exist
   for both list and drawer.
6. The drawer never shows participant age/notes, ID document, or any gateway payload; it shows `payment`,
   `ticket`, `coupon` only when present.
7. Cancel/refund buttons: real mode disabled with the locked tooltip; demo mode follows `canCancel`
   (+ `cancelBlockedReason` text).
8. Demo mode still works end-to-end (list, detail, UC-41 cancel, UC-42 refund) on the reshaped fixtures.
9. `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` pass.

## Test plan (TDD, behaviour-level)

Pure tests for the response parsers (valid, missing field, wrong enum, bad id/money/timestamp); proxy tests with
mocked `cookies` and `fetchBackend` (auth, role, whitelist, digits-only id, status/body passthrough, no-store,
network failure); service tests with mocked `fetch` (query mapping, each error row, tour options, demo still
isolated by actor); component tests for the list (live loading/empty/error/retry, summary, filters enabled,
`Expired`) and the drawer (detail load, null blocks, blocked-reason tooltips, locked real-mode actions, no
sensitive fields); page test for the route. Existing demo tests are updated to the new model rather than deleted.

## Not verified by this task

Live end-to-end against a running BE and database is not part of the automated checks (the BE UC-40 branch is
not merged or deployed). The FE is verified against the contract with parsers and mocked responses. The
integration doc states this plainly and lists the manual smoke steps for after the BE is deployed.

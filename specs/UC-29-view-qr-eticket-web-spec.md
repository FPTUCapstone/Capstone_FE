# UC-29 View QR E-ticket — Web specification

**Status:** Approved 2026-10-25 (developer).
**Platform ownership:** `SHARED_WEB_MOBILE` (`docs/WEB_SCOPE_MATRIX.md`, Report 3 §3.5.6). Scanning is UC-43, not Web.
**Backend contract:** `Capstone_BE/docs/UC-29-api-contract.md` (BE PR #126). Backend spec decisions D1–D7.

## 1. Scope

The Traveler opens the e-ticket of one of their bookings and sees a scannable QR, the ticket status and
the booking details, and can refresh the QR. Two entry points (SRS trigger):

| Entry | Route | Backend call |
| --- | --- | --- |
| Trip History → [View E-ticket] (`actions.ticketId`) | `/account/tickets/[ticketId]` | `GET /api/v1/traveler/tickets/{ticketId}` |
| Payment result after a successful payment (`bookingId`) | `/bookings/[bookingId]/ticket` | `GET /api/v1/traveler/bookings/{bookingId}/ticket` |
| [Refresh QR Code] on either page | — | `POST /api/v1/traveler/tickets/{ticketId}/qr-code/refresh` |

Out of scope: Operator scanning (UC-43), saving the ticket for offline use, screen brightness, payment
details on the ticket (not in the contract).

## 2. Confirmed decisions (developer, 2026-10-25)

| ID | Decision |
| --- | --- |
| W1 | The current `QrCodeDisplay` draws a fake 21×21 grid that no scanner can read. It is replaced by a real QR encoder: add `qrcode.react@4.2.0` (`QRCodeSVG`). |
| W2 | The payment result page no longer returns home automatically. Its primary action becomes **[Xem vé điện tử]** (booking-keyed route); [Về trang chủ] stays. |
| W3 | Two routes sharing one view: `/account/tickets/[ticketId]` (Traveler account area, next to `/account/trips`) and `/bookings/[bookingId]/ticket` (matches the Backend meaning of the path). `ROUTES.bookingTicket` now takes a **booking** id; Trip History uses the new `ROUTES.account.ticket(ticketId)`. |

## 3. Data path (same pattern as UC-32)

```text
Browser (TicketView)
  -> ticketClient.ts                 GET /api/v1/traveler/tickets/{id} | /bookings/{id}/ticket, POST .../qr-code/refresh
  -> Next route handlers             app/api/v1/traveler/tickets/[ticketId]/route.ts
                                     app/api/v1/traveler/tickets/[ticketId]/qr-code/refresh/route.ts
                                     app/api/v1/traveler/bookings/[bookingId]/ticket/route.ts
  -> ticketProxy.ts (server-only)    refresh cookie -> Traveler access token -> Backend
```

- The browser never sees the access token or the Backend URL. Responses are `Cache-Control: no-store`.
- The proxy rejects a non-positive or non-int64 id before any upstream call (`404 ticket.not_found`).
- Only reviewed error codes reach the browser: the six `ticket.*` codes, `UNAUTHENTICATED`, `FORBIDDEN`,
  else `MSG127`. The `ticketStatus` extension of `ticket.not_refreshable` is passed through.
- The body is parsed with `lossless-json` against the contract: ids become decimal strings, unknown fields
  are dropped, a malformed body becomes `502 ticket.invalid_response`. `qr` must be an object or `null`.

## 4. Screen

Layout follows the existing boarding-pass card (`DESIGN.md` tokens) with the SRS fields only.

| Area | Content |
| --- | --- |
| Status label | Not Yet Active / Valid / Used / Cancelled / Expired (`ticketStatus`) |
| QR | `QRCodeSVG` of `qr.content` exactly as received (error correction M, quiet zone on). Shown only when `qr` is not null. Accessible label with the ticket code. |
| Info | Ticket code, booking code, tour title, operator name, departure (`dd/MM/yyyy HH:mm`, Asia/Ho_Chi_Minh), meeting point (or "Chưa cập nhật"), participants (adult / child / infant and total) |
| Validity note | "Vé chỉ có hiệu lực trong ngày khởi hành {dd/MM/yyyy}" from `validity.departureDate` |
| Used | check-in time from `checkedInAtUtc` (MSG95) |
| Actions | [Làm mới mã QR] (Valid / NotYetActive only), [In vé] (browser print), back to Trip History |

Message per status (contract table; Vietnamese copy of the SRS text in `bookings/resources/ticketMessages.ts`):
`Valid` MSG93, `NotYetActive` MSG98, `Used` MSG95, `Cancelled` MSG139, `Expired` MSG140.

### 4.1 Refresh (contract client rules)

1. A confirmation dialog first: "Mã QR hiện tại sẽ ngừng hoạt động. Tiếp tục?".
2. The button is disabled while the browser reports offline (`navigator.onLine`, `online`/`offline` events).
3. On success the displayed QR is replaced. On `ticket.not_refreshable` the page re-reads the ticket and
   shows its current status. On any other failure or a timeout the page re-reads the ticket; if that also
   fails it shows MSG127 and a warning that the displayed QR may no longer be valid until reloaded.
4. The last successful response stays in memory only; nothing is written to storage.

### 4.2 Errors

| Response | Screen |
| --- | --- |
| 401 / `UNAUTHENTICATED` | redirect to sign-in with `returnUrl` (existing behaviour) |
| 403 / `ticket.forbidden` / `FORBIDDEN` | MSG126, no QR |
| 404 `ticket.not_found` | "Không tìm thấy vé điện tử" + link to Trip History |
| 409 `ticket.booking_not_confirmed` | MSG138, no QR |
| 409 `ticket.not_issued`, 5xx, network, `ticket.invalid_response` | MSG127 + [Thử lại] |

Signed-in non-Traveler roles keep the existing role guard page.

## 5. Affected modules

- `src/features/bookings/types/ticket.ts` — replaced by the contract types (`TicketStatus` gains `NotYetActive`).
- `src/features/bookings/services/` — new `ticketProxy.ts`, `ticketResponse.ts`, `ticketClient.ts`; the old
  `getTicket` stub and its `501 PENDING_BE_INTEGRATION` path in `bookingApi.ts` are removed.
- `src/features/bookings/data/bookingDemoFixtures.ts` — demo ticket reshaped to the contract; still only
  behind `?demo=1` + `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true` outside production.
- `src/features/bookings/components/` — `BookingTicketView` rewritten as the contract screen, `BookingTicketPage`
  takes either id, `QrCodeDisplay` uses `qrcode.react`, `CheckoutResultView` per W2.
- `app/` — two pages and three route handlers listed above; `app/bookings/[id]/ticket` becomes
  `app/bookings/[bookingId]/ticket`.
- `src/lib/routes.ts`, `src/features/trips/components/TripCard.tsx` — W3.
- `package.json` / `package-lock.json` — `qrcode.react@4.2.0`.

## 6. Acceptance criteria

1. From Trip History, [View E-ticket] opens `/account/tickets/{ticketId}` and shows the Backend ticket.
2. After a successful payment, the result page stays and [Xem vé điện tử] opens `/bookings/{bookingId}/ticket`.
3. The QR shown is a standard QR encoding exactly `qr.content`: a test asserts the encoder receives the
   unchanged content; scanning with a phone is checked during UAT.
4. Each `ticketStatus` shows its label and message; the QR is hidden for Used / Cancelled / Expired.
5. Refresh follows §4.1, including the confirmation and the failure path.
6. Every error in §4.2 shows its message; no Backend text or stack reaches the page.
7. Nothing claims an integration or capability that does not exist (no "escrow", brightness or offline-save text).
8. `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` pass.

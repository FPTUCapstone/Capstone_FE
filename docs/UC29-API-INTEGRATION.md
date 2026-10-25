# UC-29 View QR E-ticket — real API integration

## Scope

Traveler Web e-ticket (`SHARED_WEB_MOBILE`, Report 3 §3.5.6) now reads the Backend UC-29 API instead of the old
`501 PENDING_BE_INTEGRATION` stub and the client-drawn QR. Spec: `specs/UC-29-view-qr-eticket-web-spec.md`.
Plan: `plans/UC-29-view-qr-eticket-web-plan.md`. Backend contract: `Capstone_BE/docs/UC-29-api-contract.md`
(BE PR #126, `feature/uc29-view-qr-eticket`). Scanning is UC-43 and is not part of the Web.

## Routes

| Page | Opened from | Reads |
| --- | --- | --- |
| `/account/tickets/[ticketId]` | Trip History [View E-Ticket] (`actions.ticketId`) | `GET /api/v1/traveler/tickets/{ticketId}` |
| `/bookings/[id]/ticket` (`id` = booking id) | Payment result [Xem vé điện tử] | `GET /api/v1/traveler/bookings/{bookingId}/ticket` |

Both pages render `BookingTicketView`. The booking page keeps the `[id]` segment name because its sibling
`pay` and `refund` routes use it; Next.js does not allow two slug names at one level.

## Data path

```text
Browser (BookingTicketView)
  -> ticketClient.ts                 GET  /api/v1/traveler/tickets/{id} | /api/v1/traveler/bookings/{id}/ticket
                                     POST /api/v1/traveler/tickets/{id}/qr-code/refresh
  -> Next route handlers             app/api/v1/traveler/tickets/[ticketId]/route.ts
                                     app/api/v1/traveler/tickets/[ticketId]/qr-code/refresh/route.ts
                                     app/api/v1/traveler/bookings/[bookingId]/ticket/route.ts
  -> ticketProxy.ts (server)         refresh cookie -> Traveler access token -> Backend
```

- The browser never sees the access token or the Backend URL. Every answer is `Cache-Control: no-store`.
- A non-positive or non-int64 id is answered `404 ticket.not_found` without calling the Backend.
- Only the six `ticket.*` codes, `UNAUTHENTICATED`, `FORBIDDEN` and `MSG127` reach the browser;
  `ticket.not_refreshable` keeps a valid `ticketStatus`.
- `ticketResponse.ts` parses the body with `lossless-json` against the contract: ids become decimal strings,
  unknown fields are dropped, a malformed body becomes `502 ticket.invalid_response`.

## Screen behaviour

| Area | Behaviour |
| --- | --- |
| QR | `qrcode.react` (`QRCodeSVG`, level M, 4-module quiet zone) encodes `qr.content` exactly as received. Shown only for `Valid` and `NotYetActive`. |
| Status | Label and message per status: `Valid` MSG93, `NotYetActive` MSG98, `Used` MSG95 (with check-in time), `Cancelled` MSG139, `Expired` MSG140 |
| Info | Ticket and booking codes, tour, operator, departure `dd/MM/yyyy HH:mm` (Asia/Ho_Chi_Minh), meeting point or "Chưa cập nhật", participants |
| Refresh | Confirmation first; disabled while offline. On any failure the ticket is re-read; if that fails too the old QR stays with MSG127 and a warning that it may no longer work. Nothing is stored. |
| Errors | 401 → sign-in link with `returnUrl`; 403 → MSG126; 404 → not found; 409 not confirmed → MSG138; other → MSG127 + retry |
| Payment result | No automatic return home any more; [Xem vé điện tử] is the primary action, [Về trang chủ] stays |

Messages live in `src/features/bookings/resources/ticketMessages.ts`.

## Demo mode

`?demo=1` with `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true` outside production serves `DEMO_TICKET_VIEW`
(a QR that is clearly not a real ticket) and rotates it on refresh without a network call. Production never
serves it.

## Local check against the Backend

Run the BE branch with its `TicketQr` keys (BE README §9.2) and `TRIPMATE_API_BASE_URL` pointing at it, sign in
as a Traveler with a paid booking, open Trip History → [View E-Ticket], and scan the QR with a phone camera: it
must read `TM1.…`.

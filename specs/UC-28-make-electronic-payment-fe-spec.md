# UC-28 — Make Electronic Payment (Web)

## Status

Draft for approval. Web consumes the UC-28 Backend contract and never simulates
a successful production payment itself.

## Scope

For an eligible Traveler booking, Web starts payment, redirects to the server
provided checkout URL, renders local Mock checkout in development, and displays
the canonical status returned by Backend after return/cancel navigation.

Out of scope: gateway credentials, payment amount calculation, webhook
processing, refunds and ticket issuance.

## Decisions

- The only production gateway label is PayOS.
- Local Mock checkout exposes success, cancellation and expiry controls; it is
  rendered only when Backend reports `gateway: Mock`.
- Web does not derive success from PayOS return query parameters. It loads
  `GET /api/v1/traveler/bookings/{bookingId}/payment`.
- Repeated Pay clicks call the create/reuse endpoint and receive the active
  checkout URL rather than creating a new transaction client-side.

## Routes and API

| Route | Purpose |
| --- | --- |
| `/checkout/mock?paymentId={id}&bookingId={id}` | Local Mock checkout only |
| `/checkout/result?bookingId={id}` | Gateway return/cancel landing page |
| `/dev/payment?bookingId={id}` | Local payment test entry only |

Web calls:

- `POST /api/v1/traveler/bookings/{bookingId}/payments`
- `GET /api/v1/traveler/bookings/{bookingId}/payment`
- `POST /api/v1/traveler/payments/{paymentId}/mock-outcome` only for Mock.

## User behavior

1. The payment handoff calls create/reuse and navigates to the returned
   `checkoutUrl`.
2. Mock checkout displays only server-provided amount/currency and has
   **Success**, **Cancel**, and **Expire** actions.
3. Return/result state loads canonical Backend status and displays pending,
   paid, cancelled or expired results.
4. Cancelled payment remains pending while the booking is eligible; **Pay
   again** requests a reusable/replacement link from Backend.
5. Before the UC-27 booking entry is merged, the local-only payment test entry
   accepts an existing `PendingPayment` booking ID and exposes **Start Mock
   Payment**. It calls the same create/reuse API and never fabricates a booking,
   amount or payment state.

## Acceptance criteria

- No VNPay labels, fields or fake callback parameters remain in UC-28 UI.
- The UI sends no amount, reference or completion status to initiate payment.
- Loading, error and retry states are accessible.
- A forged `?status=PAID` return URL cannot render a paid receipt without the
  Backend status confirming it.
- `PAYMENT_BOOKING_NOT_ELIGIBLE`, `PAYMENT_BOOKING_EXPIRED`,
  `PAYMENT_NOT_FOUND`, `PAYMENT_GATEWAY_UNAVAILABLE` and
  `PAYMENT_MOCK_DISABLED` map to clear user messages; raw gateway errors are
  never shown.

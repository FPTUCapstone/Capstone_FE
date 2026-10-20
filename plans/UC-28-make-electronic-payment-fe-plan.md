# UC-28 — Make Electronic Payment (Web) Plan

## Task 1 — Contract tests and types

Replace VNPay demo response types with UC-28 payment DTOs and map the approved
payment error codes. Add failing service tests for create/reuse, canonical
status and Mock completion. Keep existing demo behavior intact until the BE
Mock contract is available; do not ship a UI that only removes VNPay.

## Task 1a — Local payment test entry

Add `/dev/payment?bookingId={id}` behind the existing local demo flag. It
is a UI-only prototype while the Booking and Payment Backend contracts are
unavailable: it displays a clearly labeled fixture and sends no request to
Backend or PayOS. Add tests for the local outcome transitions and start-payment
action. Replace this route with the normal create/reuse handoff when UC-27 and
UC-28 Backend integration is available.

## Task 2 — Payment handoff

Use the create/reuse endpoint from the booking confirmation. Replace local
payment-method choices with PayOS/Mock provider display and redirect only to
the server checkout URL.

## Task 3 — Mock checkout route

Add the Mock checkout screen with explicit success/cancel/expire actions,
server amount display, busy/error states and return navigation.

## Task 4 — Result reconciliation

Refactor checkout result to read the canonical Backend status using booking ID;
do not parse gateway result values as state. Add paid, pending, cancelled,
expired and request-failure tests.

## Task 5 — Verification

Run focused Vitest tests, then `npm test`, `npm run lint`, `npm run typecheck`
and `npm run build`. Manually test the Mock flow against local BE.

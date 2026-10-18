# UC-28 — Make Electronic Payment (Web) Plan

## Task 1 — Contract tests and types

Replace VNPay demo response types with UC-28 payment DTOs. Add failing service
tests for create/reuse, canonical status and Mock completion.

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

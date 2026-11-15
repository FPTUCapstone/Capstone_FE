# UC-69 Respond to Post-Trip Complaint — Frontend Implementation Plan

## Definition of done

The Tour Operator can safely review and submit each valid UC-69 response on web, with backend-authoritative money/status/deadline data, clear validation and no direct refund payment action.

## Task 1 — Contract and routing foundation

- Add typed API contracts, parsers and service methods for complaint list, detail and response endpoints.
- Add route constants, pages and Partner sidebar entry.
- Match established operator authentication/error conventions; do not enable demo-only fixtures in the live route.

**DoD:** Parser/service tests cover valid payloads, malformed payloads, error envelope mapping and idempotency header creation.

## Task 2 — Complaint list

- Build a responsive list with status/date/search filters, URL state, explicit submit and 20-record default pagination.
- Implement loading, empty, retry and forbidden states using existing shared patterns.

**DoD:** Component tests verify page/filter preservation, empty state, error retry and keyboard navigation to detail.

## Task 3 — Detail and evidence presentation

- Render all backend-authoritative complaint data and available action state.
- Implement evidence links only from signed backend URLs with safe new-window attributes.
- Ensure expired/rejected/approved records are read-only and do not show a submit control.

**DoD:** Tests confirm no storage identifier or payment information appears, and expired details cannot become actionable through client state.

## Task 4 — Response form

- Add action selector, partial amount input and rejection reason textarea.
- Enforce client-side required/range checks, inline accessible errors and focus management.
- Add an outcome-specific confirmation dialog; generate one idempotency key per deliberate submit and disable duplicate clicks.

**DoD:** Tests cover full accept, partial validation boundaries, reject reason, cancellation of confirmation, server MSG162/163/165 errors and successful refresh.

## Task 5 — Cross-flow handoff messaging

- After full acceptance, state that the refund awaits the existing UC-42 confirmation flow; after partial proposal, state that Traveler action is pending.
- Do not add an in-screen payment button or an optimistic `Paid` status.

**DoD:** Copy and behavioural tests prove the UI does not make a gateway/refund API call and uses only the UC-69 response endpoint.

## Task 6 — Quality gates and evidence

- Run focused Vitest suites, `npm run typecheck`, `npm run lint`, production build and relevant E2E test with live BE.
- Manually test desktop and mobile widths, keyboard-only form submission, deadline expiry and foreign-record deep link.
- Record API contract version, commands and final results in the PR.

**DoD:** All acceptance criteria pass and there are no accessibility, authorization or sensitive-link findings.

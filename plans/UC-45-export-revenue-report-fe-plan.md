# UC-45 — Export Revenue Report (Web Plan)

## Preconditions

- BE UC-45 contract and error mapping in `specs/UC-45-export-revenue-report-be-spec.md` are approved.
- UC-44 has a live applied-filter state; do not rely on demo aggregates for production export.

## Task 1 — Contract types and BFF routes

1. Add typed request/response models for create, history, and download states in the operator finance feature.
2. Add BFF routes for `POST /api/operator/revenue/exports`, `GET /api/operator/revenue/exports`, and `GET /api/operator/revenue/exports/[id]/download` that forward authorization, query/body, status, content type, and content-disposition safely.
3. Ensure download routes do not cache financial files or expose storage URLs.

**Done when:** route tests prove header forwarding, body validation propagation, binary streaming, 201/202 distinction, and protected error mapping.

## Task 2 — Replace demo-only export service

1. Replace production `exportOperatorRevenueReport` demo/CSV generation with live BFF calls.
2. Keep fixture behavior in an explicit test/Storybook demo adapter only; remove production checks that disable Excel/PDF or require `isDemo`.
3. Implement a single download helper using the BFF download endpoint and server filename/content type; never synthesize a `.xlsx`/`.pdf` filename or Blob type.

**Done when:** service tests cover all formats/scopes, ready vs queued, error codes, no-record response, and safe download metadata.

## Task 3 — Dialog and applied-filter integrity

1. Update `ExportRevenueDialog` to enable all supported formats, remove async simulation controls, and expose `MSG01`, `MSG116`, `MSG117`, and `MSG128` states.
2. Pass an immutable copy of the last successfully applied UC-44 filters into the dialog. Close/reset the dialog when filters change before submission.
3. Ensure keyboard focus, Escape/Cancel, submit busy state, aria live messages, and screen-reader labels meet the existing component conventions.

**Done when:** component tests prove immutable filter payloads, format/scope selection, no duplicate submit, cancellation, accessibility semantics, and errors.

## Task 4 — Export history and asynchronous completion

1. Add a compact Export History panel or dialog section with status, requested time, expiry, failure state, and Download/Retry actions.
2. Refresh queued exports using bounded polling with cleanup on unmount/tab hidden; stop on `Ready`, `Failed`, or `Expired`.
3. Refresh history after a direct export, queued creation, retry, and successful download attempt. Surface `MSG106` without deleting the ready item.

**Done when:** tests verify queued-to-ready transition, failed retry, expired disabled state, no polling leak, and re-download.

## Task 5 — Verification

Run lint, unit/component tests, and production build. Validate browser downloads for CSV, XLSX, and PDF against a BE test environment; verify the dialog's date display is `dd/MM/yyyy` while its request remains `YYYY-MM-DD`.

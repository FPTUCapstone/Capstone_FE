# UC-39 — Update Coupon (web)

Status: Approved by developer on 2026-10-26; implementation plan approved on the same date.

## Scope

An active, approved Tour Operator opens an owned coupon at `/partner/coupons/[id]/edit`, reviews current values and usage, changes eligible fields, and saves through the real backend API. The backend UC-39 specification defines the authoritative domain rules. Mobile is outside this delivery.

UC-39 has a Next.js Update Coupon screen in the original `Report3_Software-Requirement-Specification.docx` (§3.8.3.2). The historical `docs/WEB_SCOPE_MATRIX.md` also lists Web support, but its 2026-10-23 GitHub governance notice says the original SRS and traceably approved newer requirements are authoritative. This task completes the existing coupon list/edit workspace and does not create a new route or redesign the reviewed screen. Apply the latest `docs/FRONTEND_ENGINEERING_CONVENTION.md` from GitHub `develop` when implementation begins; the product rules and backend contract remain authoritative.

## Screen and interaction

1. Load the operator's coupon list, the owned coupon detail and eligible tours from the API. Show loading, missing/forbidden, network-error, and empty-tour states without exposing technical details. UC-39 always requires an approved operator session and always uses the authenticated API.
2. Show code, discount type and the backend `usedCount` as read-only. Label it “Lượt đang chiếm hạn mức” and explain that it includes bookings awaiting payment and paid bookings; an unpaid booking that expires or is cancelled returns its slot. The editable fields are name, discount value, percentage maximum discount, minimum order, total and per-user limits, applicable tours, and permitted validity times.
3. Both limits have an explicit “Unlimited” option that sends `null`. If the entered total limit equals `usedCount`, explain that the coupon currently has no remaining slots; expiry or cancellation of an unpaid booking can free one later. Reject a smaller value before submit and show the server's validation response if usage changed meanwhile. Never display unlimited as zero remaining.
4. Show date and time in `Asia/Ho_Chi_Minh`, label the timezone, and convert to UTC for API requests. Once the coupon has started, show its start time read-only; allow a future end time. Preserve the exact stored instant when a time field is read-only.
5. “Apply to all eligible tours” selects the currently returned eligible tour IDs at save time. The screen displays the selected count and explains that tours added later require a further update. A specific selection must contain at least one eligible tour.
6. Saving and changing activation are separate actions. Updating a manually disabled or expired coupon does not activate it. When an expired coupon is extended, explain that the operator must activate it separately. Confirm before deactivation.
7. When a used coupon's discount or scope changes, tell the operator that existing bookings retain their recorded discount and only later bookings use the new conditions.
8. On success, show confirmation and refresh the canonical saved values. On validation, usage conflict, or network failure, preserve the draft and show a correction or retry path. A usage conflict prompts reload before another save.

## API integration

- Reuse the authenticated coupon API client for list/detail, eligible tours, PUT update, activate and deactivate.
- Use the existing browser session and configured API origin. Keep transport and runtime parsing in feature services; never store a token in component state, URL or browser persistence. Do not add a BFF or change credential ownership for this task.
- Map the backend coupon fields and statuses to web presentation without treating a future start as a persisted `Scheduled` status.
- Send the full update body specified in the backend UC-39 spec. Code and status are not included; discount type is sent unchanged to meet the existing contract.
- Show safe messages for `400`, `401`, `403`, `404`, `409`, `422`, and network errors. Backend ownership and monetary validation remain authoritative.
- Parse API JSON as untrusted data; reject malformed or partial coupon responses instead of treating them as success. Bound reads, cancel or ignore obsolete loads on ID/session changes, avoid caching private coupon responses across users, and do not automatically retry a PUT without a proven idempotency contract.

## Acceptance criteria

1. An approved operator can load, edit, save and refresh a coupon in production mode; the data remains updated.
2. Code/type cannot be edited; active, disabled, and expired coupon flows follow the backend rules.
3. Unlimited limits round-trip as `null`; a limit equal to current occupied usage saves and is shown as currently full. The usage label correctly includes pending and paid bookings, and a later backend release can reduce the displayed count after refresh.
4. Selecting “all” sends only currently eligible tour IDs; a later new tour is not automatically included.
5. Vietnamese date-times round-trip without changing the stored instant when unchanged.
6. Unauthorized, invalid, stale and network-failed saves do not show false success or erase the operator's draft.
7. Direct URL access, refresh, back navigation, keyboard use and narrow/tablet/desktop layouts remain usable. Labels, field-error associations, dialog focus, pending announcements and non-color status indicators are present.

## Test seams

Use coupon API contract tests for request/response/error mapping and screen tests for loading, editing, save, validation, status changes and draft preservation. Add one integrated production-mode flow if the existing test harness supports it.

Use the installed Node/Vitest/Testing Library harness and existing coupon test files. Mock at the transport boundary, cover malformed responses and a late load after account/ID change, and report that mocked tests alone do not prove a deployed backend connection. No new form, cache, state or request library is required.

## Out of scope

Mobile UI, a new coupon creation flow, changing code or discount type, auto-enrolling future tours, and changing stored discounts on existing bookings.

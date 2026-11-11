# UC-39 — Update Coupon Web Implementation Plan

Status: Approved by developer on 2026-10-26.

## Goal and convention

Make the existing `/partner/coupons/[id]/edit` screen load and save real operator coupons. Follow the latest GitHub `develop` copy of `docs/FRONTEND_ENGINEERING_CONVENTION.md` (version 1.0, governance update 2026-10-23): keep the route thin, preserve the `src/features/operator/coupons` owner, use the existing browser session and native fetch boundary, parse untrusted responses, handle loading/empty/error states, and preserve responsive and accessible behavior. `docs/CODEBASE_RULES.md` is superseded where it overlaps. No new package, route, global state, BFF or visual redesign is planned.

## Preconditions

1. Confirm spec and plan approvals and the final backend DTO/error contract. This isolated `feature/uc-39-update-coupon-web` worktree was created from GitHub `develop` at `141173d` on 2026-10-26, preserving the unrelated UC-10 edits. Recheck remote freshness before implementation, read the included 2026-10-23 governance notice, and verify original SRS provenance.
2. Run `npm install` in the new worktree, then reinspect the installed Next.js guide under `node_modules/next/dist/docs/` for touched App Router behavior. Record baseline `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` on the clean worktree; resolve a broken baseline before implementation.
3. Use TDD at the existing coupon API and component seams. After each task, review scope compliance and FE convention quality.

## Task 1 — Production coupon reads

**Files:** `src/features/operator/coupons/services/couponApi.ts`, `couponApi.test.ts`, `operatorCouponService.ts`, `operatorCouponService.test.ts`, and coupon types in `src/features/operator/coupons/types/couponLifecycle.ts`.

- [ ] RED: tests for list, detail and eligible-tour requests with session headers, numeric ID validation, malformed/partial JSON, empty list, `401/403/404`, abort/late response, current occupied `usedCount`, and no fixture fallback in production.
- [ ] GREEN: add minimal API functions and one boundary mapper from backend coupon response to the view model. Derive `Scheduled`/`Expired` from status plus UTC time; map `Disabled` to the displayed inactive state. UC-39 reads only from authenticated endpoints.
- [ ] Verify: `npm exec vitest run src/features/operator/coupons/services/couponApi.test.ts src/features/operator/coupons/services/operatorCouponService.test.ts`.
- **Done:** the list and detail can load real owned coupons; private data is never shared across identities or presented from fixtures in production.

## Task 2 — Production update and status requests

**Files:** the same coupon services/tests, plus `src/features/operator/coupons/resources/en.ts` only for changed messages.

- [ ] RED: tests for full PUT serialization, `null` limits, UTC instants, unchanged discount type, frozen current eligible IDs for “all”, `200` response parsing, `400/422` field errors, `409` stale conflict, network/5xx, and distinct activate/deactivate actions.
- [ ] GREEN: use the existing authenticated feature service and configured API origin. Keep backend codes/statuses for safe field mapping; never retry a PUT automatically or mark a request successful before a valid server response. Bound requests and support cancellation where the existing boundary permits it.
- [ ] Verify: the focused coupon service tests.
- **Done:** production actions call the backend and return a truthful success/error result; no local fixture mutation exists in UC-39.

## Task 3 — Edit form and interaction

**Files:** `src/features/operator/coupons/components/UpdateCouponView.tsx`, `UpdateCouponView.test.tsx`, and a feature-local pure date/form helper only if tests show it is needed.

- [ ] RED: tests for immutable code/type/start, percentage/flat constraints, `null` and equal-to-occupied limits, Vietnam local date-time round-trip, current-tour snapshot, used-coupon notice, expired extension requiring separate activation, and retention of the draft on validation/conflict/network failure. Show pending and paid usage under “Lượt đang chiếm hạn mức”; a later refresh may show a lower count when an unpaid booking releases its slot. Never show unlimited as zero remaining.
- [ ] GREEN: adapt the existing screen and controls. Preserve its reviewed visual structure; use labels, `aria-invalid`/descriptions, pending announcements, dialog focus and a single submit while pending. Keep money/time conversion and validation outside rendering where genuinely reusable.
- [ ] Verify: `npm exec vitest run src/features/operator/coupons/components/UpdateCouponView.test.tsx`.
- **Done:** the form submits the approved contract, exposes the exact post-save status and does not change prior booking amounts.

## Task 4 — Route/list wiring and full verification

**Files:** `app/partner/coupons/page.tsx`, `app/partner/coupons/[id]/edit/page.tsx`, related coupon route/guard/list tests, and only touched coupon resource files.

- [ ] RED: tests for direct edit URL, list-to-edit navigation, session restoration, cross-role/expired session denial, missing or foreign coupon, no eligible tours, refresh, stale load after ID/account change, and correct success navigation.
- [ ] GREEN: wire the production service into the existing pages; keep route composition thin and role/object authorization authoritative at the backend. Preserve safe same-origin return URLs.
- [ ] Verify focused route/list tests, then run in order: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` as required by FE `AGENTS.md` and the convention. Dependencies were installed in Preconditions.
- [ ] Manually check direct refresh/back navigation, keyboard/focus, loading/error/empty states and narrow/tablet/desktop reflow; report any unavailable browser runtime check honestly.
- **Done:** an eligible operator can save and refresh a real coupon, while denied and failed flows do not fabricate success. Review spec compliance, FE convention boundaries, accessibility and test evidence before handoff. Do not push, open a PR or merge without separate developer direction.

## Known integration risks

- Backend coupon IDs are numeric; transport/view mapping must reject non-numeric route IDs explicitly.
- Existing edit controls use date-only strings, while backend uses UTC instants; unchanged values must round-trip exactly.
- List, detail, eligible-tour, update and activation requests must all remain on the authenticated API path.
- The web can simulate errors with mocks, but only a real backend integration run can prove authentication, persistence and concurrent usage behavior.
- Backend `usedCount` is an occupied-slot counter, not a lifetime redemption total. The web must display the server's latest value after save/refresh and handle a concurrent release or reservation before submit.

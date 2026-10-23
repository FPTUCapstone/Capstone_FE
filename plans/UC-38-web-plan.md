# UC-38 Web Coupon Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an approved Tour Operator create a coupon from a responsive Web form backed by UC-38 APIs.

**Architecture:** Add a typed API service and a focused client form in `src/features/operator/coupons`; the App Router page only composes the feature. The service owns API parsing and safe error translation, while the form owns local validation and presentation state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Vitest.

**Spec:** `specs/UC-38-web-spec.md`

## Global Constraints

- Use the existing Web session/auth client and configured API base; never hard-code URLs or expose tokens.
- Do not add listing, edit/deactivation, redemption, payment or booking calculation.
- Preserve valid input after recoverable errors and keep all controls keyboard accessible.

## Review Focus

- `409 coupon.code_conflict` retains form state and associates its message with code.
- Flat mode omits a stale percentage cap.
- No eligible tour produces an actionable empty state and cannot submit.
- In-flight submission is single-shot and a late response cannot replace newer state.
- `401/403/404/422` responses never display raw backend text.

---

### Task 1: Coupon API service

**Files:** `src/features/operator/coupons/services/couponApi.ts`, `src/features/operator/coupons/services/couponApi.test.ts`

- [ ] Write failing tests for eligible-tour parsing, create payload serialization, flat/percentage cap handling, and error mapping.
- [ ] Run `npm test -- couponApi`; confirm RED because the service is absent.
- [ ] Implement `getEligibleCouponTours()` and `createCoupon(input)` using the existing API base/session policy.
- [ ] Run the focused test; confirm GREEN.
- [ ] Commit this task.

### Task 2: Accessible responsive creation form

**Files:** `src/features/operator/coupons/CouponCreateForm.tsx`, `src/features/operator/coupons/CouponCreateForm.test.tsx`, `src/features/operator/coupons/couponForm.ts`

- [ ] Write failing tests for cap switching, range validation, search/select tours, empty tours, conflict retention and single submit.
- [ ] Run `npm test -- CouponCreateForm`; confirm RED.
- [ ] Implement the grouped form, code generator, VND summary, loading/empty/error/success states and action footer.
- [ ] Run focused tests; confirm GREEN.
- [ ] Commit this task.

### Task 3: Partner route integration

**Files:** `app/partner/coupons/create/page.tsx`, `src/lib/routes.ts`, related form test

- [ ] Write a failing test that an ineligible session does not receive an actionable form.
- [ ] Run the test; confirm RED.
- [ ] Compose the Partner route with established session/partner shell behavior.
- [ ] Run focused tests; confirm GREEN.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; manually inspect keyboard and narrow/wide layouts; commit.

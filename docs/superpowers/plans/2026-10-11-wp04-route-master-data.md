# WP-04 Route Master Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build truthful Next.js Web shells for UC-55 and UC-56 (Screen #20 Routes List, Screen #21 Create Route, Screen #22 Update Route) while Backend contracts are unavailable.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-11-wp04-route-master-data-design.md`

## Global Constraints

- Web-only scope; do not modify Backend or Mobile repositories.
- No synthetic mock persistence, fake routes, or misleading success states.
- Server Components for pages and unavailable shells.
- Sealed `Administrator` session verification (`verifyAdminSessionFromCookies`), with `AdminAccessDeniedView` for `Staff` sessions (`BR-115`).
- English resource-backed copy (`src/features/admin/routes/resources/en.ts`).
- Verification gates: Vitest tests, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`.

---

### Task 1: Route resources, ID validator, and Routes List view (Screen #20)

**Files:**
- Create: `src/features/admin/routes/resources/en.ts`
- Create: `src/features/admin/routes/utils/routeIdValidator.ts`
- Create: `src/features/admin/routes/utils/routeIdValidator.test.ts`
- Create: `src/features/admin/routes/components/RouteDirectoryUnavailableView.tsx`
- Create: `src/features/admin/routes/components/RouteDirectoryUnavailableView.test.tsx`
- Create: `app/admin/(console)/routes/page.tsx`
- Create: `app/admin/(console)/routes/page.test.tsx`

**Checklist:**
- [x] Write failing test for `routeIdValidator` and `RouteDirectoryUnavailableView`
- [x] Implement `routeIdValidator` and `RouteDirectoryUnavailableView`
- [x] Implement Server Component `app/admin/(console)/routes/page.tsx` with `Administrator` session guard
- [x] Run focused Vitest tests and verify pass

---

### Task 2: Create Route authoring form shell (Screen #21)

**Files:**
- Create: `src/features/admin/routes/components/CreateRouteUnavailableView.tsx`
- Create: `src/features/admin/routes/components/CreateRouteUnavailableView.test.tsx`
- Create: `app/admin/(console)/routes/create/page.tsx`
- Create: `app/admin/(console)/routes/create/page.test.tsx`

**Checklist:**
- [x] Write failing test for `CreateRouteUnavailableView`
- [x] Implement `CreateRouteUnavailableView` with SRS §3.9.4.1 fields and disabled pending controls
- [x] Implement Server Component `app/admin/(console)/routes/create/page.tsx` with `Administrator` session guard
- [x] Run focused Vitest tests and verify pass

---

### Task 3: Update Route detail and edit shell (Screen #22)

**Files:**
- Create: `src/features/admin/routes/components/UpdateRouteUnavailableView.tsx`
- Create: `src/features/admin/routes/components/UpdateRouteUnavailableView.test.tsx`
- Create: `app/admin/(console)/routes/[routeId]/page.tsx`
- Create: `app/admin/(console)/routes/[routeId]/page.test.tsx`

**Checklist:**
- [x] Write failing test for `UpdateRouteUnavailableView` and route ID validation
- [x] Implement `UpdateRouteUnavailableView`
- [x] Implement Server Component `app/admin/(console)/routes/[routeId]/page.tsx` with `Administrator` session guard and `notFound()` for invalid IDs
- [x] Run focused Vitest tests and verify pass

---

### Task 4: Complete verification gates

- [x] Run all Vitest tests for `src/features/admin/routes` and `app/admin/(console)/routes`
- [x] Run `npm run lint`
- [x] Run `npx tsc --noEmit`
- [x] Run `npm run build`
- [x] Run `git diff --check`

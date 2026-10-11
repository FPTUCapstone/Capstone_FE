# WP-04 Route Master Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build truthful Next.js Web shells for UC-55 and UC-56 (Screen #20 Routes List, Screen #21 Create Route, Screen #22 Update Route) while Backend contracts are unavailable.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-11-wp04-route-master-data-design.md`

## Global Constraints

- Web-only scope; do not modify Backend or Mobile repositories.
- No synthetic mock persistence, fake routes, or misleading success states.
- Server Components for pages; narrow Client Components for form input validation.
- Sealed Admin/Staff session verification (`verifyAdminSessionFromCookies`).
- English resource-backed copy (`src/features/admin/routes/resources/en.ts`).
- Verification gates: Vitest tests, `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check`.

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
- [ ] Write failing test for `routeIdValidator` and `RouteDirectoryUnavailableView`
- [ ] Implement `routeIdValidator` and `RouteDirectoryUnavailableView`
- [ ] Implement Server Component `app/admin/(console)/routes/page.tsx` with session guard
- [ ] Run focused Vitest tests and verify pass
- [ ] Commit: `feat(web): add route directory shell for UC-55/56`

---

### Task 2: Create Route authoring form shell (Screen #21)

**Files:**
- Create: `src/features/admin/routes/components/CreateRouteUnavailableView.tsx`
- Create: `src/features/admin/routes/components/CreateRouteUnavailableView.test.tsx`
- Create: `app/admin/(console)/routes/create/page.tsx`
- Create: `app/admin/(console)/routes/create/page.test.tsx`

**Checklist:**
- [ ] Write failing test for `CreateRouteUnavailableView`
- [ ] Implement `CreateRouteUnavailableView` with field validation and disabled pending submit button
- [ ] Implement Server Component `app/admin/(console)/routes/create/page.tsx`
- [ ] Run focused Vitest tests and verify pass
- [ ] Commit: `feat(web): add create route shell for UC-55`

---

### Task 3: Update Route detail and edit shell (Screen #22)

**Files:**
- Create: `src/features/admin/routes/components/UpdateRouteUnavailableView.tsx`
- Create: `src/features/admin/routes/components/UpdateRouteUnavailableView.test.tsx`
- Create: `app/admin/(console)/routes/[routeId]/page.tsx`
- Create: `app/admin/(console)/routes/[routeId]/page.test.tsx`

**Checklist:**
- [ ] Write failing test for `UpdateRouteUnavailableView` and route ID validation
- [ ] Implement `UpdateRouteUnavailableView`
- [ ] Implement Server Component `app/admin/(console)/routes/[routeId]/page.tsx` with `notFound()` for invalid IDs
- [ ] Run focused Vitest tests and verify pass
- [ ] Commit: `feat(web): add update route shell for UC-56`

---

### Task 4: Complete verification gates

- [ ] Run all Vitest tests for `src/features/admin/routes` and `app/admin/(console)/routes`
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Run `git diff --check`
- [ ] Commit: docs and test coverage

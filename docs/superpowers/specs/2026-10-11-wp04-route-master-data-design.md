# WP-04 Route Master Data — Web Design

## Goal

Deliver the Administrator Web workspace structure for UC-55 (Create Route) and UC-56 (Update Route), encompassing Screen #20 (Routes List), Screen #21 (Create Route), and Screen #22 (Update Route), without representing unavailable Backend persistence or routing endpoints as live operations.

## Scope and ownership

- Platform: Next.js Web only. UC-55 and UC-56 are `ADMIN_WEB_ONLY` in `docs/WEB_SCOPE_MATRIX.md`.
- Screens owned:
  - Screen #20: Routes List (`/admin/routes`)
  - Screen #21: Create Route (`/admin/routes/create`)
  - Screen #22: Update Route (`/admin/routes/[routeId]`)
- Role authorized: `Administrator` only (SRS §3.9.4.1 & §3.9.4.2 `BR-115`). Authenticated `Staff` sessions are blocked with `AdminAccessDeniedView`.
- Boundaries:
  - This work package does not modify Backend services or database schema.
  - It does not modify shared navigation `src/components/navigation/AdminNavigation.tsx` or `src/lib/routes.ts` without integration coordination.
  - No synthetic routes, fake mock databases, or simulated persistence are introduced.

## Confirmed Backend readiness

At design time, `origin/develop` on Backend has no route management controllers or endpoints (`/api/v1/routes`). Only internal route calculation providers (`IRouteDurationProvider` for scheduling calculations) exist.
Consequences:
1. The route directory (`/admin/routes`) renders an explicit, truthful pending-backend state explaining that the Route Master Data management API is pending integration.
2. The Create Route screen (`/admin/routes/create`) renders the SRS §3.9.4.1 route authoring shell (Origin Point of Interest, Destination Point of Interest, Distance (km), Estimated Travel Time (minutes), Transport Mode, Route Note, and Map Preview placeholder) with controls disabled and linked via `aria-describedby` to the pending integration description.
3. The Update Route screen (`/admin/routes/[routeId]`) validates a positive numeric route ID (`parseRouteId`) and displays an explicit unavailable/pending workspace with the requested Route ID context and disabled status/save controls.
4. All text is backed by English resource dictionaries (`CR-09`).

## User experience & route design

### 1. Routes List: `/admin/routes` (Screen #20)
- Authenticated `Administrator` sessions only (`BR-115`). Missing/invalid session redirects to `/admin/login?returnUrl=%2Fadmin%2Froutes`; `Staff` sessions render `AdminAccessDeniedView`.
- Displays module purpose: Route Master Data catalog, search by origin/destination, transport mode filter, and link to `/admin/routes/create`.
- Shows disabled search/filter controls with `aria-describedby` explaining Backend integration is pending.
- Provides a return path to the Administration Dashboard (`/admin`).

### 2. Create Route: `/admin/routes/create` (Screen #21)
- Authenticated `Administrator` sessions only (`BR-115`). Missing/invalid session redirects to `/admin/login?returnUrl=%2Fadmin%2Froutes%2Fcreate`; `Staff` sessions render `AdminAccessDeniedView`.
- Form fields aligned with SRS §3.9.4.1:
  - Origin Point of Interest (active POI selector placeholder, `BR-35`)
  - Destination Point of Interest (active POI selector placeholder, `BR-35`)
  - Distance (km)
  - Estimated Travel Time (minutes)
  - Transport Mode (`Driving`, `Motorcycle`, `Public Transit`, `Walking`)
  - Route Note
  - Map Preview Pending region explaining turn-by-turn / polyline preview awaits Backend & map service integration
- Controls and submission button (`Create Route (Unavailable)`) are disabled with `aria-describedby` so the user is never misled into thinking a route was saved.
- Return link back to `/admin/routes`.

### 3. Update Route: `/admin/routes/[routeId]` (Screen #22)
- Authenticated `Administrator` sessions only (`BR-115`). Missing/invalid session redirects to `/admin/login?returnUrl=%2Fadmin%2Froutes`; `Staff` sessions render `AdminAccessDeniedView`.
- Validates `routeId` as a positive safe integer. If invalid, triggers `notFound()`.
- Renders the route edit shell with the requested Route ID context and explanatory pending integration banner.
- Action controls (`Deactivate Route unavailable`, `Activate Route unavailable`, `Save Changes (Unavailable)`) remain disabled with `aria-describedby` pending real Backend contracts.
- Return link back to `/admin/routes`.

## Architecture & directory structure

- Route pages:
  - `app/admin/(console)/routes/page.tsx`
  - `app/admin/(console)/routes/create/page.tsx`
  - `app/admin/(console)/routes/[routeId]/page.tsx`
- Feature module under `src/features/admin/routes`:
  - `resources/en.ts`
  - `utils/routeIdValidator.ts` & `utils/routeIdValidator.test.ts`
  - `components/RouteDirectoryUnavailableView.tsx` & `.test.tsx`
  - `components/CreateRouteUnavailableView.tsx` & `.test.tsx`
  - `components/UpdateRouteUnavailableView.tsx` & `.test.tsx`
- Pages and unavailable views are Server Components and consume `verifyAdminSessionFromCookies`.

## Verification gates

- Component and utility tests in Vitest.
- Route tests verifying session checks (`missing`, `unsealed`, `expired`, `tampered`, `mismatch`, `Staff` access denied, `Administrator` allowed, and `notFound()` on invalid `routeId`).
- `npm run lint` -> 0 errors.
- `npx tsc --noEmit` -> 0 errors.
- `npm run build` -> production build succeeds with `/admin/routes`, `/admin/routes/create`, and `/admin/routes/[routeId]`.
- `git diff --check` -> no whitespace or formatting defects.

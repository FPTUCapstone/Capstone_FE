# WP-04 Route Master Data — Web Design

## Goal

Deliver the Administrator and Staff Web workspace structure for UC-55 (Create Route) and UC-56 (Update Route), encompassing Screen #20 (Routes List), Screen #21 (Create Route), and Screen #22 (Update Route), without representing unavailable Backend persistence or routing endpoints as live operations.

## Scope and ownership

- Platform: Next.js Web only. UC-55 and UC-56 are `ADMIN_WEB_ONLY` in `docs/WEB_SCOPE_MATRIX.md`.
- Screens owned:
  - Screen #20: Routes List (`/admin/routes`)
  - Screen #21: Create Route (`/admin/routes/create`)
  - Screen #22: Update Route (`/admin/routes/[routeId]`)
- Roles authorized: Administrator and Staff (internal operations).
- Boundaries:
  - This work package does not modify Backend services or database schema.
  - It does not modify shared navigation `src/components/navigation/AdminNavigation.tsx` or `src/lib/routes.ts` without integration coordination.
  - No synthetic routes, fake mock databases, or simulated persistence are introduced.

## Confirmed Backend readiness

At design time, `origin/develop` on Backend has no route management controllers or endpoints (`/api/v1/routes`). Only route calculation providers (`IRouteDurationProvider` for scheduling calculations) exist.
Consequences:
1. The route directory (`/admin/routes`) renders an explicit truthful pending-backend state explaining that Route Master Data management API is pending integration.
2. The Create Route screen (`/admin/routes/create`) renders the route authoring form shell with client-side field validation, but keeps the submission control safely disabled with clear copy that Backend route persistence is pending integration.
3. The Update Route screen (`/admin/routes/[routeId]`) validates a positive numeric route ID and displays an explicit unavailable/pending workspace.
4. All text is backed by English resource dictionaries (`CR-09`).

## User experience & route design

### 1. Routes List: `/admin/routes` (Screen #20)
- Authenticated Staff and Administrator sessions only. Missing/invalid session redirects to `/admin/login`.
- Displays module purpose: Route Master Data catalog, search by name/origin/destination, and link to create a new route.
- Shows disabled search/filter controls and a banner explaining Backend integration is pending.
- Provides a return path to the Staff console (`/admin/staff`).

### 2. Create Route: `/admin/routes/create` (Screen #21)
- Authenticated Staff and Administrator sessions only.
- Form inputs: Route Name, Origin Location, Destination Location, Estimated Distance (km), Estimated Travel Duration (minutes), Transportation Mode (e.g., Driving, Walking, Transit), Description, and Active Status toggle.
- Client validation: Route Name is required; Origin and Destination are required; positive numbers for distance and duration.
- Submission button is disabled or clearly marked with a `Pending Backend Integration` notice to avoid misleading the user into thinking a route was saved.
- Return link back to `/admin/routes`.

### 3. Update Route: `/admin/routes/[routeId]` (Screen #22)
- Authenticated Staff and Administrator sessions only.
- Validates `routeId` as a positive integer. If invalid, triggers `notFound()`.
- Renders the route edit shell with the requested Route ID context and explanatory pending integration banner.
- Action controls (Save Changes, Deactivate) remain disabled pending real Backend contracts.
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
- Pages are Server Components and consume `verifyAdminSessionFromCookies`.
- Client interactive elements (form fields and validation) are encapsulated in client components with narrow boundaries.

## Verification gates

- Component and utility tests in Vitest.
- Route tests verifying session checks and rendering.
- `npm run lint` -> 0 errors.
- `npm run typecheck` -> 0 errors.
- `npm run build` -> production build succeeds with `/admin/routes`, `/admin/routes/create`, and `/admin/routes/[routeId]`.
- `git diff --check` -> no whitespace or formatting defects.

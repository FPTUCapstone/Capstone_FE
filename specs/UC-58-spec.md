# UC-58 View Active Trips Frontend Specification

## Status

Approved by the developer on 2026-09-26.

## Sources and approved decisions

- SRS section 3.9.6.1, BR-51, BR-52, BR-115, BR-124, CR-01, CR-02, CR-07, MSG29, MSG126, MSG127, and MSG128.
- `docs/WEB_SCOPE_MATRIX.md` classifies UC-58 as `ADMIN_WEB_ONLY`.
- The approved Backend contract is recorded in the colocated Backend `specs/UC-58-spec.md`.
- A Self-Planned trip without a canonical destination is shown as `Not available`.
- Approved clarification on 2026-09-26: an upstream `401` or `403` invalidates the local Administrator session cookie; validation and availability failures do not.
- Approved clarification on 2026-09-26: UC-58 does not render a disabled or broken View Details action. UC-59 adds the action and its column when its route is implemented.

## Scope

Create the Administrator Active Trips monitoring screen at:

`/admin/trips/active`

The screen is read-only. It displays operational counters, submitted search/filter criteria, a paginated active-trip table, and the states required by the SRS. It calls the Backend only through a same-origin server proxy using the existing HttpOnly Administrator session.

## Screen contract

### Summary cards

- Active Trips
- Trips with Open Alerts
- Travelers on Trip

These values are global operational totals returned by the Backend and do not change when the list is filtered.

### Search and filters

- Keyword: Trip Code, Group Name, or Tour Name.
- Trip Type: All, Self-Planned, Tour.
- Destination: submitted text filter; an empty value means all destinations.
- Start Date From and Start Date To. Both use the current `Asia/Ho_Chi_Minh` calendar date as their maximum; future dates are invalid.
- Alert State: All, With Open Alerts, Without Open Alerts.
- Search/Apply button. Search is submitted explicitly, never on each keystroke.
- Clear button restores default criteria and page 1.

Applied criteria and page number are stored in URL query parameters so refresh, browser navigation, and return from a future UC-59 detail page preserve state. Any changed search/filter submission resets the page to 1.

### Table

Columns:

1. Trip Code
2. Trip Type
3. Current Status
4. Group or Traveler
5. Destination
6. Start Date
7. Current Day
8. Members
9. Open Alerts

Display rules:

- Backend timestamp fields remain UTC ISO 8601 values. The Web converts them explicitly with the `Asia/Ho_Chi_Minh` time zone; it must not rely on the browser's current time zone.
- Dates use `dd/MM/yyyy` and times use `HH:mm` in 24-hour form (CR-07). When a date and time are shown together, the display is `dd/MM/yyyy HH:mm`; seconds are omitted.
- Date-filter values use `yyyy-MM-dd` in the URL/API because they are calendar-date inputs, while their visible presentation follows the approved date-field/browser control behavior.
- A null destination or start date displays `Not available`.
- A null current day displays `Not available`.
- Counts display as non-negative integers.
- Status and trip type use accessible text badges; meaning must not rely on color alone.
- Precise latitude/longitude is never displayed or retained in client state.
- UC-58 renders neither a View Details column nor a disabled placeholder. UC-59 will add a View Details action targeting `/admin/trips/active/{tripId}` when that route exists. This is an explicit staged-delivery exception to the SRS alternative flow, preventing a broken link or a control with no available action.

### Pagination

- 20 records per page by default.
- Show total record count and current/total pages.
- Previous and Next controls are disabled at the corresponding boundary.
- URL state preserves page and filters.

## Same-origin proxy

`GET /api/admin/trips/active`

The proxy forwards only the allowlisted UC-58 query parameters to `GET /api/v1/admin/trips/active`, attaches the server-held Administrator bearer token, disables caching, and never exposes the token to client JavaScript.

`tripId` is a non-empty decimal string, not a JSON number. This preserves every SQL Server `BIGINT` value without JavaScript precision loss. Future UC-59 routes use that string unchanged.

- Missing local Administrator cookie: return `401`; there is no cookie to clear. The screen redirects to `/admin/login?returnUrl=...`.
- Backend `401`: call `clearAdminSession()` and return a safe `401`; the screen redirects to the Admin login route.
- Backend `403`: call `clearAdminSession()` and return a safe `403`; the current response renders MSG126. Clearing the stale/unauthorized cookie prevents it from being reused on a later request.
- Backend validation `400`: preserve safe field errors needed for MSG29 without exposing private upstream content, and do not clear the Admin cookie.
- Backend/network failure: return/render MSG127 with Retry while preserving submitted criteria, and do not clear the Admin cookie.
- Successful payloads are runtime-validated before rendering; malformed success payloads are treated as unavailable.

## UI states

1. Loading: an accessible status without stale rows presented as current.
2. Success: counters, criteria, rows, and pagination.
3. Empty: MSG128, with filters preserved and no empty table body.
4. Invalid date range: MSG29 inline at the date fields; do not send the request.
5. Forbidden: MSG126.
6. Unavailable: MSG127 with Retry; previous submitted criteria remain.

## Responsive and accessibility requirements

- The screen works at 320 CSS pixels without page-level horizontal overflow. The wide table may use an explicitly labelled horizontal scroll region or switch to readable cards at small widths.
- Every input has a programmatic label; errors are associated with their fields.
- Search, Clear, Retry, and pagination controls are keyboard accessible.
- Loading and asynchronous error/result changes use suitable status/alert semantics without moving keyboard focus unexpectedly.

## Acceptance criteria

1. An authenticated Administrator can open `/admin/trips/active` and retrieve data through the HttpOnly Admin-session proxy without `useWebSession()` as the authorization gate.
2. Summary cards and all approved list fields render from the validated Backend response.
3. Search executes only on submit; filters compose and are represented in the URL.
4. Client validation blocks an inverted date range or either future date and renders MSG29 inline.
5. Empty, `401`, `403`, malformed success, and unavailable states follow this specification.
6. Pagination preserves all submitted criteria and displays the total count.
7. The screen performs no trip, itinerary, group, booking, alert, or rerouting mutation.
8. Component/service/proxy tests cover the contract and state transitions; an integration test proves Admin cookie -> proxy -> UC-58 GET once the corrected Admin login flow is available.
9. Lint, typecheck, production build, applicable automated tests, keyboard checks, and responsive checks pass.

## Non-goals and dependencies

- UC-59 content and navigation are excluded. UC-59 will add the View Details column and action; UC-58 contains no disabled placeholder or broken link.
- Exact Traveler locations and all intervention controls are excluded.
- A destination selector backed by a dedicated destination-list API is excluded; the current contract uses submitted destination text.
- The corrected Administrator login flow is an external dependency for end-to-end acceptance.
- The visual design must be reviewed before production UI implementation, as required by the Web repository rules; this specification defines behavior and content rather than final styling.

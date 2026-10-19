# UC-59 View Active Trip Details Frontend Specification

## Status

**Approved 2026-09-30** (companion decisions approved with the BE spec). The dedicated Web Screen
Specification is `specs/UC-59-web-screen-spec.md`; implementation follows
`plans/UC-59-plan.md`.

## Sources and scope

- Current SRS `Capstone_Docs/Report3_Software-Requirement-Specification (1).docx`
  (SHA-256 `E078E898424056BAB3D7BFF992734D7B38781483C2FA3C455AC9DB01F17DFD7D`),
  Table 3 UC-59 and Table 4 Active Trip Details / `WEB_SCOPE_MATRIX.md` row UC-59:
  `ADMIN_WEB_ONLY`, read-oriented operational
  detail; no intervention actions unless separately approved.
- BE contract: `GET /api/v1/admin/trips/active/{tripId}` (see BE spec for the full DTO and error
  semantics). Active-trip definition, trip code, trip type, group/traveler, destination, member
  and alert counts reuse the approved UC-58 calculations — this screen must not re-derive them.
- Screen belongs to Web Batch 5 (Admin monitoring). Entry point is the approved UC-58 screen
  `/admin/trips/active`; each list row has a visible `View Details` link to its detail route.

## Route and session contract

- Route: `/admin/trips/active/[id]` (App Router dynamic segment), added to `ROUTES.admin`.
- Same-origin proxy: `GET /api/admin/trips/active/[id]` server route handler reusing the shared
  admin cookie contract (`tripmate_admin_access_token`, HttpOnly) — same pattern as the UC-58
  active-trips proxy. The browser never reads, stores, or sends a bearer token.
- **Trip ID validation (approved hardening, guards against the UC-50 `parseInt` defect class):**
  - Never use `parseInt`, `Number()`, or arithmetic on the ID; the tripId stays a **decimal
    string** from the URL through the proxy to the DTO (JSON string IDs never round-trip through
    `Number`).
  - The only accepted shape is a canonical decimal string matching `^[1-9]\d*$` whose value does
    not exceed `9223372036854775807` (signed 64-bit maximum) — compare digit-string length then
    lexicographic order, without constructing a `Number`.
  - Rejected: `1abc`, `1.5`, `1e3`, `+1`, leading/trailing whitespace, `0`, negatives, leading
    zeros, empty, and overflow beyond the 64-bit maximum.
  - The page route `/admin/trips/active/[id]` with an invalid ID renders the Next.js not-found
    boundary **without calling the API**; the proxy `/api/admin/trips/active/[id]` with an
    invalid ID returns `400` **without contacting the backend**. Both boundaries use the same
    validator implementation.
- Non-Administrator cannot load data; the backend remains the authorization authority.

## Screen content (read-only monitoring)

Single-column responsive page under the existing Admin console layout, grouped into sections.
Refresh is a read action; trip intervention controls are outside this monitoring scope:

1. **Header** — trip code, trip type, current FSM state badge, group/traveler name, destination,
   back link to Active Trips.
2. **Status cards** — current day, members, open alerts, last synchronized time (UTC+7 display,
   CR-07), current Traveler location (latitude/longitude + as-of time, `Not available` when null).
3. **Group Panel** — for each linked group: group name, host name, and the member table with
   full name, joined timestamp (UTC+7), and location-sharing state (`Enabled`/`Disabled` as
   badge + text). Per BR-51 the panel exposes only the state flag — never member coordinates.
   `Not available` when `groupPanel` is `null` (Self-Planned trip).
4. **Itinerary progress** — table ordered by sequence: stop name, kind, planned arrival/departure
   (UTC+7), status (`Planned`/`Visited`/`Skipped`).
5. **FSM state history** — chronological timeline: from → to, reason, triggered by, changed time.
6. **Incidents** — list ordered newest first: type, description, detected/resolved times; weather
   disruptions render the linked weather event (type, severity badge `Low`–`Extreme`, region,
   validity window); unresolved incidents are visually distinct.
7. **Rerouting events** — status (`Proposed`/`Accepted`/`Rejected`/`Expired`), proposed/decided
   times, and a `hasProposedItinerarySnapshot` indicator (shown as a neutral note, e.g.
   "Proposed itinerary snapshot available"). The snapshot content is excluded by the BE contract
   and never displayed.
8. **Location trail** — coordinates table (latitude, longitude, recorded time, offline-captured
   flag) of the bounded latest 100 points. No live map in this scope.

## States and error handling

| Situation | Behavior |
| --- | --- |
| Loading | Status region; no layout shift; no interactive controls claimed. |
| Success | All sections above; empty sections render an explicit "No records found." row (MSG128) rather than blank space. |
| `404` | Explicit not-found message using the proposed MSG133 wording: `Active trip not found or no longer available for monitoring.` with a back-to-list action. |
| `401` | Redirect to `/admin/login?returnUrl=<detail route>` (existing admin session expiry behavior). |
| `403` | MSG126 alert; no data rendered. |
| `400`/`503`/network | MSG127-style unavailable alert with Retry; a retry re-fetches without full page reload. |
| Manual refresh | A Refresh control re-fetches on demand; no auto-polling (no SRS requirement). |

## Acceptance criteria

1. Every list row on `/admin/trips/active` has a visible `View Details` link to its detail route; direct navigation and
   browser refresh work on the detail route.
2. All BE response fields render with correct UTC+7 formatting; JSON string IDs never round-trip
   through `Number`.
3. The trip-ID validator rejects every shape in the rejected list (`1abc`, `1.5`, `1e3`, `+1`,
   whitespace, `0`, negatives, leading zeros, overflow) at both boundaries: page route → not-found
   boundary with no API call; proxy → `400` with no backend call.
4. Loading/success/empty/`404`/`401`/`403`/unavailable states behave exactly as the table above.
5. No mutation, decision, or resolution control exists on the screen (scope guard).
6. Responsive at 320/768/1280px without horizontal overflow; visible keyboard focus; semantic
   landmarks and headings; severity/state not conveyed by color alone.
7. Proxy and service unit tests cover cookie forwarding, id validation, status passthrough, DTO
   narrowing, and state behavior; screen tests cover the state table above.

## Non-goals

Intervention actions, live map rendering, auto-refresh/polling, full location trail pagination,
Mobile equivalents (`MOBILE_ONLY` trip-navigation UCs are untouched), and any change to the
UC-58 list contract.

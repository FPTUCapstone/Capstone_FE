# UC-59 Active Trip Details Web Screen Specification

## Route and scope

- Route: `/admin/trips/active/[id]` inside the existing Administrator console layout, reached
  from each row of the approved UC-58 Active Trips list.
- Read-only monitoring screen. Intervention actions (incident resolution, rerouting decisions,
  itinerary/session mutation) are excluded until a separate UC is approved.
- Data comes only from the same-origin `/api/admin/trips/active/[id]` proxy; the trip ID is
  validated by the shared strict validator (canonical decimal string `^[1-9]\d*$` within the
  signed 64-bit maximum; no `parseInt`/`Number`). An invalid ID renders the not-found boundary
  without calling the API.
- Maintainer approval to implement without a Stitch-generated UI is recorded by developer
  approval of this specification (Stitch is optional per `CODEBASE_RULES.md`).

## Layout

- Header: back link to `/admin/trips/active`, eyebrow `Administrator monitoring`, title
  `TRIP-{id}`, and badges for trip type (`Tour`/`SelfPlanned`) and current FSM state
  (`Navigating`/`Exploring`/`Interrupted` as colored-badge + text, never color alone).
- Identity row: group/traveler name and destination (`Not available` when null), plus a manual
  Refresh button (no auto-polling; no SRS requirement).
- Status cards: Current Day, Members, Open Alerts, Last Synced (UTC+7; `Not available` when
  null), and Current Traveler Location (latitude/longitude with as-of time, or `Not available`
  when the session has no fix; coordinates as text, no live map).
- Group Panel (BR-51): one block per linked group with group name, host name, and a member table
  (full name, joined timestamp UTC+7, location-sharing state as `Enabled`/`Disabled` badge +
  text). The panel exposes only the sharing-state flag — never member coordinates. Renders
  `Not available` when `groupPanel` is `null` (Self-Planned trip).
- Six data sections render in order:
  1. Itinerary Progress — table ordered by `sequenceNo`: stop name, kind, planned
     arrival/departure (UTC+7, `Not available` when null), status (`Planned`/`Visited`/`Skipped`
     as badge + text).
  2. FSM State History — chronological timeline: from → to, reason, triggered by, changed time.
  3. Incidents — newest first: type, description, detected/resolved times; unresolved incidents
     visually distinct with a text label; weather disruptions render the linked weather event
     (type, severity badge + text `Low`–`Extreme`, region, validity window).
  4. Rerouting Events — status (`Proposed`/`Accepted`/`Rejected`/`Expired`), proposed/decided
     times, and a neutral note when `hasProposedItinerarySnapshot` is true; snapshot content is
     never displayed.
  5. Location Trail — coordinates table (latitude, longitude, recorded time, offline-captured
     flag) of the latest 100 points returned ascending.
- Responsive: desktop/tablet (≥1024px) two-column card grid with full-width tables; 768px single
  column; 320px cards stack and every table scrolls **inside its own scrollable container**
  (explicit `overflow-x` region with accessible name), preventing page-level horizontal
  overflow.

## States

- Loading uses an accessible `role="status"`; no section pretends to hold data before load.
- Success renders every section; a section with no rows shows MSG128:
  `No data is available for the selected criteria.` instead of blank space.
- Not found (`404`, including a trip that left the active monitoring states) shows proposed
  MSG133: `Active trip not found or no longer available for monitoring.` with a back-to-list
  action.
- Forbidden shows locked MSG126: `You do not have permission to access this function.`
- Unavailable (`400`/`503`/network) shows locked MSG127 with Retry:
  `TripMate is temporarily unable to process your request. Please check your connection and try
  again.`
- A `401` redirects to `/admin/login?returnUrl=%2Fadmin%2Ftrips%2Factive%2F{id}`.

## Field mapping

| UI | API field |
| --- | --- |
| Title/badges | `tripCode`, `tripType`, `currentState` |
| Identity row | `groupOrTraveler`, `destination` |
| Status cards | `currentDay`, `members`, `openAlerts`, `lastSyncedAtUtc` |
| Current location | `currentLocation.latitude/longitude/asOfUtc` |
| Group Panel | `groupPanel[]` (`groupName`, `hostName`, `members[]`: `fullName`, `joinedAtUtc`, `isLocationSharingEnabled`) |
| Itinerary Progress | `itineraryProgress[]` (`sequenceNo`, `poiName`, `itemKind`, `status`, `plannedArrivalUtc`, `plannedDepartureUtc`) |
| State History | `stateHistory[]` (`fromState`, `toState`, `reason`, `triggeredBy`, `changedAtUtc`) |
| Incidents + weather | `incidents[]` (`incidentType`, `description`, `detectedAtUtc`, `resolvedAtUtc`, `weatherEvent.*`) |
| Rerouting | `reroutingEvents[]` (`status`, `proposedAtUtc`, `decidedAtUtc`, `hasProposedItinerarySnapshot`) |
| Location Trail | `locationTrail[]` (`latitude`, `longitude`, `recordedAtUtc`, `isOfflineCaptured`) |

All timestamps render with `Intl.DateTimeFormat` using `timeZone: 'Asia/Ho_Chi_Minh'`,
`dd/MM/yyyy HH:mm`, 24-hour time.

## Accessibility and styling

- One `h1` (title) with per-section `h2` headings; landmarks for header/main; tables use proper
  `<th scope>` and captions.
- Every control has an accessible name (Refresh, back link); state and severity meaning always
  includes text; visible focus retained on all interactive elements.
- Tailwind CSS 4 with the existing Admin navy/teal/coral palette and shared components; no new
  dependency, CSS module, or chart/map library.

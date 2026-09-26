# UC-58 Active Trips Web Screen Specification

## Route and scope

- Route: `/admin/trips/active` inside the existing Administrator console layout.
- Read-only monitoring screen. UC-59 details and operational actions are excluded.
- Data comes only from the same-origin `/api/admin/trips/active` proxy.

## Layout

- Header: eyebrow `Administrator monitoring`, title `Active Trips`, and a concise description.
- Three summary cards: Active Trips, Trips with Open Alerts, Travelers on Trip.
- Filter panel: keyword, Trip Type, Destination, Start Date From, Start Date To, Alert State, Apply Filters, and Clear.
- Desktop/tablet: nine-column table in an explicitly scrollable container.
- At 320px: controls stack to one column and the table scrolls inside its own region, preventing page-level horizontal overflow.
- Footer: total record text plus Previous/Next pagination.

## States

- Loading uses an accessible `role="status"` and does not present stale rows as current.
- Empty shows locked MSG128: `No data is available for the selected criteria.`
- Invalid local date range shows locked MSG29 at the date controls and sends no request.
- Forbidden shows locked MSG126: `You do not have permission to access this function.`
- Unavailable shows locked MSG127 with a Retry button: `TripMate is temporarily unable to process your request. Please check your connection and try again.`
- A `401` redirects to `/admin/login?returnUrl=%2Fadmin%2Ftrips%2Factive`.

## Field mapping

| UI | API field |
| --- | --- |
| Keyword | `keyword` |
| Trip Type | `tripType` |
| Destination | `destination` |
| Start Date From | `startDateFrom` |
| Start Date To | `startDateTo` |
| Alert State | `alertState` |
| Current page | `pageNumber` |
| Fixed page size | `pageSize=20` |

The table maps the response fields in this order: `tripCode`, `tripType`, `currentState`, `groupOrTraveler`, `destination`, `startedAtUtc`, `currentDay`, `members`, `openAlerts`. Null destination/date/day values display `Not available`.

## Time, accessibility, and styling

- UTC timestamps are formatted with `Intl.DateTimeFormat` using `timeZone: 'Asia/Ho_Chi_Minh'`, `dd/MM/yyyy HH:mm`, and 24-hour time.
- All inputs have labels, errors are associated with both date controls, controls retain visible focus, and status meaning includes text.
- Use Tailwind CSS 4 and the existing Admin navy/teal/coral palette. No new dependency or CSS module is introduced.

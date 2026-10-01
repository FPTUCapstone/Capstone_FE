# UC-63 Payout Settlement (Payout Records) Web Screen Specification

## Route and scope

- Route: `/admin/payouts` inside the existing Administrator console layout, listed in the Admin
  navigation as `Payout Records`. SRS screen name: **Payout Settlement** (§3.9.9.1).
- Read-only finance screen. Detail (UC-64) and settlement confirmation (UC-65) are excluded;
  the per-row **[View Details]** action renders disabled with an explanatory title and must not
  navigate anywhere until UC-64 is approved (D11).
- Data comes only from the same-origin `/api/admin/payouts` proxy (admin cookie session; query
  keys allow-listed before forwarding).
- Maintainer approval to implement without a Stitch-generated UI is recorded by developer
  approval of this specification (Stitch is optional per `CODEBASE_RULES.md`).

## Layout

- Header: eyebrow `Administrator finance`, title `Payout Records`, concise description.
- Three summary cards recomputed with the **applied filters** (SRS Data Processing):
  `Pending Requests` (count of Pending + Requested), `Total Requested Amount` (sum of
  `netAmount` over Pending + Requested), `Total Confirmed Amount` (sum of `netAmount` over
  Confirmed + Paid); VND formatted (BR-79).
- Filter panel: Keyword (Payout code or operator name), Status (All / Pending / Requested /
  Confirmed / Paid / Rejected — the five-value superset per D3a, with the SRS three-value
  defect recorded), Period From, Period To; Apply Filters and Clear.
- Desktop/tablet: table in an explicitly scrollable container with columns in the SRS order —
  Payout Code, Tour Operator, Settlement Period, Gross Revenue, Commission, Net Payout,
  Requested Date, Status, Action ([View Details], disabled).
- At 320px: controls stack to one column and the table scrolls inside its own accessible region
  (`tabIndex={0}`, named "Payout records table; scroll horizontally on small screens"),
  preventing page-level horizontal overflow.
- Footer: total record text plus Previous/Next pagination; filters persist across pages
  (PC-03, URL query serialization).

## States

- Loading uses an accessible `role="status"` and does not present stale rows as current.
- Empty shows locked MSG128: `No data is available for the selected criteria.` and keeps the
  filters (SRS 5.a1).
- An inverted period range is blocked **client-side** with proposed MSG134 wording:
  `The submitted settlement period range is logically invalid.` (SRS references MSG29, whose
  locked content is the POI-coordinates message — recorded defect, D10) and sends no request
  (SRS 4.a1).
- Forbidden shows locked MSG126: `You do not have permission to access this function.`
- A `400` from invalid filter values shows the BE ProblemDetails message verbatim in an error
  alert (no Retry) — a user-input error must never be presented as MSG127. (Amended 2026-10-01.)
- Unavailable (`503`/network) shows locked MSG127 with a Retry button:
  `TripMate is temporarily unable to process your request. Please check your connection and try
  again.` (SRS 5.a2)
- A `401` redirects to `/admin/login?returnUrl=%2Fadmin%2Fpayouts`.

## Field mapping

| UI | API field |
| --- | --- |
| Keyword | `keyword` (matches derived Payout Code or operator company name) |
| Status filter | `status` |
| Period From / To | `periodFrom` / `periodTo` |
| Current page / size | `pageNumber` / `pageSize=20` (CR-01) |
| Summary cards | `summary.pendingRequests`, `summary.totalRequestedAmount`, `summary.totalConfirmedAmount` |
| Table columns | `items[]`: `payoutCode`, `operator.companyName`, `periodStart`–`periodEnd`, `grossRevenue`, `commissionAmount`, `netAmount`, `requestedAtUtc`, `status` |
| Row action | [View Details] — disabled placeholder (D11), no navigation |

- Money renders with `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`;
  the Net Payout column is right-aligned numeric.
- Periods render `dd/MM/yyyy – dd/MM/yyyy`; Requested Date renders `dd/MM/yyyy` in
  `Asia/Ho_Chi_Minh` (CR-07) with `Not available` for null; the API transport format stays
  `yyyy-MM-dd`.
- Status renders as badge + text (`Pending`/`Requested`/`Confirmed`/`Paid`/`Rejected`);
  meaning is never conveyed by color alone.

## Accessibility and styling

- One `h1` with per-section headings; landmarks for header/main; `<th scope>` and caption on
  the table; every control labeled; the disabled action has an accessible name and title; the
  filter error is associated with both date controls; visible focus retained.
- Tailwind CSS 4 with the existing Admin navy/teal/coral palette and shared components; no new
  dependency, CSS module, chart, or table library.

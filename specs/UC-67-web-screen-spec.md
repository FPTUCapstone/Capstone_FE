# UC-67 Platform Statistics Web Screen Specification

## Route and scope

- Route: `/admin/statistics` inside the existing Administrator console layout, listed in the
  Admin navigation as `Statistics`. SRS screen name: **Platform Statistics** (§3.9.11).
- Read-only analytics screen with the SRS two-step flow: **[Generate Report]** renders the
  aggregation of a closed period on screen; **[Export]** submits only the signed
  `resultToken` from that generate (DEC-4) — criteria are never re-sent, so the file matches
  the displayed figures exactly (BR-110/PC-02).
- Export formats follow DEC-1; until the team approves them, **no format option is enabled**
  and each carries an explanatory title (R1).
- The Booking Type filter is removed from this delivery (DEC-2); Tour Operator and Destination
  filters are keyword text inputs (R4).
- Data comes only from the same-origin `/api/admin/statistics/reports/*` proxies (admin cookie
  session).
- **Stitch decision: pending explicit maintainer approval.** Approval of this specification
  resolves scope and behavior only; it does not waive the reviewed-UI requirement (re-review
  R6).

## Layout

- Header: eyebrow `Administrator analytics`, title `Platform Statistics`, concise description.
- Criteria form: Report Type (User Growth / Booking Volume / Platform Revenue / Tour Operator
  Performance / Destination Popularity), Period Type (Month / Quarter / Year) with an adaptive
  picker compiling to **aligned** dates (whole month / quarter / year), Operator name keyword
  input, Destination name keyword input, [Generate Report] and [Cancel].
- Result area (post-generate): summary cards per report type, a Tailwind/CSS **bar chart** of
  the buckets (no chart library), and the bucket/row table duplicating the chart values as
  text (accessible alternative).
- Export row: Format select per DEC-1 (all options disabled with titles until approved),
  [Export] enabled only with a live on-screen result and unexpired token; proposed MSG136
  toast on success.
- Responsive: 320px single column, 768px two-column criteria, 1280px wide result grid; no
  page-level horizontal overflow.

## States

- Loading: accessible `role="status"`; generate/export buttons disabled during flight.
- Empty result: locked MSG128 text verbatim — `No records found matching your criteria.`
  (R6: the locked §5.3 content, not a paraphrase); Export disabled.
- Missing report type/period: locked MSG01 inline errors; client guard blocks the request.
- Misaligned period: inline field error; client guard blocks the request (R5).
- Open period (`422` `statistics.period_not_closed`): server message verbatim at the period
  controls; no aggregation runs (SRS 3.a2).
- Expired token (`422` `statistics.result_expired`): proposed MSG138 wording —
  "The generated report has expired. Please generate the report again." — with the criteria
  preserved; Export disabled until regeneration.
- Forbidden: locked MSG126. Unavailable (`503`/network): locked MSG127 with Retry (SRS 4.a2);
  the on-screen result is preserved on export failure (SRS 6.a1).
- `401`: redirect to `/admin/login?returnUrl=%2Fadmin%2Fstatistics`.

## Field mapping

| UI | API field |
| --- | --- |
| Report Type | `reportType` |
| Period Type / adaptive picker | `periodType`, `periodStart`, `periodEnd` (aligned per R5) |
| Operator / Destination keyword | `operatorKeyword`, `destinationKeyword` (R4) |
| Summary cards / chart / table | generate response `summary` + `buckets[]`/`rows[]` per report type (BE spec table) |
| Export | `{ resultToken, format }` only (R3) — no criteria |

- Money renders with `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`
  (BR-79); dates render `dd/MM/yyyy` in `Asia/Ho_Chi_Minh` (CR-07); bucket labels follow the
  unified rule (`MM/yyyy`, `Q<n>/yyyy`, `yyyy`).

## Accessibility and styling

- One `h1` with per-section `h2` headings; labeled controls; the bar chart is `role="img"`
  with an accessible summary and is duplicated by the table (never color alone); visible focus
  retained; disabled format options carry explanatory titles.
- Tailwind CSS 4 with the existing Admin navy/teal/coral palette and shared components; **no
  chart library, no new dependency** (D5).

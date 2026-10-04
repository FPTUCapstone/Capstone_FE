# UC-67 Export Statistical Reports Frontend Specification

## Status

**Draft — NOT ready for implementation.** Blocked on the same four team decisions as the BE
spec (DEC-1 export formats, DEC-2 service bookings/Booking Type filter, DEC-3 revenue
semantics, DEC-4 generate→export consistency). Rewritten 2026-10-01 after the leader's
six-point re-review; the re-review resolutions (R1–R6) below are incorporated.

## Sources and scope

- SRS §3.9.11: screen **Platform Statistics** — two-step flow: generate the aggregation of a
  **closed period** on screen, then export exactly that result (BR-110). Read-only; the export
  event is audited (BR-130).
- BE contract (see `Capstone_BE/specs/UC-67-spec.md`): `POST .../reports/generate` returns the
  figures **plus a signed, time-limited `resultToken`** (DEC-4); `POST .../reports/export`
  accepts only `{ resultToken, format }` and streams the CSV from the token's figures — the
  FE **never re-sends criteria** for export, guaranteeing PC-02.

## Route and session contract

- Route: `/admin/statistics`, added to `ROUTES.admin` and the Admin console navigation
  ("Statistics").
- Same-origin proxies: `POST /api/admin/statistics/reports/generate` and
  `POST /api/admin/statistics/reports/export` server route handlers reusing the shared admin
  cookie contract; the export route streams the upstream CSV with its headers; no browser-side
  bearer token.
- Non-Administrator cannot load data; the backend remains the authorization authority.

## Re-review resolutions (R1–R6)

| # | Point | Resolution here |
| --- | --- | --- |
| R1 | Format scope | Export formats follow DEC-1; until approved, **no format is enabled** and this spec has no format acceptance criterion. |
| R2 | Revenue semantics | BE-side; the FE renders whatever the generate response returns and invents no figures. |
| R3 | Generate→Export consistency | Export submits only the `resultToken` received from generate; criteria are never re-sent (DEC-4). |
| R4 | Misleading filters | **Booking Type filter removed** from this delivery (DEC-2); Tour Operator and Destination filters are **keyword text inputs** (company name / destination name substring) — no ID-select endpoints exist on this baseline, so no select is invented. |
| R5 | Period contract | The period picker compiles `periodType` + selection into **aligned** `periodStart`/`periodEnd` (whole month/quarter/year) and the client guard rejects misalignment before any request; bucket labels render with the BE's unified rule (`MM/yyyy`, `Q<n>/yyyy`, `yyyy`). |
| R6 | Messages/evidence/waiver | Empty state uses the **locked MSG128 text verbatim** ("No records found matching your criteria."); proposed MSG136/137/138 are labelled as proposals; the Stitch waiver sentence is **removed** — the Stitch decision is pending explicit maintainer approval. |

## Screen content (read-only, two-step flow per SRS)

Single-column responsive page under the Admin console layout:

1. **Header** — eyebrow `Administrator analytics`, title `Platform Statistics`, description.
2. **Criteria form** — Report Type select (five canonical types), Period Type select
   (`Month`/`Quarter`/`Year`) with an adaptive picker compiling to aligned dates, optional
   keyword inputs (**Operator name**, **Destination name** — no Booking Type filter in this
   delivery, R4), **[Generate Report]** and **[Cancel]**.
3. **Result area** (post-generate) — summary cards per report type, a **Tailwind/CSS bar
   chart** of the buckets (no chart library), and the bucket/row table. Empty result renders
   the locked MSG128 text.
4. **Export row** — Format select per DEC-1 (until approved: no option enabled, explanatory
   titles) and **[Export]**, enabled only while a generated result is on screen **and** its
   `resultToken` has not expired. Changing any criterion **discards the result and the token**
   (SRS alternative flow); [Export] disables until a new generate.
5. **Export feedback** — proposed MSG136 toast on success; the CSV download is triggered by
   the POST stream.

## States and error handling

| Situation | Behavior |
| --- | --- |
| Loading (generate/export in flight) | Buttons disabled; duplicate submits prevented. |
| Success (generate) | Result area rendered; Export enabled per DEC-1. |
| Success (export) | Proposed MSG136 toast; file downloaded; result stays. |
| No data | Locked MSG128 text verbatim; Export disabled. |
| Missing type/period (`400` MSG01) | Inline field errors; client guard blocks the request first. |
| Misaligned period (`400`) | Inline field error; client guard blocks first (R5). |
| Open period (`422` `statistics.period_not_closed`) | Server message verbatim at the period controls; no aggregation runs. |
| Expired token (`422` `statistics.result_expired`) | Proposed MSG138 wording; the criteria form keeps its values; the user regenerates. |
| `403` | Locked MSG126 alert. |
| `401` | Redirect to `/admin/login?returnUrl=%2Fadmin%2Fstatistics`. |
| `503` / network | Locked MSG127 alert with Retry (regenerate; export retried after regeneration if the token expired). |

## Acceptance criteria (draft — finalized after DEC-1…DEC-4)

1. Route supports direct navigation and refresh; nav entry highlights the workspace.
2. The two-step flow matches the SRS incl. the discard-on-change rule (AF1); Export submits
   only the token (R3).
3. The period picker compiles aligned dates and rejects misalignment client-side; all five
   report types render their bucket/row table and CSS chart; VND (BR-79) and CR-07 formatting.
4. Export format options exactly per DEC-1 (no invented enabled formats); the download
   filename/content-type match the BE contract; proposed MSG136 on success.
5. Empty state renders the locked MSG128 text verbatim (R6); all other states behave per the
   table above.
6. Responsive 320/768/1280px without page-level horizontal overflow; visible keyboard focus;
   semantic landmarks; the CSS chart has accessible text alternatives (values duplicated in
   the adjacent table).
7. Proxy/service unit tests cover cookie forwarding, status mapping with verbatim messages
   (422/503), DTO narrowing per report type, and the token-carrying export body; screen tests
   cover every state, the two-step flow, discard-on-change, and the disabled formats.

## Non-goals

Excel/PDF until DEC-1; Booking Type filter until DEC-2; rerouting-incident reports; scheduled
or emailed reports; chart libraries; any mutation. No change to other Admin screens beyond
the nav entry.

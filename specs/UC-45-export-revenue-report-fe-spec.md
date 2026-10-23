# UC-45 — Export Revenue Report (Web Specification)

## Scope and SRS traceability

This specification implements SRS §3.8.5.2 on the Tour Operator's responsive Next.js workspace. It turns the existing UC-44 Export Report dialog into a live UC-45 flow for Excel, CSV, and PDF exports with `summary` or `summary_and_details` content.

It includes the dialog, request submission, download, queued-export feedback, and export history. It excludes financial calculation in the browser, payout requests, and a Mobile implementation. The SRS names the Next.js web dialog as the UC-45 interface; Mobile remains out of scope until the SRS is amended.

## UX contract

1. The operator opens the dialog from a successfully applied UC-44 report. The dialog shows a read-only snapshot of the applied period, granularity, and tour filter.
2. The operator selects format (`xlsx`, `csv`, `pdf`) and scope (`summary`, `summary_and_details`), then selects **Export**.
3. The page sends only the filters and choices to the BFF. It never serializes revenue totals, detail rows, or a browser-generated CSV as production data.
4. A `201 Ready` result triggers one browser download from the server-provided authorized download endpoint and shows `MSG116`.
5. A `202 Queued` result closes or transitions the dialog to a queued state, shows that the export is being produced, and refreshes export history until a terminal status. Once ready, the operator receives a clear **Download** action. History remains available for re-download.
6. The dialog remains accessible: focus enters the dialog, Escape/Cancel closes without a request, disabled controls explain why, errors are announced through an alert region, and progress has an accessible status label.

## Data and API contract

The FE BFF must preserve the backend contract; the browser calls no backend URL directly.

- `POST /api/operator/revenue/exports` forwards the bearer/session credential and JSON body to `POST /api/v1/operator/revenue/exports`.
- `GET /api/operator/revenue/exports` forwards pagination/status query parameters for history.
- `GET /api/operator/revenue/exports/{id}/download` forwards authorization and either streams the file or follows only the backend-issued download flow.

Payload:

```ts
type RevenueExportRequest = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  granularity: 'daily' | 'weekly' | 'monthly';
  tourId?: number;
  format: 'xlsx' | 'csv' | 'pdf';
  scope: 'summary' | 'summary_and_details';
};
```

The response model includes export ID, immutable filter snapshot, format, scope, state (`Queued`, `Processing`, `Ready`, `Failed`, `Expired`), timestamps, filename, and a download endpoint only for ready, non-expired files. The browser treats all file bytes and filename/content type as server supplied; it must not relabel CSV bytes as Excel/PDF.

## States and messages

| Situation | UI behavior |
|---|---|
| Format omitted | inline required-field error `MSG01`; submit remains disabled until selection exists. |
| No reportable records | show `MSG128`; do not create a Blob or initiate download. |
| Authorization/approval failure | handle `MSG126` using the operator-session error policy. |
| File created | show `MSG116`, trigger download once, and add/refresh history. |
| Queued/processing | show non-dismissive status while the request completes; poll history with bounded backoff and stop when the page unmounts. |
| Render/storage failure | show `MSG117` with retry from the original immutable filter snapshot. |
| Download interrupted | show `MSG106`; leave the ready history item available for another download. |

The existing demo-only CSV generator and async simulator are explicitly removed from production behavior. They may remain only under an explicit Storybook/test fixture boundary with obvious demo labeling; production controls must support all three backend formats.

## Correctness and security rules

- The applied filters are frozen when the dialog opens. If the operator changes filters behind an open dialog, the dialog must close or require reopening; it must never export stale labels with new data.
- The UI may validate required fields and dates, but backend validation is authoritative. It forwards `MSG01`, `MSG126`, `MSG128`, and `MSG117` without inventing financial values.
- Never derive gross revenue, commission, net amount, or period buckets locally. Render only server results from UC-44 and UC-45.
- Never expose a persistent object-storage URL in client state, logs, analytics, or router query parameters.

## Acceptance criteria

- All formats and both scopes are selectable in production after the backend supports them.
- The exported request exactly matches the applied UC-44 filter snapshot.
- Ready, queued, failed, expired, empty, unauthorized, and interrupted-download states have tested accessible UI feedback.
- Existing layout remains responsive on desktop/tablet; financial table/report export remains a Web workflow.

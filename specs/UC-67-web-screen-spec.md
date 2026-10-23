# UC 67 Statistical Reports Screen Specification

## Route and actor

`/admin/reports` is available only to Administrator sessions. Staff, Traveler, and Tour Operator sessions receive the existing access-denied view.

## Workflow

1. Select report type and a closed reporting period.
2. Choose a compatible booking type and optional filter.
3. Generate the report. The UI sends criteria to the BFF and displays the returned immutable snapshot.
4. Choose CSV or Excel and download. The request carries a UUID export operation id and receives the file through the BFF.

## States

The screen must show initial, loading, generated, no-data, and error states. A period-not-closed response retains the criteria and tells the user to select a closed period. The UI must not show fabricated production statistics or a PDF option.

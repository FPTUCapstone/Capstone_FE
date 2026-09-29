# UC-51 manual test evidence

Captured on 2026-09-29 against the local UC-51 FE -> BE -> SQL Server flow.

| File | Scenario verified |
| --- | --- |
| `pending-application.png` | Tour Operator application in `Pending Approval` state with action buttons (`Approve Application`, `Reject Application`). |
| `approved-application.png` | Tour Operator application successfully approved, displayed as `Approved & Active`. |
| `rejected-application.png` | Tour Operator application in `Rejected` state with displayed rejection reason. |
| `rejected-conflict-fixture.png` | An already rejected fixture reloads with its persisted rejection reason. |
| `rejected-500-character-reason.png` | A rejection reason at the 500-character boundary is persisted and displayed in a collapsed layout with a `Show full reason` action. |

All scenarios verified end-to-end against the local flow: Admin FE -> ASP.NET Core BE -> SQL Server (`TripMateDb`), with audit log and notification creation verified in database.

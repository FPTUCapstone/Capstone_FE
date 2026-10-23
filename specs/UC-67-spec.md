# UC 67 Platform Statistics Frontend Specification

The Administrator route is `/admin/reports`. The screen reads closed-period data through the same-origin BFF route `/api/admin/statistical-reports`; it does not calculate financial values or use synthetic data in production. It supports CSV and Excel downloads only. The BFF forwards the verified Administrator bearer token to the backend and keeps backend URLs out of client code.

A generated report is a closed-period snapshot. Changing any criterion clears the displayed result. Download requests include a fresh `exportOperationId`, and the backend validates that this id is never reused for different criteria or a different file format. `All`, `Tour Package`, and `Commercial Service` are available only where the backend report matrix permits them. User Growth is platform-wide; operator and destination filters are not sent for service data.

The UI shows loading, API error, no-data, generated, and download states. It renders backend metrics and rows as returned, and labels platform revenue as recognized TripMate commission net of processed refund reversals.

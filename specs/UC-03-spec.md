# UC-03 Resubmit Tour Operator Application — Web Specification

## Status and scope

**Revised draft — 2026-10-08.** UC-03 is shared by Web and Mobile. The backend contract in `Capstone_BE/specs/UC-03-spec.md` is authoritative. This document defines the responsive Next.js Web behavior on `feature/linhnv-resubmit-tour-operator-application`.

The Web implementation replaces mock application data with the authenticated backend flow. Browser code communicates through same-origin Next.js route handlers; it never reads an Admin/Operator token or calls the backend directly.

## Routes and access

- `/partner/application`: current application status.
- `/partner/application/resubmit`: canonical correction form route.
- Only an authenticated Tour Operator with both returned states `Rejected` sees the Resubmit action.
- A direct visit to the resubmit route loads current state. If the application is missing or no longer rejected, show safe feedback and return to `/partner/application`.
- A `401` from either application route redirects to `/sign-in?returnUrl=/partner/application`.

## Session and BFF contract

1. Browser requests use same-origin FE endpoints with HttpOnly session cookies and `credentials: include` where required.
2. Next.js route handlers proxy only:
   - `GET /api/operator/application` → `GET /api/v1/operator/application`.
   - `PUT /api/operator/application/resubmit` → `PUT /api/v1/operator/application/resubmit`.
3. The proxy forwards the incoming abort signal to `fetchBackend`, sets no client-visible bearer token, and preserves multipart boundaries. Browser code must not manually set `Content-Type: multipart/form-data`.
4. Proxy errors expose safe structured status/codes only. Raw backend bodies, exception text, cookies, and asset references are never returned.

## Status page

`/partner/application` renders:

- loading skeleton while fetching;
- `Rejected`: company summary, rejection reason, review timestamp, document status list, and Resubmit action;
- `PendingApproval`: pending-review notice and locked-workspace guidance, with no Resubmit action;
- `Approved`: approved state and available workspace navigation;
- recoverable safe error with retry; `401` follows the login redirect above.

Document links use the short-lived `downloadUrl` and show expiry-aware failure/reload behavior. The UI labels a document by type and ID because the API does not guarantee an original `fileName`.

## Resubmit form

The form is prefilled from `GET /api/operator/application`.

| Field | Client rule |
| --- | --- |
| Company Name | required after trim, max 200, Unicode allowed |
| Business Licence Number | required after trim, max 100, exact UC-02 licence regex |
| Tax Code | required after trim, 10 digits or `10 digits-3 digits`, max 50 |
| Business Address | optional, trim, max 300, Unicode allowed |
| Contact Person | required after trim, max 150, Unicode allowed |
| Contact Phone | optional, exact UC-02 phone rule, max 20 |

Document behavior:

- Show existing document type, status, upload time, and authorized download action.
- A new Business License is optional; explain that leaving it empty reuses the latest existing license for another review.
- Allow up to five new supporting files for the current submission.
- FE guidance validates file size and case-insensitive extension (`.pdf`, `.jpg`, `.jpeg`, `.png`). It must accept an empty browser MIME for an otherwise valid extension. BE remains authoritative for MIME/content/signature validation.
- Keep selected files and entered fields after a recoverable error.
- Disable the submit button while a request is active to prevent duplicate submission.

## Feedback and state synchronization

| Outcome | Behavior |
| --- | --- |
| Client validation | Inline errors; no request |
| `200` / MSG162 | Show success, refresh application and authentication/session context, then render Pending Review |
| `400` / MSG01, MSG157, MSG158 | Map structured field/file errors to safe copy |
| `401` | Redirect to sign-in with encoded return URL |
| `403` | Safe access-denied view |
| `404` | Application-not-found view |
| `409` / MSG159 | Preserve form and show identifier conflict |
| `409` / MSG161 | Refresh application state and return to status page |
| `503` / MSG127 or network error | Safe retry message; preserve form |

After success, both `User.Status` and `approvalStatus` are `PendingApproval`. The FE must invalidate/refetch its auth/session cache as well as application data so route guards do not retain stale `Rejected` state.

## Acceptance criteria

1. The canonical routes above work with keyboard navigation and responsive layouts.
2. All application network traffic uses the HttpOnly-cookie BFF; no browser-accessible token or direct backend URL is introduced.
3. Rejection reason and review timestamp come from the real API; no mock status remains.
4. Only a rejected application exposes the Resubmit action, while the backend remains authoritative against bookmarked/stale pages.
5. Client validation uses normalized values and UC-02 tax/licence/phone rules; Vietnamese/Unicode company, contact, and address text is preserved.
6. Empty MIME from a browser does not block a valid extension; size/extension feedback is provided before submit.
7. Success refreshes both application and session context and ends at Pending Review with MSG162.
8. Error mappings cover `400`, `401`, `403`, `404`, both `409` cases, `503`, abort, and network failure without leaking upstream details.
9. Tests cover proxy credentials/signal/multipart forwarding, route guards, validation boundaries, double submit, state refresh, and every feedback path.

## Non-goals

Creating another account, changing Firebase/email verification, direct Cloudinary upload, changing UC-02 registration, implementing Admin approval/rejection, or implementing the missing Admin review-list endpoint.


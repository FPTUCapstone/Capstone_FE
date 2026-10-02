# UC-51 FE Specification — Reject Tour Operator Application

## Scope

UC-51 lets an authenticated Administrator reject a Tour Operator application while it is in `PendingApproval`. A rejection requires a recorded reason, changes the application to `Rejected`, leaves the applicant without active Tour Operator access, and exposes the reason for correction and resubmission through UC-03.

The screen is shared with UC-50 at:

- `/admin/tour-operator-applications/[userId]`

## Source decision

The SRS message catalog defines these UC-51 strings:

- MSG115: `Please enter specific rejection reason to send to applicant:`
- MSG116: `Application rejected. Notification sent to operator.`

The detailed UC-51 validation table references MSG123 and MSG125, but the same catalog assigns those identifiers to unrelated review-length and expired-session messages. This FE therefore uses the locked catalog text of MSG115 and MSG116 and records the detailed-section references as an SRS inconsistency requiring later document correction. Message identifiers are not displayed to users.

## Business rules

- Only an authenticated Administrator may submit the decision.
- Only a `PendingApproval` application may be rejected.
- The rejection reason is required, trimmed before submission, and limited to 500 characters to match the existing `OperatorProfiles.rejection_reason` database constraint.
- No success may be shown until the server accepts the rejection.
- The server remains authoritative after success: the FE reloads the application detail instead of fabricating the final reviewer, timestamp, document states, or rejection reason.
- The reason is visible to the applicant so UC-03 resubmission can address it.
- The decision, reviewer, timestamp, audit record, and notification behavior are backend responsibilities.

The SRS mentions predefined reasons, but no approved reason catalog exists in the current contract. The implemented free-text path satisfies the “selects or enters” flow. Adding a selector requires a separately approved category list.

## API boundary

The browser calls the same-origin route:

- `POST /api/admin/tour-operator-applications/{userId}/reject`
- JSON body: `{ "reason": string }`

The Next.js server proxy reads the HttpOnly Administrator session cookie and forwards to:

- `POST /api/v1/admin/tour-operator-applications/{userId}/reject`

The browser never receives or constructs a bearer token and never calls a hardcoded backend URL.

The proxy rejects:

- missing Administrator session with `401`;
- cross-origin mutations with `403`;
- non-JSON content with `415`;
- malformed JSON with `400`;
- blank or over-500-character reasons with `422`;
- backend/server failures with safe product-facing `503` responses.

## UI behavior

1. Reject is available only for a pending application.
2. Activating Reject opens a labelled modal titled “Reject Tour Operator Application”.
3. The textarea is associated with the MSG115 label and displays inline validation.
4. Cancel, backdrop click, or Escape closes the idle dialog and discards the entered reason.
5. During submission, controls are disabled and the dialog cannot be dismissed.
6. On API success, the modal closes, MSG116 is announced through a success live region, and application detail is reloaded.
7. After reload, the Rejected status and reason are shown and decision buttons disappear.
8. If the refetch fails after a committed rejection, the error panel provides Retry rather than claiming a fabricated local state.

## Accessibility

The dialog provides `role="dialog"`, `aria-modal="true"`, an accessible title, initial textarea focus, Tab/Shift+Tab trapping, Escape-to-close while idle, focus restoration, a programmatically associated label, and `role="alert"` for inline errors.

## Acceptance criteria

- Whitespace-only and over-limit reasons never call the API.
- Valid reasons are trimmed and forwarded once.
- Cross-origin, unauthenticated, malformed, blank, and oversized proxy requests are rejected.
- The success message appears only after a successful response.
- Successful rejection triggers an authoritative detail refetch and removes stale actions after the server reports `Rejected`.
- Dialog accessibility and safe error-copy regression tests pass.

## Dependency

The implemented Backend contract is pending merge in
[`Capstone_BE#33`](https://github.com/FPTUCapstone/Capstone_BE/pull/33), owned by
**@sekiro171**. Until that PR reaches `develop`, the deployed reject handler may
still be the stub and the FE proxy will safely surface its 5xx response as 503.

`Capstone_BE#33` must merge before `Capstone_FE#15`. After the merged Backend is
available, the final FE head must complete an Admin FE → BE → SQL Server smoke
test proving the rejected state reload plus one audit and one notification. No
exception allowing FE-first merge has been recorded or claimed.

# UC-50 FE Specification — Approve Tour Operator Application

## Scope decision

UC-50 lets an authenticated Administrator inspect one Tour Operator application and approve it. The screen also exposes the reject action that follows the UC-51 contract.

The project team clarified the application requirements as follows:

- `taxCode` is a required business data value entered as text/number data and shown to the Administrator for review.
- A Tax Code file or certificate upload is not required by this screen.
- `BusinessLicense` is the only mandatory uploaded document for approval.
- The Approve action is disabled when no non-rejected `BusinessLicense` document exists.

This decision resolves the earlier FE wording that incorrectly treated both `TaxCode` and `BusinessLicense` as mandatory uploaded files.

## Route and access

- Page: `/admin/tour-operator-applications/[userId]`
- `userId` must be a canonical positive base-10 integer within JavaScript's safe-integer range. Partial numbers, decimals, scientific notation, leading-zero aliases, and unsafe integers render `Invalid Application ID` and are rejected by the proxy without contacting the backend.
- The page is available only through the Administrator session flow.
- The browser calls same-origin Next.js routes. The server proxy reads the HttpOnly Administrator cookie and forwards the request to the backend.
- The UI must not expose bearer tokens, internal service URLs, or localhost topology.

## Data shown

The detail response includes Operator identity and application status; company name, Tax Code, Business License number, phone, and business address; submitted documents and their statuses; reviewer, reviewed time, and rejection reason when present.

`TaxCode` may remain in the document type union for backward-compatible backend records, but its absence never blocks UC-50 approval. Only `BusinessLicense` is checked as the mandatory document.

## API contract

The FE uses these same-origin routes:

- `GET /api/admin/tour-operator-applications/{userId}` — load the application;
- `POST /api/admin/tour-operator-applications/{userId}/approve` — approve the application;
- `POST /api/admin/tour-operator-applications/{userId}/reject` with `{ "reason": string }` — reject according to the UC-51 contract.

The proxy forwards them to the corresponding `/api/v1/admin/tour-operator-applications/...` backend endpoints and clears an invalid Administrator session on an unauthorized response.

There is no preview or mock fallback. A failed request produces product-facing error copy and never displays an internal URL.

## Screen behavior

1. The header links back to the existing `/admin` route and shows the current application status.
2. The company panel displays Tax Code as a value and does not request a Tax Code file.
3. The document panel displays submitted files and warns only when `BusinessLicense` is missing or rejected.
4. Approve and Reject actions appear only while the application is pending.
5. Approval requires a usable `BusinessLicense`, opens an accessible confirmation dialog, and updates the page to the approved state after success.
6. Rejection requires a reason, calls the reject endpoint, then reloads the authoritative detail so status, rejection reason, documents, and available actions cannot remain stale.
7. Success feedback is announced with `role="status"` and `aria-live="polite"`. User-facing copy does not expose message-catalog identifiers.
8. Decision dialogs provide an accessible name, `role="dialog"`, `aria-modal="true"`, initial focus, a focus trap, Escape-to-close while idle, and focus return to the trigger.
9. The rejection label is associated with its textarea.

## Error behavior

- `401`: the invalid Administrator session is cleared and the request is reported as unauthorized.
- `403`: access is denied.
- `404`: application not found.
- Other HTTP or network failures: generic retry-oriented product copy without deployment details.

## Acceptance criteria

- Tax Code appears as application data; the UI never requires a Tax Code upload.
- Approval is blocked only when a valid `BusinessLicense` upload is absent.
- The back link resolves to `/admin`.
- Approve and Reject dialogs meet the keyboard and accessible-name behavior above.
- A successful rejection reloads detail and removes decision actions when the returned status is no longer pending.
- Tests cover the route, Business License guard, safe error text, rejection refresh, textarea label, dialog keyboard behavior, focus trap, and focus restoration.
- Tests cover strict application-ID parsing at both the page boundary and the server proxy boundary.

## Dependencies and limitations

- Reject processing is owned by UC-51. The FE implements its expected success contract, while the current backend may return an error until UC-51 is completed.
- A list/inbound navigation screen for Tour Operator applications is outside this change; until that route is delivered, the detail URL must be opened from an existing admin entry point or directly.
- Email notification delivery is not claimed by UC-50 FE. It may be added as a separate business feature.

# UC-68 Submit Post-Trip Complaint Frontend Specification

**Platform:** Next.js / React responsive Web

**Status:** Approved FE contract; awaiting the approved BE read-context endpoint

**Sources:** SRS rev10.5, §2.2.2 UC-68 and §3.8.6.1; BR-147, BR-148, BR-149, BR-151; MSG127, MSG157–MSG161; Backend UC-68 submit contract and the approved read-context contract.

## 1. Scope and boundaries

An authenticated Traveler submits one post-trip complaint for their own eligible booking. The Web application provides the Complaint Form (SRS screen #95), a server-authoritative eligibility/context read, a read-only view of an existing complaint, client-side usability validation, accessible file selection, and the multipart request to the UC-68 backend.

The feature begins from **Submit Complaint** on the Traveler booking detail after the tour has ended. A successful submission ends with a recorded complaint in `AwaitingOperatorResponse`; the Tour Operator response is UC-69, and a Traveler response to a partial proposal is UC-75.

This scope does not calculate or display a proposed refund, create a refund, expose private evidence bytes or delivery URLs, implement a complaint list, or implement an Operator, Staff, or Admin action. It must not use demo fixtures or browser-only persistence for a live complaint.

## 2. Eligibility and entry

### 2.1 Entry point

Add **Submit Complaint** to the authenticated Traveler's booking-detail action area. It leads to:

```text
/bookings/[bookingId]/complaint
```

`bookingId` is the server booking identifier, not a booking code or ticket number. The page supports direct navigation and refresh. It renders exactly one server-derived state: the Form, a read-only Existing Complaint Detail, or an Ineligible/Closed outcome.

### 2.2 Server-authoritative context read

Before rendering an action state, the route obtains this authenticated BFF resource:

```http
GET /api/v1/traveler/bookings/{bookingId}/post-trip-complaint
```

The proxy forwards it to the BE counterpart. The response supplies `bookingId`, `endAtUtc`, `submissionDeadlineUtc`, `canSubmit`, nullable `ineligibilityReason`, and nullable `complaint`. When `complaint` is present, it includes the server-issued complaint ID, status, category, detail, submitted time, response deadline, and safe evidence metadata only (`fileName`, `contentType`, `sizeBytes`); it never includes a storage key or downloadable URL.

The entry action may be displayed only when this resource indicates that the signed-in Traveler owns the booking, its status is `Confirmed` or `Completed`, the tour has ended, `canSubmit` is true, and `complaint` is null. The Web app must not infer eligibility from stale booking data.

The backend makes the final decision on the read and every submit: `EndAtUtc <= now <= EndAtUtc + 3 calendar days`. A stale page, timezone, changed booking state, or expired window must therefore be handled from the API response without mutation in the UI. The three days in BR-147 are calendar days; the Web app must not apply a working-day calendar.

If `canSubmit` is false because the window is closed, show MSG157 and do not render the form. If `complaint` is present, show MSG158 and its read-only detail instead of a second form. A `401`, `403`, or `404` follows the existing session/role-safe error pattern and never reveals another Traveler's complaint or booking.

### 2.3 Cancel navigation

**Cancel** returns to the booking detail that initiated the route without creating a request. Direct navigation uses the approved Traveler booking-list/detail fallback; it must not use `router.back()` because browser history can leave TripMate. Cancel never deletes a saved complaint or clears server data.

## 3. Complaint form

### 3.1 Fields

The page presents the booking reference and tour/end-date context followed by a form containing:

| Field | Required | Web behaviour | API value |
| --- | --- | --- | --- |
| Reason category | Yes | Select with all six approved labels | `reasonCategory` |
| Reason detail | Yes | Trim before submit; counter and inline validation; maximum 2,000 characters | `reasonDetail` |
| Evidence files | No | Multi-file picker plus removable selected-file list | repeated `evidence` parts |

The category list and logical enum mapping are fixed by the current BE contract:

| Display label | Submitted enum |
| --- | --- |
| Itinerary not as advertised | `ItineraryNotAsAdvertised` |
| Service quality | `ServiceQuality` |
| Guide or staff conduct | `GuideOrStaffConduct` |
| Safety issue | `SafetyIssue` |
| Schedule change/delay | `ScheduleChangeOrDelay` |
| Other | `Other` |

The browser accepts only JPG/JPEG, PNG, WebP, and PDF selections. It accepts no more than five files, each no larger than 10 MB, with a total selected size no larger than 30 MB. The selected-files list shows a safe file name, readable size, and a remove control. Client checks improve feedback only: the backend remains authoritative and validates the file content rather than trusting the MIME type or extension.

No form field accepts a complaint status, response deadline, storage key/URL, refund amount, payment value, booking owner, or Tour Operator value.

### 3.2 Interaction and accessibility

The submit action is disabled while the request is active and announces its progress through an `aria-live` status region. Category, detail, file-input, per-file remove actions, inline errors, and submit/cancel controls are keyboard accessible, have visible focus, and retain an accessible label. File selection supports a 44px minimum touch target and does not rely on colour alone for an error state.

The form is a responsive single-column flow on narrow screens and uses the established traveler/checkout visual language and shared form controls. It must preserve entered text and valid selected files after client validation failures or a recoverable API error. It clears the local form only after a successful response.

## 4. API integration

### 4.1 Next.js BFF boundary

The browser never calls the backend origin directly. It calls the same-origin singular `GET /api/v1/traveler/bookings/{bookingId}/post-trip-complaint` context route and plural `POST /api/v1/traveler/bookings/{bookingId}/post-trip-complaints` submit route. Each BFF handler obtains the authenticated server-side session token, forwards the exact backend path and `Idempotency-Key` where applicable, and streams the multipart request without logging body content. The BFF supplies no browser-visible credential or storage configuration.

### 4.2 Submit

The browser calls the existing authenticated API/proxy path:

```http
POST /api/v1/traveler/bookings/{bookingId}/post-trip-complaints
Idempotency-Key: <UUID>
Content-Type: multipart/form-data
```

Use `FormData`; do not manually set `Content-Type`, because the browser supplies the multipart boundary. Append the exact keys `reasonCategory`, `reasonDetail`, and one `evidence` part for each selected file.

The client creates one UUID for a logical submission and retains it for a transport retry of the unchanged form. It must generate a new UUID if the Traveler changes category, detail, or files after a failed submit, so an intentional changed request cannot conflict with the server's payload fingerprint.

The success payload is treated as server-issued:

```ts
interface SubmitPostTripComplaintResponse {
  complaintId: number;
  bookingId: number;
  status: "AwaitingOperatorResponse";
  submittedAtUtc: string;
  responseDeadlineUtc: string;
  isReplay: boolean;
}
```

Both `201 Created` and `200 OK` are successful. `200` with `isReplay: true` means the original complaint is returned; it must not be represented as a second complaint. The UI refreshes the context resource and renders its read-only detail, including the server-derived deadline. It never recomputes a refund amount or deadline.

## 5. Messages and failure handling

| Condition | Required UI outcome |
| --- | --- |
| Window closed / `complaint.window_closed` | MSG157: “The complaint window has closed. Complaints must be submitted within 3 days after the tour ends.” Keep no success state. |
| Existing complaint / replay | MSG158: explain that only one complaint is allowed. Render the returned/refreshed read-only complaint detail; do not offer a second submit. |
| Client or server evidence limit / `complaint.evidence_limit` | MSG159: reject only the newly selected file when possible; retain valid selections. |
| Client or server unsupported evidence / `complaint.evidence_type` | MSG160: do not add the invalid file; retain valid selections. |
| Successful fresh submission | MSG161 through the shared locale catalogue. Refresh and show the server response details. |
| Storage/service unavailable / `complaint.storage_unavailable`, network failure | MSG127: complaint was not recorded; preserve form data and let the Traveler retry. |
| Same key with changed payload / `complaint.idempotency_key_payload_mismatch` | Tell the Traveler the request changed and issue a new key only after explicit retry of the current form. |
| Validation, unauthorized, forbidden, not found, or unknown error | Map the RFC-7807/error code through the existing API error mapper; use a role-safe actionable message, never raw server error text. |

All displayed message text comes from the shared localized message catalogue keyed by the backend error code and MSG identifier. Components must not hard-code English business messages.

## 6. Privacy and security

- Send files only over the authenticated multipart request and never log `FormData`, file bytes, object identifiers, or private URLs in browser telemetry or console output.
- Render selected names as text, never as HTML. Do not preview PDFs or images from object storage in this UC.
- Do not put credentials, backend origin secrets, or storage configuration in `NEXT_PUBLIC_*` variables.
- Treat booking identity, status, deadline, and response values as untrusted API data until parsed at the feature service boundary.

## 7. Proposed module boundary

```text
app/bookings/[id]/complaint/page.tsx                  route composition and metadata
app/api/v1/traveler/bookings/[bookingId]/post-trip-complaint/route.ts   BFF GET context
app/api/v1/traveler/bookings/[bookingId]/post-trip-complaints/route.ts  BFF POST submit
src/features/complaints/submit/components/            form, selected evidence, existing-detail and outcome states
src/features/complaints/submit/services/              typed context/multipart clients and error mapping
src/features/complaints/submit/types/                 request/response and category types
src/features/complaints/submit/schemas/               client UX validation
```

Use the current authenticated client/proxy convention and existing shared form, feedback, and navigation components. The interactive form is the narrow client boundary; route composition remains a Server Component unless existing authentication/data patterns require otherwise.

## 8. Acceptance criteria

1. The server context read renders a Form only for an eligible own booking, MSG157 without a Form for a closed window, and MSG158 read-only detail for an existing complaint.
2. The form requires an approved category and non-blank detail of at most 2,000 characters.
3. The form accepts up to five optional JPG/JPEG, PNG, WebP, or PDF files, enforces 10 MB per file and 30 MB total client-side, and preserves valid selections after a rejected addition.
4. The request is one multipart POST with the exact field names, authenticated session, and a UUID `Idempotency-Key`; it sends neither manually calculated financial data nor private-storage data.
5. The BFF forwards the authenticated GET/POST contract and `Idempotency-Key` without exposing a bearer token, storage key, or storage URL to the browser.
6. The UI handles fresh `201` and identical `200` replays without duplicate success records, then refreshes and displays only server-issued complaint status and deadline.
7. MSG127 and MSG157–MSG161 are obtained through the shared localized catalogue; recoverable failures preserve the user's valid form data and do not misrepresent a failed submission as recorded.
8. Cancel returns through an approved TripMate booking route without making a request; direct navigation has a safe Traveler fallback.
9. Automated tests cover context states, field/file boundaries, FormData/header construction, BFF forwarding, idempotent retry and changed-payload behaviour, success/replay, error mappings, keyboard interaction, Cancel, and narrow/mobile layouts.

## 9. Dependencies and explicit deferrals

- This specification depends on the BE UC-68 submit endpoint and the approved `GET /api/v1/traveler/bookings/{bookingId}/post-trip-complaint` read-context/detail endpoint.
- The reason-category list is the approved six-value BE contract. It must be recorded as the resolved version of the SRS "to be defined" list before release.
- UC-69, UC-75, refund initiation/confirmation, evidence download through signed links, and notifications UI are separate approved scopes and are not implementation work for this FE spec.

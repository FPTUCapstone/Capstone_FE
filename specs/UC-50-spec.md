# UC-50 Approve Tour Operator Application Frontend Spec

## Status

Ready for Implementation / Reference

## Scope

This specification defines the Next.js Frontend implementation for **UC-50: Approve Tour Operator Application**.

It covers:
- Route: `/admin/tours/reviews/[id]` (or Tour Operator detail review view).
- Fetching Tour Operator application detail via `GET /api/v1/admin/tour-operator-applications/{userId}`.
- Presenting business/legal information: Company Name, Tax Code (from profile), Contact Phone, Contact Address, and uploaded Business License document (`OperatorDocumentType.BusinessLicense`).
- Providing the "Approve" action button.
- Submitting approval request via `POST /api/v1/admin/tour-operator-applications/{userId}/approve`.
- Displaying success toast `MSG114` (`"Tour Operator \"{Company_Name}\" approved. Account activated."`).
- Updating UI state to `Active` / `Approved` and disabling approval controls once approved.
- Handling error responses (`401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`).

---

## Actor

- **Administrator**

---

## Preconditions

1. Administrator is authenticated.
2. Target user application exists and is in `PendingApproval` status.

---

## Component Architecture

```text
src/features/admin/tour-operator-applications/
├── components/
│   ├── ApplicationDetailView.tsx        <-- Main Review Detail Component
│   ├── DocumentViewer.tsx               <-- Business License Document Preview
│   └── StatusBadge.tsx                  <-- Status Pill Component
├── services/
│   └── tourOperatorAdminService.ts      <-- API client (getDetail, approve)
└── types/
    └── tourOperatorAdmin.ts             <-- Data transfer interfaces
```

---

## API Contract Integration

### 1. Detail Endpoint
```http
GET /api/v1/admin/tour-operator-applications/{userId}
Authorization: Bearer <Admin_JWT>
```

### 2. Approve Endpoint
```http
POST /api/v1/admin/tour-operator-applications/{userId}/approve
Authorization: Bearer <Admin_JWT>
```

### Success Response (`200 OK`)

```json
{
  "userId": 123,
  "accountStatus": "Active",
  "applicationStatus": "Approved",
  "reviewedBy": 1,
  "reviewedAt": "2026-09-10T20:30:00Z",
  "message": "Tour Operator \"Viet Travel Co\" approved. Account activated."
}
```

---

## UI Specs & Flow

1. **Review Detail View:**
   - Displays applicant header: Company Name, Email, Phone Number, Submission Date.
   - Status Badge: `PendingApproval` (warning yellow tone).
   - Document Section: Displays uploaded `BusinessLicense` document with preview link.
   - Action Bar: "Approve Application" (primary green button), "Reject Application" (danger red button).

2. **Approve Action Flow:**
   - Clicking "Approve Application" prompts a confirmation dialog.
   - Confirmed: Disables button, shows loading spinner, calls `approveApplication(userId)`.
   - On Success: Displays Toast `MSG114` (`"Tour Operator \"{Company_Name}\" approved. Account activated."`), updates Status Badge to `Approved` / `Active` (success green tone), and disables action buttons.

3. **Error Handling:**
   - `409 Conflict`: Toast error `"The application was modified concurrently by another administrator."`
   - `422 Unprocessable Entity`: Toast error `"Application contains invalid or incomplete business license document."`

---

## Acceptance Criteria

1. Administrator can view complete Tour Operator profile and uploaded business license.
2. Clicking "Approve" invokes backend approval endpoint.
3. On success, `MSG114` toast is displayed and UI transitions to `Approved` / `Active`.
4. Buttons are disabled once application is no longer `PendingApproval`.

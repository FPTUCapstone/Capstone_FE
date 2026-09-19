# UC-51 Reject Tour Operator Application Frontend Spec

## Status

Ready for Implementation / Reference

## Scope

This specification defines the Next.js Frontend implementation for **UC-51: Reject Tour Operator Application**.

It covers:
- The rejection modal prompt (`MSG115`) displayed when an Administrator clicks the "Reject" button on a Tour Operator application review detail screen.
- Form validation ensuring the rejection reason is non-empty, non-whitespace, and maximum 1000 characters.
- Invoking the backend API endpoint `POST /api/v1/admin/tour-operator-applications/{userId}/reject`.
- Handling success response (`200 OK`) by displaying toast message `MSG116` ("Application rejected. Notification sent to operator."), updating UI state to `Rejected`, and closing the modal.
- Handling error responses (`403 Forbidden`, `409 Conflict`, `422 Unprocessable Entity`) with appropriate toast error messages.

---

## Actor

- **Administrator**

---

## Component Architecture

```text
src/features/admin/tour-operator-applications/
├── components/
│   ├── ApplicationDetailView.tsx
│   ├── RejectModal.tsx               <-- UC-51 Rejection Modal Component
│   └── StatusBadge.tsx
├── services/
│   └── tourOperatorAdminService.ts   <-- API integration (rejectApplication)
└── types/
    └── tourOperatorAdmin.ts
```

---

## API Contract Integration

### Endpoint
```http
POST /api/v1/admin/tour-operator-applications/{userId}/reject
Content-Type: application/json
Authorization: Bearer <Admin_JWT>
```

### Request Body
```json
{
  "reason": "The submitted business license could not be verified."
}
```

### Success Response (`200 OK`)
```json
{
  "userId": 123,
  "accountStatus": "Rejected",
  "applicationStatus": "Rejected",
  "rejectionReason": "The submitted business license could not be verified.",
  "reviewedBy": 1,
  "reviewedAt": "2026-09-10T20:38:00Z",
  "message": "Application rejected. Notification sent to operator."
}
```

---

## UI Specs & Flow

1. **Trigger:** On the Application Detail screen, Administrator clicks "Reject Application".
2. **Modal Prompt (`MSG115`):**
   - Modal Title: "Reject Tour Operator Application"
   - Input Label (`MSG115`): `"Please enter specific rejection reason to send to applicant:"`
   - Textarea placeholder: "Enter reason for rejection..." (maxLength 1000).
   - Actions: "Cancel" (closes modal), "Submit Rejection" (primary danger button).
3. **Client-Side Validation:**
   - Empty or whitespace-only -> displays inline error: `"Rejection reason is required."`
   - Exceeds 1000 characters -> displays inline error: `"Rejection reason cannot exceed 1000 characters."`
4. **API Integration:**
   - Calls `POST /api/v1/admin/tour-operator-applications/{userId}/reject` with `{ reason }`.
   - Disables submit button and shows loading spinner during request.
5. **Success Handling:**
   - Shows success toast `MSG116`: `"Application rejected. Notification sent to operator."`
   - Closes modal.
   - Refreshes application detail state (status badge changes to `Rejected`).

---

## Acceptance Criteria

1. Clicking "Reject" opens the rejection modal with label `MSG115`.
2. Submitting without a reason shows validation error without sending API request.
3. Submitting a valid reason sends request to backend and displays `MSG116` toast on success.
4. UI status updates to `Rejected` and action buttons are disabled.

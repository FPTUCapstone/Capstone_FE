# UC-50 Approve Tour Operator Application — Web Frontend Specification

## Status

Ready for implementation planning — all frontend requirements and API contracts aligned.

## Overview & Scope

This specification defines the Administrator Web UI for reviewing, verifying, and approving a pending Tour Operator application in the `tripmate-web` App Router console.

### Included Scope:
- Single Tour Operator Application detail view by `userId`.
- Display of Operator company legal metadata (Company Name, Tax Code, Business License Number, Contact Phone, Contact Address).
- Display and preview of submitted mandatory documents (`BusinessLicense` and `TaxCode`).
- Primary **Approve Application** action with confirmation modal, API submission, and success Toast notification (`MSG114`).
- Primary **Reject Application** action modal (UI stub displaying UC-51 dependency notice and `MSG116`).
- Loading skeletons, authorization checks, and error feedback handling (401, 403, 404, 409, 422).

### Excluded Scope:
- Tour Operator Application list/table filtering & search (addressed by a separate application list feature).
- Full rejection business logic processing (owned by UC-51).

---

## Target Route & Layout Composition

- **Route**: `/admin/tour-operator-applications/[userId]`
- **App Router File**: `app/admin/(console)/tour-operator-applications/[userId]/page.tsx`
- **Feature Module**: `src/features/admin/tour-operator-applications/`

---

## API Contract Integration

### 1. Fetch Detail
- **HTTP**: `GET /api/v1/admin/tour-operator-applications/{userId}`
- **Headers**: `Authorization: Bearer <token>`
- **Response DTO (`TourOperatorApplicationDetailDto`)**:
  ```ts
  interface OperatorDocumentDto {
    documentId: number;
    documentType: 'BusinessLicense' | 'TaxCode' | 'Other';
    fileUrl: string;
    status: 'Submitted' | 'Approved' | 'Rejected';
    uploadedAt: string;
  }

  interface TourOperatorApplicationDetailDto {
    userId: number;
    role: string;
    accountStatus: string;
    applicationStatus: 'PendingApproval' | 'Approved' | 'Rejected';
    companyName: string;
    taxCode: string;
    businessLicenseNumber: string;
    contactPhone?: string;
    contactAddress?: string;
    documents: OperatorDocumentDto[];
    reviewedBy?: number | null;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
  }
  ```

### 2. Approve Action
- **HTTP**: `POST /api/v1/admin/tour-operator-applications/{userId}/approve`
- **Headers**: `Authorization: Bearer <token>`
- **Response DTO (`ApproveOperatorApplicationResponseDto`)**:
  ```ts
  interface ApproveOperatorApplicationResponseDto {
    userId: number;
    accountStatus: string;
    applicationStatus: string;
    reviewedBy: number;
    reviewedAt: string;
    message: string;
  }
  ```

### 3. Reject Action Stub
- **HTTP**: `POST /api/v1/admin/tour-operator-applications/{userId}/reject`
- **Payload**: `{ reason: string }`

---

## User Interface & Design System

1. **Header & Action Bar**:
   - Back button to Admin Console (`text-teal-700 hover:text-teal-900 font-bold`).
   - Application title (`Company Name`) & User ID badge in high-contrast dark navy (`text-slate-900 font-extrabold`).
   - Status Badges:
     - `PendingApproval`: Warning Amber badge.
     - `Approved`: Teal / Emerald active badge.
     - `Rejected`: Danger Rose badge.
   - Actions (visible when status is `PendingApproval`):
     - **Approve Application**: Solid emerald primary button (`bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md`).
     - **Reject Application**: High-contrast rose outline button (`border-2 border-rose-300 bg-white text-rose-700 hover:bg-rose-50 font-bold`).

2. **Company Information Card (High-Contrast Clean White Admin UI)**:
   - Card container wrapped with distinct double border `border-2 border-slate-300 bg-white rounded-2xl p-6 shadow-sm mb-6`.
   - Grid layout with individual field border containers (`border border-slate-200 bg-slate-50/70 p-4 rounded-xl`):
     - Company Name (Bold Heading `text-slate-900 font-extrabold`)
     - Tax Code (`taxCode`) with teal highlight badge (`bg-teal-50 text-teal-800 border border-teal-300 font-mono font-bold`)
     - Business License No (`businessLicenseNumber`) with teal highlight badge (`bg-teal-50 text-teal-800 border border-teal-300 font-mono font-bold`)
     - Phone & Address field boxes
     - Reviewer Info container (Reviewed By Admin ID & Timestamp UTC)

3. **Mandatory Legal Documents Section**:
   - Card container with `border-2 border-slate-300 bg-white rounded-2xl p-6 shadow-sm`.
   - Individual document cards with `border-2 border-slate-200 bg-slate-50 p-5 rounded-xl hover:border-teal-500 hover:bg-white hover:shadow-md transition-all`.
   - Displays document status pill (`Submitted`, `Approved`, `Rejected`).
   - Action: "View File ↗" link opening file URL in new tab.
   - Highlight warning banner with `border-2 border-amber-300 bg-amber-50 p-4 rounded-xl text-amber-950` if any mandatory document (`BusinessLicense` or `TaxCode`) is missing or rejected.

4. **Approve Confirmation Modal**:
   - Dialog container with `bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 text-slate-900`.
   - Dialog prompt: "Confirm Application Approval for {CompanyName}?".
   - Details: Explains that `Users.status` will become `Active` and account will be enabled.
   - Confirm button with loading spinner state (`bg-emerald-600 hover:bg-emerald-700 text-white font-bold`).
   - On Success: Toast notification with `MSG114`: `Tour Operator "{Company_Name}" approved. Account activated.`, UI updates state immediately to `Approved`.

5. **Reject Reason Modal (UI Stub)**:
   - Dialog container with `bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 text-slate-900`.
   - Dialog prompt: "Reject Application for {CompanyName}".
   - Reason textarea input (`rejectionReason`).
   - Displays notice: `UC-51 Rejection logic dependency`.
   - Confirm button with Toast notification (`MSG116`).

6. **Development Sample Preview Mode**:
   - Automatic fallback sample data for user IDs `#2` (complete valid application) and `#3` (missing TaxCode application) when running without an active backend authentication session.

---

## Acceptance Criteria

1. Administrator navigating to `/admin/tour-operator-applications/[userId]` sees full legal detail of the application.
2. Sensitive credentials (password hash, tokens) are never displayed.
3. Badges accurately reflect `PendingApproval`, `Approved`, or `Rejected` state.
4. Clicking "Approve Application" opens the confirmation modal.
5. Approving submits API `POST /approve` and shows Toast success `MSG114`.
6. Successful approval instantly updates UI state to `Approved` without requiring page refresh.
7. Validation warning is shown if `BusinessLicense` or `TaxCode` document is missing or rejected.
8. Non-Admin user / Unauthenticated caller receives redirect or 401/403 Error boundary.
9. Loading skeleton displays while API detail request is pending.
10. Code compiles cleanly with zero TypeScript errors (`npm run typecheck`) and zero ESLint errors (`npm run lint`).

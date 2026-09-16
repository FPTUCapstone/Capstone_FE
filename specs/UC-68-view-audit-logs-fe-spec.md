# UC-68 View Audit Logs Frontend Spec

## Status

Ready for Implementation Planning (Screen #33 System Audit Logs List)

## Scope

This specification defines the Next.js Frontend implementation for **UC-68: View Audit Logs** (Screen #33 System Audit Logs List).

It covers:
- Route: `/admin/audit-logs` (app Router path: `app/admin/(console)/audit-logs/page.tsx`).
- Navigation link added to `AdminNavigation.tsx` and `ROUTES.admin.auditLogs`.
- Read-only table listing audit log entries with fixed column widths (`table-fixed` layout): Event Timestamp (`createdAtLocal`), Event Type (`actionType`), Actor Email/Name (`actorEmail` / `actorFullName`), Actor Role (`actorRole`), Affected Module/Entity (`affectedEntity`), Affected Entity ID (`affectedEntityId`), IP Address (`ipAddress`), and `Actions` (icon button for UC-69 View Detail integration).
- Search and filter bar supporting:
  - Keyword search (`keyword`) with partial string matching across Email, FullName, ActionType, AffectedEntity, and AffectedEntityId — applied **on submit** (Apply Filters button / Enter key), not on each keystroke (CR-02, SRS §3.9.12.1 BR-52).
  - Event Type / Action Type select filter (`actionType`) — options mirror `TripMate.Domain.Common.AuditActionTypes`.
  - Actor Role select filter (`actorRole`)
  - Affected Entity select filter (`affectedEntity`) — options mirror `TripMate.Domain.Common.AuditEntityTypes`.
  - Event Date range filter (`fromDateUtc`, `toDateUtc`) with `max=Today` (local calendar date) business constraint, `From Date <= To Date` bounds, click-to-open calendar picker (`showPicker()`), and local start-of-day/end-of-day UTC ISO conversion.
  - Reset filters button
- Pagination control supporting page navigation and items per page selection, with a default page size of **20** (CR-01).
- Empty state (`MSG128`: "No records found matching your criteria."), Loading state, and Error handling state (`MSG127` / `MSG126`, locked SRS 5.3 content).
- On `401` (expired/missing session): redirect to `/admin/login?returnUrl=/admin/audit-logs` preserving the intended destination (CR-10).
- Date/Time display compliant with CR-07 (`Asia/Ho_Chi_Minh` UTC+7 formatted as `dd/MM/yyyy HH:mm:ss`).

> [!NOTE]
> - **UC-69 Scope Separation:** Deep detail modal/panel (`BeforeData`, `AfterData`) is owned by **UC-69** (Screen #34). UC-68 provides the `Actions` column with the View Detail icon button (`visibility`).
> - **UC-67 Scope Separation:** Exporting audit logs / report generation is owned by **UC-67**.

---

## Actor

- **Administrator**

---

## Component Architecture

```text
app/admin/(console)/audit-logs/
└── page.tsx                              <-- Route page component

src/
├── features/admin/audit-logs/
│   ├── components/
│   │   ├── AuditLogManagementView.tsx    <-- Main Container View
│   │   ├── AuditLogFilterBar.tsx         <-- Search & Filter Controls (with date picker bounds & showPicker)
│   │   ├── AuditLogTable.tsx             <-- Table Presentation (table-fixed layout & Actions column)
│   │   └── AuditLogPagination.tsx        <-- Pagination Controls
│   ├── services/
│   │   └── auditLogAdminService.ts       <-- Fetch API client (reuses the shared API base URL resolver from `@/lib/authApi`)
│   └── types/
│       └── auditLogAdmin.ts              <-- TypeScript interfaces & DTOs
├── components/navigation/
│   └── AdminNavigation.tsx               <-- Added "Audit Logs" menu link
└── lib/
    └── routes.ts                         <-- Added `ROUTES.admin.auditLogs`
```

---

## API Contract Integration

### Endpoint
```http
GET /api/v1/admin/audit-logs?keyword={keyword}&actionType={actionType}&actorRole={actorRole}&affectedEntity={affectedEntity}&fromDateUtc={fromDateUtc}&toDateUtc={toDateUtc}&pageNumber={pageNumber}&pageSize={pageSize}
Authorization: Bearer <Admin_JWT>
```

### TypeScript Data Models

```typescript
export type UserRole = 'Traveler' | 'TourOperator' | 'Administrator';

export interface AuditLogSummaryDto {
  id: number;
  actionType: string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorFullName: string;
  actorRole: UserRole | null;
  affectedEntity: string;
  affectedEntityId: number | null;
  ipAddress: string | null;
  createdAtUtc: string;
  createdAtLocal: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GetAuditLogsParams {
  keyword?: string;
  actionType?: string;
  actorRole?: UserRole;
  affectedEntity?: string;
  fromDateUtc?: string;
  toDateUtc?: string;
  pageNumber?: number;
  pageSize?: number;
}
```

---

## User Interface & States

1. **Header & Navigation:**
   - Active tab highlighted under `Audit Logs` in Admin Console.
   - Title: "System Audit Logs" (high-contrast text against light background)
   - Subtitle: "Operational, security, and administrative event trail."

2. **Filter Bar:**
   - Search Input: "Search by keyword, email, or entity ID..." (supports partial ID & string matching; applied on submit)
   - Apply Filters submit button and Reset button.
   - Filter Dropdown: Action Type (e.g., `ApproveOperatorApplication`, `RejectOperatorApplication`)
   - Filter Dropdown: Actor Role (`Administrator`, `TourOperator`, `Traveler`)
   - Filter Dropdown: Affected Entity (`OperatorProfile`, `TourPackage`, `User`)
   - Date Range Pickers: From Date & To Date (`max=Today`, click-to-open calendar via `showPicker()`, local start/end of day ISO conversion)
   - Reset Button: Resets all filter inputs to default.

3. **Table Presentation:**
   - Dark mode glassmorphism styled table with `table-fixed` layout preventing column width jumping.
   - Columns: `Timestamp (UTC+7)`, `Event Type`, `Actor`, `Role`, `Affected Entity`, `Entity ID`, `IP Address`, `Actions`.
   - Handling system-triggered actions (`actorUserId === null`): displays badge `"System"` with neutral grey tone.
   - `Actions` column: View Detail icon button (`visibility`) preparing for UC-69 integration.

4. **Empty State (`MSG128`):**
   - Displays icon + `"No records found matching your criteria."` when `totalCount === 0`.

5. **Error State (`MSG126` / `MSG127`):**
   - 401 (expired/missing session): redirect to `/admin/login?returnUrl=/admin/audit-logs` (CR-10).
   - 403 Forbidden: Displays FeedbackAlert with locked `MSG126` ("You do not have permission to access this function.").
   - Network/Server failure: Displays FeedbackAlert with locked `MSG127` ("TripMate is temporarily unable to process your request. Please check your connection and try again.") and a "Retry" button.

---

## Acceptance Criteria

1. Administrator can navigate to `/admin/audit-logs` from the Admin navigation bar.
2. System audit logs are displayed in a paginated table ordered descending by timestamp with fixed column widths (`table-fixed`).
3. Administrator can filter by keyword (partial string & ID match), action type, actor role, entity, and date range (`max=Today`).
4. System-triggered events (`actorUserId === null`) display `"System"` gracefully.
5. `Actions` column provides View Detail icon button for seamless transition to UC-69.
6. If no records match, `MSG128` empty state is displayed.
7. Responsive design with glassmorphism UI styling following team aesthetics.

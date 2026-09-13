# UC-68 View Audit Logs Frontend Spec

## Status

Ready for Implementation Planning (Screen #33 System Audit Logs List)

## Scope

This specification defines the Next.js Frontend implementation for **UC-68: View Audit Logs** (Screen #33 System Audit Logs List).

It covers:
- Route: `/admin/audit-logs` (app Router path: `app/admin/(console)/audit-logs/page.tsx`).
- Navigation link added to `AdminNavigation.tsx` and `ROUTES.admin.auditLogs`.
- Read-only table listing audit log entries with columns: Event Timestamp (`createdAtLocal`), Event Type (`actionType`), Actor Email/Name (`actorEmail` / `actorFullName`), Actor Role (`actorRole`), Affected Module/Entity (`affectedEntity`), Affected Entity ID (`affectedEntityId`), IP Address (`ipAddress`).
- Search and filter bar supporting:
  - Keyword search (`keyword`)
  - Event Type / Action Type select filter (`actionType`)
  - Actor Role select filter (`actorRole`)
  - Affected Entity select filter (`affectedEntity`)
  - Event Date range filter (`fromDateUtc`, `toDateUtc`)
  - Reset filters button
- Pagination control supporting page navigation and items per page selection.
- Empty state (`MSG128`: "No audit log entries match the submitted criteria."), Loading state, and Error handling state (`MSG127` / `MSG126`).
- Date/Time display compliant with CR-07 (`Asia/Ho_Chi_Minh` UTC+7 formatted as `dd/MM/yyyy HH:mm:ss`).

> [!NOTE]
> - **UC-69 Scope Separation:** Deep detail modal/panel (`BeforeData`, `AfterData`) is owned by **UC-69** (Screen #34).
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
│   │   ├── AuditLogFilterBar.tsx         <-- Search & Filter Controls
│   │   ├── AuditLogTable.tsx             <-- Table Presentation
│   │   └── AuditLogPagination.tsx        <-- Pagination Controls
│   ├── services/
│   │   └── auditLogAdminService.ts       <-- Fetch API client
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
   - Title: "System Audit Logs"
   - Subtitle: "Operational, security, and administrative event trail."

2. **Filter Bar:**
   - Search Input: "Search by keyword, email, or entity ID..."
   - Filter Dropdown: Action Type (e.g., `ApproveOperatorApplication`, `RejectOperatorApplication`)
   - Filter Dropdown: Actor Role (`Administrator`, `TourOperator`, `Traveler`)
   - Filter Dropdown: Affected Entity (`OperatorProfile`, `TourPackage`, `User`)
   - Date Range Pickers: From Date & To Date
   - Reset Button: Resets all filter inputs to default.

3. **Table Presentation:**
   - Dark mode glassmorphism styled table.
   - Columns: `Timestamp (UTC+7)`, `Event Type`, `Actor`, `Role`, `Affected Entity`, `Entity ID`, `IP Address`.
   - Handling system-triggered actions (`actorUserId === null`): displays badge `"System"` with neutral grey tone.

4. **Empty State (`MSG128`):**
   - Displays icon + `"No audit log entries match the submitted criteria."` when `totalCount === 0`.

5. **Error State (`MSG126` / `MSG127`):**
   - 403 Forbidden: Displays FeedbackAlert with `MSG126` ("Access denied. Administrator role required.").
   - Network/Server failure: Displays FeedbackAlert with `MSG127` and a "Retry" button.

---

## Acceptance Criteria

1. Administrator can navigate to `/admin/audit-logs` from the Admin navigation bar.
2. System audit logs are displayed in a paginated table ordered descending by timestamp.
3. Administrator can filter by keyword, action type, actor role, entity, and date range.
4. System-triggered events (`actorUserId === null`) display `"System"` gracefully.
5. If no records match, `MSG128` empty state is displayed.
6. Responsive design with glassmorphism UI styling following team aesthetics.

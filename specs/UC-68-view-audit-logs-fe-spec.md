# UC-68 View Audit Logs Frontend Spec

## Status

Implemented; final-head verification and PR evidence pending (Screen #33 System Audit Logs List)

## Scope

This specification defines the Next.js Frontend implementation for **UC-68: View Audit Logs** (Screen #33 System Audit Logs List).

It covers:
- Route: `/admin/audit-logs` (app Router path: `app/admin/(console)/audit-logs/page.tsx`).
- Navigation link added to `AdminNavigation.tsx` and `ROUTES.admin.auditLogs`.
- Read-only table listing audit log entries with fixed column widths (`table-fixed` layout): Event Timestamp (`createdAtLocal`), Event Type (`actionType`), Result (`result`), Actor Email/Name (`actorEmail` / nullable `actorFullName`), Actor Role (`actorRole`), Affected Module/Entity (`affectedEntity`), Affected Entity ID (`affectedEntityId`), and IP Address (`ipAddress`).
- Search and filter bar supporting:
  - Keyword search (`keyword`) with partial string matching across Email, FullName, ActionType, AffectedEntity, and AffectedEntityId.
  - Event Type / Action Type select filter (`actionType`)
  - Actor Role select filter (`actorRole`)
  - Affected Entity select filter (`affectedEntity`)
  - Event Date range filter (`fromDateUtc`, `toDateUtc`) with `max=Today` business constraint, `From Date <= To Date` bounds, click-to-open calendar picker (`showPicker()`), and local start-of-day/end-of-day UTC ISO conversion.
  - Reset filters button
- Pagination control supporting page navigation and items per page selection.
- Empty state (`MSG128`: "No audit log entries match the submitted criteria."), Loading state, and Error handling state (`MSG127` / `MSG126`).
- Date/Time display compliant with CR-07 (`Asia/Ho_Chi_Minh` UTC+7 formatted as `dd/MM/yyyy HH:mm:ss`).

> [!NOTE]
> - **UC-69 Scope Separation:** Deep detail modal/panel (`BeforeData`, `AfterData`, `Reason`) and its View Detail action are owned by **UC-69** (Screen #34). UC-68 does not render an inactive action before that integration exists.
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
│   │   ├── AuditLogTable.tsx             <-- Table Presentation (table-fixed layout, Result column, responsive scroll)
│   │   └── AuditLogPagination.tsx        <-- Pagination Controls
│   ├── services/
│   │   └── auditLogAdminService.ts       <-- Same-origin browser API client
│   ├── api/
│   │   └── auditLogProxy.ts              <-- Server-only HttpOnly Admin cookie proxy
│   └── types/
│       └── auditLogAdmin.ts              <-- TypeScript interfaces & DTOs
├── components/navigation/
│   └── AdminNavigation.tsx               <-- Added "Audit Logs" menu link
└── lib/
    └── routes.ts                         <-- Added `ROUTES.admin.auditLogs`
```

---

## API Contract Integration

### Browser Endpoint
```http
GET /api/admin/audit-logs?keyword={keyword}&actionType={actionType}&actorRole={actorRole}&affectedEntity={affectedEntity}&fromDateUtc={fromDateUtc}&toDateUtc={toDateUtc}&pageNumber={pageNumber}&pageSize={pageSize}
Cookie: tripmate_admin_access_token=<HttpOnly; sent only to the FE server>
```

The browser calls `/api/admin/audit-logs`. Only the server-side proxy reads the
HttpOnly cookie and forwards the access token to the Backend endpoint
`/api/v1/admin/audit-logs` as a Bearer token.

### TypeScript Data Models

```typescript
export type UserRole = 'Traveler' | 'TourOperator' | 'Administrator';

export interface AuditLogSummaryDto {
  id: number;
  result: 'Success' | 'Failure' | null;
  actionType: string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorFullName: string | null;
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

The browser service validates the response structure at runtime. SQL `BIGINT`
identifiers must be positive JavaScript safe integers in the current JSON-number
contract; malformed or unsafe payloads are rejected as unavailable data instead
of being rendered with lossy identifiers.

---

## User Interface & States

1. **Header & Navigation:**
   - Active tab highlighted under `Audit Logs` in Admin Console.
   - Title: "System Audit Logs" (high-contrast text against light background)
   - Subtitle: "Operational, security, and administrative event trail."

2. **Filter Bar:**
   - Search Input: "Search by keyword, email, or entity ID..." (supports partial ID & string matching)
   - Filter Dropdown: current BE audit action constants (`POI_CREATE`, operator decision, tour-media, and sign-out actions)
   - Filter Dropdown: Actor Role (`Administrator`, `TourOperator`, `Traveler`)
   - Filter Dropdown: current BE audit entity constants (`POI`, `OperatorProfile`, `TourMedia`, `RefreshToken`)
   - Date Range Pickers: From Date & To Date (`max=Today` calculated from the local calendar date, click-to-open calendar via `showPicker()`, local start/end of day ISO conversion)
   - Reset Button: Resets all filter inputs to default.

3. **Table Presentation:**
   - Dark mode glassmorphism styled table with `table-fixed` layout preventing column width jumping.
   - Columns: `Timestamp (UTC+7)`, `Event Type`, `Result`, `Actor`, `Role`, `Affected Entity`, `Entity ID`, `IP Address`.
   - `Result` displays canonical `Success` / `Failure` text badges and `-` for legacy rows without an outcome.
   - Handling system-triggered actions (`actorUserId === null`): displays badge `"System"` with neutral grey tone.
   - No `Actions` column is rendered in UC-68. UC-69 adds the View Detail action only when its route, contract, and accessible detail surface are available together.

4. **Empty State (`MSG128`):**
   - Displays icon + `"No audit log entries match the submitted criteria."` when `totalCount === 0`.

5. **Error State (`MSG126` / `MSG127`):**
   - 401 Unauthorized: clears the invalid Admin cookie in the proxy and redirects to Admin login with the audit-list return URL.
   - 403 Forbidden: displays `"Access denied. Administrator role required."` without exposing the internal message-catalog code.
   - Network/Server failure: displays the locked MSG127 wording without its internal code and provides a "Retry" button.

---

## Acceptance Criteria

1. Administrator can navigate to `/admin/audit-logs` from the Admin navigation bar.
2. System audit logs are displayed in a paginated table ordered descending by timestamp with fixed column widths (`table-fixed`).
3. Administrator can filter by keyword (partial string & ID match), action type, actor role, entity, and date range (`max=Today`).
4. System-triggered events (`actorUserId === null`) display `"System"` gracefully.
5. Result is shown for every row when available; the UC-69 View Detail action is added only with the working UC-69 integration.
6. If no records match, `MSG128` empty state is displayed.
7. Responsive design with glassmorphism UI styling following team aesthetics.
8. The route checks for the HttpOnly Administrator cookie on the server before rendering. Missing sessions are sent to login with a local Admin `returnUrl`; successful sign-in validates that return URL against open redirects and returns to the audit list. The Backend remains authoritative for token validity, role, and account state.
9. Changing filters enters a loading state, cancels the obsolete request, and cannot let an older response overwrite the newest result.

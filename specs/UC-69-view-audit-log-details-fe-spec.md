# UC-69 View Audit Log Details Frontend Spec

## Status

Implemented & Verified (Screen #34 System Audit Log Entry Detail Drawer)

## Scope

This specification defines the Next.js Frontend implementation for **UC-69: View Audit Log Details** (Screen #34 System Audit Log Entry Detail Drawer).

It covers:
- Trigger component: `Actions` column in `AuditLogTable.tsx` (UC-68) with View Detail icon button (`visibility`).
- Side-drawer component: `AuditLogDetailDrawer.tsx` rendering over the Audit Log management screen (`/admin/audit-logs`).
- API integration: `getAuditLogDetail(id)` in `auditLogAdminService.ts` fetching `GET /api/v1/admin/audit-logs/{id}`.
- Detailed audit entry presentation:
  - Header: Audit Log ID (`#101`), Action Type badge, Close button (`X` & `ESC` key handler).
  - Event Overview: Action Type pill, IP Address (`ipAddress`), Local Timestamp (`createdAtLocal` - GMT+7 `dd/MM/yyyy HH:mm:ss` compliant with `CR-07`), UTC Timestamp (`createdAtUtc`).
  - Actor Info Card: Full Name (`actorFullName`), Email (`actorEmail`), Role badge (`actorRole`), User ID (`actorUserId`). System-triggered actions (`actorUserId === null`) display neutral badge `"System"`.
  - Target Object Card: Affected Entity (`affectedEntity`), Affected Entity ID (`affectedEntityId`).
  - State Audit Data: Before Data (`beforeData`) & After Data (`afterData`) JSON pretty-printed blocks with copy-to-clipboard functionality and empty state fallbacks (`(No prior state record)`, `(No post state record)`).
- Modal controls & UX:
  - Smooth slide-over animation with glassmorphism backdrop overlay.
  - Backdrop overlay click to dismiss.
  - Global `ESC` keyboard shortcut to close drawer.
- Error Handling:
  - HTTP 404 / `admin.audit_log_not_found`: Displays `MSG129` ("System audit log entry not found.").
  - HTTP 403 Forbidden: Displays `MSG126` ("Access denied. Administrator role required.").
  - Network/Server failure (500, network error): Displays `MSG127` ("The audit log details cannot be retrieved because of a system or network failure.").

---

## Actor

- **Administrator**

---

## Component Architecture

```text
src/
├── features/admin/audit-logs/
│   ├── components/
│   │   ├── AuditLogManagementView.tsx      <-- Holds selectedLogId state & renders AuditLogDetailDrawer
│   │   ├── AuditLogTable.tsx               <-- Triggers onViewDetail callback from Actions column button
│   │   ├── AuditLogDetailDrawer.tsx        <-- Main UC-69 Detail Drawer Modal
│   │   └── AuditLogDetailDrawer.test.tsx   <-- Vitest Unit Test Suite (4 tests)
│   ├── services/
│   │   └── auditLogAdminService.ts         <-- Added getAuditLogDetail(id) API client function
│   └── types/
│       └── auditLogAdmin.ts                <-- Added AuditLogDetailDto TypeScript interface
```

---

## API Contract Integration

### Endpoint
```http
GET /api/v1/admin/audit-logs/{id}
Authorization: Bearer <Admin_JWT>
```

### TypeScript Data Models

```typescript
export interface AuditLogDetailDto {
  id: number;
  actionType: string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorFullName: string;
  actorRole: UserRole | null;
  affectedEntity: string;
  affectedEntityId: number | null;
  beforeData: string | null;
  afterData: string | null;
  ipAddress: string | null;
  createdAtUtc: string;
  createdAtLocal: string;
}
```

---

## User Interface & Detail Drawer Design

1. **Trigger & Modal Opening:**
   - Clicking the eye icon (`visibility`) in `AuditLogTable.tsx` sets `selectedLogId = log.id`.
   - Backdrop overlay appears with blur effect (`backdrop-blur-sm`).
   - Slide-over drawer opens from the right side of the screen.

2. **Drawer Header:**
   - Displays log ID badge (e.g. `#101`) and title "Audit Log Details".
   - Subtitle: "UC-69 Detailed Event Audit Trail".
   - Top-right close button (`X`) and `ESC` key listener.

3. **Loading & Skeleton State:**
   - Animated spinner while `getAuditLogDetail(id)` request is in progress.

4. **Event Overview & Actor Information:**
   - Action Type rendered as high-contrast pill tag.
   - Timestamps shown in both GMT+7 (`dd/MM/yyyy HH:mm:ss`) and UTC ISO format.
   - Actor card displays full name, email, role badge, and user ID.
   - If `actorUserId === null`, displays a neutral System badge with icon `settings` and text `"System"`.

5. **Target Object Card:**
   - Affected Entity name (e.g., `OperatorProfile`, `TourPackage`) and Entity ID.

6. **State Audit Data (Before / After JSON Comparison & Layout Protection):**
   - Before Data block: Highlighted in amber tint, formatted with `JSON.stringify(parsed, null, 2)` if valid JSON. Includes "Copy" button.
   - After Data block: Highlighted in emerald tint, formatted with `JSON.stringify(parsed, null, 2)` if valid JSON. Includes "Copy" button.
   - **CSS Layout Protection Requirement**: `<pre>` containers MUST include `overflow-x-auto`, `max-w-full`, `break-words`, `whitespace-pre-wrap`, and `break-all` to ensure long URLs (e.g., Cloudinary/S3 image links) or base64/token strings do not cause horizontal layout overflow or break the 400px–600px drawer boundary.
   - If `beforeData` or `afterData` is null, displays `(No prior state record)` or `(No post state record)`.

7. **Error State (`MSG129` / `MSG126` / `MSG127`):**
   - 404 Not Found: Red feedback card displaying `MSG129` ("System audit log entry not found.") with a "Close Drawer" button.
   - 403 Forbidden: Red feedback card displaying `MSG126` ("Access denied. Administrator role required.").
   - System/Network Failure (500 or fetch exception): Displays `MSG127` ("The audit log details cannot be retrieved because of a system or network failure.").

---

## Acceptance Criteria

1. Clicking "View Details" on any audit log row opens the side-drawer overlay without navigating away from `/admin/audit-logs`.
2. Detailed information is retrieved from `GET /api/v1/admin/audit-logs/{id}`.
3. System-triggered logs (`actorUserId === null`) gracefully render the `"System"` actor badge.
4. `beforeData` and `afterData` are formatted as readable JSON blocks with copy buttons, enforced with `overflow-x-auto max-w-full whitespace-pre-wrap break-all` CSS to prevent layout distortion from long URLs.
5. Pressing `ESC` or clicking the backdrop overlay closes the detail drawer.
6. If the audit log ID does not exist, `MSG129` 404 error is displayed safely inside the drawer. System/network errors display `MSG127`.
7. Unit test suite passes 100% via `vitest`.


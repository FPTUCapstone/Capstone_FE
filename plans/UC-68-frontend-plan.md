# Implementation Plan — UC-68 Frontend: View Audit Logs

## Overview
This implementation plan outlines the Next.js / TypeScript frontend implementation for **UC-68: View Audit Logs** in `Capstone_FE` (Screen #33 System Audit Logs List).

The feature enables Administrators to view, search, filter, and paginate system audit logs via the `/admin/audit-logs` route.

---

## Technical Context & Decisions

1. **Framework & Styling**: Next.js App Router, TypeScript, TailwindCSS, custom UI components (`ActionButton`, `FeedbackAlert`, `StatusBadge`).
2. **Clean Architecture Separation**:
   - `types/auditLogAdmin.ts`: Data transfer interfaces & type definitions.
   - `services/auditLogAdminService.ts`: Centralized fetch API service handling query parameters and Bearer token headers.
   - `components/`: UI components separated into FilterBar, Table, Pagination, and Main View Container.
   - `app/admin/(console)/audit-logs/page.tsx`: Route entry point.
3. **Route Integration**: Register `ROUTES.admin.auditLogs` in `lib/routes.ts` and add menu link in `AdminNavigation.tsx`.
4. **Timezone & Local Formatting (CR-07)**: Uses `createdAtLocal` formatted string directly from backend or formats via local JS helpers in Vietnam Time.

---

## Proposed Component Changes

### Component 1: Application Routes & Navigation
- [MODIFY] [`routes.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/lib/routes.ts): Add `auditLogs: '/admin/audit-logs'`.
- [MODIFY] [`AdminNavigation.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/components/navigation/AdminNavigation.tsx): Add "Audit Logs" navigation link.

### Component 2: Types & API Service Layer
- [NEW] [`auditLogAdmin.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/types/auditLogAdmin.ts): TypeScript interfaces (`AuditLogSummaryDto`, `PaginatedList<T>`, `GetAuditLogsParams`).
- [NEW] [`auditLogAdminService.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/services/auditLogAdminService.ts): `getAuditLogs(params)` API client fetching `/api/v1/admin/audit-logs`.

### Component 3: Feature UI Components
- [NEW] [`AuditLogFilterBar.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogFilterBar.tsx): Filter & search bar controls.
- [NEW] [`AuditLogTable.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogTable.tsx): Table representation with dark theme glassmorphism styling.
- [NEW] [`AuditLogPagination.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogPagination.tsx): Page & pageSize navigation control.
- [NEW] [`AuditLogManagementView.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogManagementView.tsx): Main state container handling loading, error, empty, and data states.

### Component 4: Next.js Route Page
- [NEW] [`page.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/app/admin/(console)/audit-logs/page.tsx): Route page for `/admin/audit-logs`.

---

## Verification Plan

### Build & Linting Verification
- Run build check: `npm run build`
- Run linting check: `npm run lint`

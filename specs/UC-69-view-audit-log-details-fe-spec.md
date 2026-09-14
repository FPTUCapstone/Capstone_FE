# UC-69 View Audit Log Details Frontend Spec (SRS Aligned)

## Status

Updated for SRS Alignment (Screen #34 System Audit Log Entry Detail View)

## Scope

This specification defines the Next.js Frontend implementation for **UC-69: View Audit Log Details** (Screen #34 System Audit Log Entry Detail View).

It covers:
- **Centered Modal Layout**: Centered Modal Dialog (`max-w-4xl`, backdrop blur, centered on screen) replacing side drawer for maximum readability.
- **Trigger Component**: `Actions` column in `AuditLogTable.tsx` (UC-68) with View Detail icon button (`visibility`).
- **Modal Component**: `AuditLogDetailModal.tsx` rendering centered over `/admin/audit-logs`.
- **API Integration**: `getAuditLogDetail(id)` in `auditLogAdminService.ts` fetching `GET /api/v1/admin/audit-logs/{id}`.

---

## Screen Layout & Functional Panels (SRS Screen #34)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SYSTEM AUDIT LOG ENTRY DETAILS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. ENTRY HEADER                                                             │
│    • Event Identifier: #101             [Copy Event Identifier]             │
│    • Event Timestamp: 14/09/2026 17:00:00 (Asia/Ho_Chi_Minh CR-07)          │
│    • Event Type: ApproveOperatorApplication                                 │
│    • Event Result: [Success] / [Failure]                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ACTOR PANEL                                                              │
│    • Actor Email: admin@tripmate.vn                                         │
│    • Actor Role: Administrator                                              │
│    • Source Address: 192.168.1.10                                           │
│    • Client Platform: Web (Chrome / Windows)                                │
│    (* System-triggered events render neutral System badge per BR-115)       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. TARGET PANEL                                                             │
│    • Affected Module: TourOperatorManagement                                │
│    • Affected Entity Type: OperatorProfile                                  │
│    • Affected Entity Identifier: #502                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. CHANGE TABLE (BR-130, BR-03)                                             │
│    ┌──────────────────┬──────────────────────────┬────────────────────────┐ │
│    │ Field            │ Previous Value           │ New Value              │ │
│    ├──────────────────┼──────────────────────────┼────────────────────────┤ │
│    │ status           │ Pending                  │ Approved               │ │
│    │ passwordHash     │ ***MASKED***             │ ***MASKED***           │ │
│    └──────────────────┴──────────────────────────┴────────────────────────┘ │
│    (* If entry records no field change -> Displays MSG128 in table area)    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. CONTEXT PANEL (BR-119)                                                   │
│    • Supplied Reason: "Business license verified and compliant."           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. BUTTONS                                                                  │
│    [Back to List]                          [Copy Event Identifier]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Business Rules & Message Standards

| Rule / Message ID | Type | Description |
|---|---|---|
| **BR-115** | Authorization | Only accounts with Administrator role may read audit log entries. |
| **BR-130** | Immutability | Audit log entry content is immutable; presented exactly as recorded. |
| **BR-03** | Masking | Sensitive fields (`password`, `token`, `secret`, `creditCard`, etc.) are presented as `***MASKED***`. |
| **BR-119** | Context Reason | Supplied reason is presented in Context Panel when action required a reason. |
| **MSG126** | Access Denied | `"Access denied. Administrator role required."` *(403 Forbidden)* |
| **MSG127** | Network/System Error | `"The audit log details cannot be retrieved because of a system or network failure."` |
| **MSG128** | No Field Change Info | `"No field changes recorded for this entry."` *(Displayed in Change Table area)* |
| **MSG150** | Not Found Error | `"The selected audit log entry does not exist."` *(404 Not Found)* |

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
  result?: 'Success' | 'Failure' | string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorFullName: string;
  actorRole: UserRole | null;
  sourceAddress: string | null;
  clientPlatform: string | null;
  affectedModule: string | null;
  affectedEntity: string;
  affectedEntityId: number | null;
  beforeData: string | null;
  afterData: string | null;
  reason: string | null;
  createdAtUtc: string;
  createdAtLocal: string;
}

export interface FieldChangeRow {
  field: string;
  previousValue: string;
  newValue: string;
}
```

---

## Acceptance Criteria

1. Clicking "View Details" on any audit log entry opens a **Centered Modal Dialog** (`max-w-4xl`) in the middle of the screen.
2. Header Panel displays Event ID, GMT+7 Timestamp, Event Type, Result, and `[Copy Event Identifier]` button.
3. Actor Panel displays Email, Role, Source Address, Client Platform (and neutral `"System"` badge for system-triggered events).
4. Target Panel displays Affected Module, Entity Type, and Entity Identifier.
5. Change Table parses `beforeData` and `afterData` into structured rows (`Field` | `Previous Value` | `New Value`) with automatic `***MASKED***` masking for sensitive fields per BR-03.
6. If no field changes exist, Change Table area displays **`MSG128`** ("No field changes recorded for this entry.").
7. Context Panel displays Supplied Reason per BR-119 if present.
8. Non-existent entry ID displays **`MSG150`** ("The selected audit log entry does not exist.").
9. Clicking `[Back to List]`, clicking backdrop overlay, or pressing `ESC` closes the modal while preserving UC-68 list filters (PC-03).

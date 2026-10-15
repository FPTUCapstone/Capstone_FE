# UC-67 Statistical Reports integration boundary

## Requirements and approval status

- Authoritative requirements: `Report3_Software-Requirement-Specification-V2.docx`, UC-67, section 3.9.11, Screen #32.
- Actor: Administrator. Staff, Traveler, and Tour Operator accounts cannot access this workspace.
- `WEB_SCREEN_SPEC_APPROVAL_PENDING`: no approved Web Screen Specification for Screen #32 was found in the repository or PR evidence. This implementation must not be described as UX-approved until Product/BA supplies that approval.
- The SRS remains authoritative for functional scope. Its references to a screen do not constitute approval of the detailed Web layout, responsive behavior, or interaction design.

## Current implementation

The route `/admin/reports` verifies the signed administration session on the server and then applies an Administrator-only role gate. Missing, expired, invalid, or tampered sessions are rejected. A verified Staff session receives the access-denied state and cannot use the report workspace.

Production mode preserves the requested report criteria and presents a pending-integration state. It does not show synthetic statistics, claim a generated report, download a fabricated file, or create a fabricated audit record.

Demo mode is available only when all of these conditions hold:

1. `NODE_ENV` is not `production`.
2. `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`.
3. The request explicitly includes `?demo=1` or the backward-compatible `?demo=true`.

Demo data is deterministic and visibly labelled. CSV export creates a real RFC 4180 file from the displayed demo report and protects spreadsheet consumers from formula injection. Excel and PDF remain structured previews; they do not trigger downloads or claim success.

## Pending Backend contracts

Production completion depends on approved Backend contracts for authoritative statistical aggregation, closed-accounting-period validation, and file generation/delivery. BR-130 also requires an agreed immutable export audit contract. Until those contracts exist, production export remains disabled and the UI explains why.

This PR does not invent Backend endpoints, financial calculations, persistent export jobs, file storage, or audit writes.

## Authentication and deployment dependency

The server session seal uses `TRIPMATE_ADMIN_SESSION_SECRET`. The variable is documented in `.env.example`, but repository evidence cannot establish that every deployment has a sufficiently strong value configured. Track this as `DEPLOYMENT_SECRET_VERIFICATION_PENDING`; a successful build or deployment does not prove the secret value was provisioned correctly.

## SRS conflicts requiring Product/BA resolution

`SRS_MESSAGE_CODE_RECONCILIATION_PENDING` applies to these conflicts between UC-67 section 3.9.11 and Appendix 5.3:

- `MSG29`: UC-67 uses it for a report period that is not closed; Appendix 5.3 assigns it to POI geographic coordinate validation.
- `MSG117`: UC-67 uses it for report generation failure; Appendix 5.3 assigns it to algorithm parameter updates.
- `MSG149`: UC-67 uses it for successful file delivery, while the Appendix 5.3 catalogue ends at `MSG130`.

There is also `SRS_MAPPING_GAP_PLATFORM_REVENUE_SCREENS_37_38`: section 3.1.2 lists Screens #37 and #38, but the SRS provides no matching detailed use cases; UC-67 names Screen #32. The implementation uses descriptive English resource text and does not assert that these conflicting codes have been resolved.

## Shared CSV utility convergence and demo policy decisions

- `CSV_SHARED_UTILITY_CONVERGENCE_DEFERRED`: Reviewer noted that PR #54 introduced a shared utility `src/lib/csv.ts`. However, PR #54 is still open and `src/lib/csv.ts` does not yet exist on `origin/develop`. To avoid copying unmerged code across branches, PR #56 retains its tested, formula-safe local `escapeCsvCell` in `src/features/admin/reports/services/statisticalReportService.ts`. Once both PR #54 and PR #56 are merged to `develop`, an explicit follow-up task will consolidate CSV escaping into `src/lib/csv.ts` while preserving numeric metric formatting (`isLegitimateNumericMetric`).
- `UNAPPROVED_SCREEN_DEMO_POLICY_DECISION_PENDING`: Reviewer observed differing handling across unapproved screen prototypes: PR #54 disabled all actions pending screen spec approval, whereas PR #56 maintains interactive demo behavior under explicit environment and query opt-in while locking production to `PENDING_BE_INTEGRATION`. A cross-feature policy decision from Product/BA/UX or the engineering owner is pending to standardize demo behavior across screens awaiting approved Web Screen Specifications.

## Reviewer verification points

- Direct navigation rejects unauthenticated, expired, invalid, and tampered sessions.
- Staff cannot access the route or see its navigation item; Administrator can.
- Production mode cannot enable fixtures through query parameters alone.
- Production report generation and export remain unavailable with an accessible explanation.
- Demo CSV download is real and failure-aware; Excel/PDF are preview-only.
- CSV cells neutralize formula triggers while preserving legitimate numeric metrics.
- Keyboard, focus, labels, status announcements, empty states, and responsive layouts are covered by focused component tests.


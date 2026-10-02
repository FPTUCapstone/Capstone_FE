# UC-51 Frontend Plan — Reject Tour Operator Application

## Objective

Complete the rejection path on the UC-50 application-detail screen while preserving the reviewed UC-50 routing, Administrator session proxy, error handling, and accessible-dialog behavior.

## Baseline

- Repository: `Capstone_FE`
- Branch: `feature/linhnv-reject-tour-operator-application`
- Base: latest `origin/develop`, including merged UC-50 head `2b3b4ae`
- Shared route: `/admin/tour-operator-applications/[userId]`

## Implementation

### Client API

Use `src/features/admin/tour-operator-applications/api/tourOperatorApplicationApi.ts` to POST the trimmed reason to the same-origin Next.js route. Do not use direct backend URLs, bearer-token parameters, fallback mocks, or synthetic successful responses.

### Server proxy

Use `tourOperatorApplicationProxy.ts` and `app/api/admin/tour-operator-applications/[userId]/reject/route.ts`.

The proxy must enforce the Administrator HttpOnly session, same-origin mutation checks, JSON input, and reason validation before forwarding the request. Invalid sessions are cleared through the shared Admin session utility. Backend details are not exposed through 5xx responses.

### Rejection dialog

Update `RejectModal.tsx` to:

- use the locked MSG115 text without rendering its identifier;
- trim and validate the reason;
- enforce a maximum of 500 characters, matching the existing backend database column;
- submit exactly once while controls are disabled;
- show inline errors;
- emit locked MSG116 only after API success;
- clear form state on cancel and success;
- retain the UC-50 accessible-dialog pattern.

### Detail state

Keep `TourOperatorApplicationDetailView.tsx` server-authoritative. After rejection success, close the modal, announce success, and reload detail. The returned detail determines status, reason, reviewer, timestamp, documents, and available actions.

### Documentation

Synchronize this plan and the UC-51 spec with actual file names, same-origin API architecture, validation behavior, message-source decision, accessibility, tests, and the backend delivery dependency.

## Regression coverage

- Existing UC-50 component tests continue to protect routing, safe errors, state refresh, and decision-dialog accessibility.
- UC-51 component tests cover blank, oversized, trimmed valid input, request ordering, and locked success text.
- Proxy tests cover session, CSRF, forwarding, empty/oversized reason rejection, and safe upstream failures.

## Verification

Run sequentially from `Capstone_FE`:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

After committing, repeat validation on the exact pushed HEAD and record the SHA, results, UI screenshots, and remote CI outcome in the PR description.

## Known dependency

The UC-51 Backend implementation is owned by **@sekiro171** in
[`Capstone_BE#33`](https://github.com/FPTUCapstone/Capstone_BE/pull/33). The
`develop` branch still contains the reject stub until that PR is merged.

Required merge and verification order:

1. Complete the real-SQL concurrency/rollback gate and merge `Capstone_BE#33`.
2. Deploy or run that merged Backend with the current SQL Server schema and UC-51 seed.
3. On the final FE head, smoke test Admin sign-in → open a PendingApproval application → reject → authoritative detail reload.
4. Verify the User/profile/document transition and exactly one rejection audit and notification in SQL Server.
5. Add the final-head SHA, commands/results/skips, screenshots, and smoke evidence to `Capstone_FE#15`, then merge the FE PR.

There is currently no recorded PO/owner approval for merging FE before BE.
Therefore `Capstone_FE#15` remains dependent on `Capstone_BE#33`; automated FE
success-path tests do not replace the required live FE → BE → SQL smoke test.

## Local final-head evidence — 2026-09-29

- FE commit `feba15b`: typecheck passed; lint passed; Node proxy/session tests 35 passed; Vitest 421 passed across 42 files; production build passed with 22 routes.
- Manual smoke against Backend UC-51 and SQL Server 2022 Docker: Administrator HttpOnly-cookie sign-in succeeded, PendingApproval application `20001` loaded, rejection succeeded, and the authoritative detail reloaded as Rejected.
- Fresh SQL verification for application `20001`: `Users.status = Rejected`, `OperatorProfiles.approval_status = Rejected`, exactly one successful `RejectOperatorApplication` audit, and exactly one `OperatorApplicationRejected` notification.
- Backend SQL gate: reject–reject, reject–approve, and trigger-injected rollback tests passed 3/3 with no skips. The losing/failed attempt has a separate failure audit by the approved audit policy; it is not a second successful business decision.
- This smoke evidence proves local integration only. `Capstone_BE#33` must still merge first, and remote CI plus the pushed FE SHA must be recorded in PR #15 before merge-ready status.

# Screen #10 Pending Operator Applications List - Frontend Spec

## Status

Draft for approval. FE-first MVP: the Backend list endpoint does not exist yet (`PENDING_BE_INTEGRATION`).

## Task brief

- **Task / UC:** WP-02A, UC-50 / UC-51 entry point, Report 3 V2 Screen #10 (`TM-96` / `TM-97` own the Backend use cases).
- **Owner:** HoangTV. **Platform:** Next.js Web only. **Base:** `develop`.
- **Actor:** Staff (decision recorded by LinhNV: Staff decides UC-50/51/60/61). Whether Administrator keeps access is an
  open question, so this screen admits both roles; the Backend remains the authorization boundary (CR-11).
- **Purpose:** list Tour Operator applications awaiting verification so the reviewer can open one in Screen #11
  (`/admin/tour-operator-applications/[userId]`) without knowing its `userId`.

## Scope

In scope:

- Route `/admin/tour-operator-applications` with a session guard.
- Pending applications list, keyword search, pagination of 20 per page (CR-01), applied state kept in the URL so a
  round trip to Screen #11 keeps the page and search.
- Truthful `NO_BACKEND` state in production; demo rows only when the existing demo gate is satisfied
  (`NODE_ENV !== 'production'`, `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true` and `?demo=1`).
- English copy from a resource file (CR-09), dates as `dd/MM/yyyy HH:mm` in Asia/Ho_Chi_Minh (CR-07).
- A Backend contract proposal (below) so the missing endpoint can be built to what the screen needs.

Out of scope:

- Any Backend change, any approve/reject action (Screens #11 and #12 stay in `tour-operator-applications/`).
- Status filter: Screen #10 is the *pending* list only; other statuses are not defined for this screen.
- Navigation entry: `AdminNavigation` and the route registry are integration-owned by DatMNT. The only shared edit is
  an additive `ROUTES.admin` entry, flagged in the PR.

## Source decisions

| Topic | Decision | Source |
|---|---|---|
| List columns | Company, Tax Code, Business Licence No., Submitted, action | SRS V2 UC-50 applicant area, intersected with `TourOperatorApplicationDetailDto` |
| Submitted date | Shown only when the contract provides it; demo rows include it | SRS lists Submission Date; the detail DTO has no such field |
| Contact person | Not shown | Not in any DTO; not invented |
| Status filter | Not built | YAGNI, Screen #10 is the pending list |
| Mock content of Stitch (AI scan, SLA, countdown) | Not built | No SRS rule or DTO field (Team Rules section 4) |

## States

| State | Behaviour |
|---|---|
| Production, no Backend | `NO_BACKEND` notice, no rows, no search form |
| Demo | Banner, search form, rows, pagination |
| Empty | Empty notice, filters kept |
| Invalid / out-of-range `page` | Clamped to the last page |
| Unauthenticated | Redirect to admin login with `returnUrl` |
| Staff or Administrator session | Admitted (server authorization stays in the Backend) |

## Backend contract proposal (not implemented)

```http
GET /api/v1/admin/tour-operator-applications?keyword=&pageNumber=1&pageSize=20
```

Returns the paged DTO already used by `GET /api/v1/admin/audit-logs`
(`items`, `pageNumber`, `pageSize`, `totalCount`, `totalPages`, `hasPreviousPage`, `hasNextPage`).
Only applications whose `applicationStatus` is `PendingApproval`, ordered by submission time ascending.

```ts
interface PendingOperatorApplicationSummaryDto {
  userId: number;
  companyName: string;
  taxCode: string;
  businessLicenseNumber: string;
  submittedAtUtc: string | null; // nullable: not stored today
}
```

Authorization: Staff (per the recorded decision), enforced by the Backend.

## Files

| File | Purpose |
|---|---|
| `app/admin/(console)/tour-operator-applications/page.tsx` | route, session guard |
| `src/features/admin/operator-application-queue/` | feature code, tests, resources, demo fixtures |
| `src/lib/routes.ts` | additive `ROUTES.admin.operatorApplications` and `operatorApplication(id)` |

The feature lives in its own directory so it shares no file with the open WP-02 delivery.

## Acceptance criteria

1. Production build renders the `NO_BACKEND` notice and never reads fixtures, even with `?demo=1`.
2. Demo mode shows 20 rows per page, pagination links keep `q` and `demo`, and each row links to Screen #11.
3. Search applies only on submit; reset returns to page 1 with no keyword.
4. Missing `submittedAtUtc` renders "Not available", never an invented date.
5. Guard: a missing, unsealed or invalid session redirects to login with `returnUrl`; a signed Staff or Administrator
   session is admitted. The session only carries those two roles, so no separate "unknown role" branch exists.
6. No Vietnamese text; copy comes from `resources/en.ts`.
7. `typecheck`, `lint`, `test`, `next build --webpack` and `git diff --check` pass.

## Plan

1. Types, query parsing and href builders (tests first).
2. Demo gate and fixtures, service returning `NO_BACKEND | DEMO` (tests first).
3. Queue component with search, rows and pagination (tests first).
4. Route page with guard (tests first), then the additive `ROUTES.admin` entries.
5. Full gates, then responsive and keyboard check.

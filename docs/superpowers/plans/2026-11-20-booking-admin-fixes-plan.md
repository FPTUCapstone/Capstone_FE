# Web booking and Admin fixes — implementation plan

Status: approved by the user; authority: ../specs/2026-11-20-booking-admin-fixes-spec.md.

1. Add failing email regressions in TourBookingView tests; reuse shared email
   validation where compatible and validate before createBooking.
2. Add cancellation regressions to BookingTicketView/BookingCancelAction tests;
   expose success callback, immediately revoke ticket UI and reload safely;
   guard print against Cancelled tickets including initial load.
3. Inspect both search versions, recommendation feeds and detail bookability
   contracts against existing BE booking validators. Add eligibility regressions
   (full/closed/expired/invalid itinerary/mixed schedules/pagination). Reuse BE
   authority and extend search contract only as necessary, then update FE callers.
4. Add Control Center link and Admin-vs-Staff navigation regressions; update
   dashboard resources/cards and AdminSidebar without discarding dirty edits.
   Add mixed Staff audit-response regression, then align type/parser/labels and
   actor-role filter with the existing BE role; do not change access permissions.
5. Review scope compliance and code quality using subagents per AGENTS. Run
   focused tests first, then npm test, lint and typecheck in the existing FE
   container. Verify routes, form errors and cancellation UI. Production build
   must use a separate build directory/container so the live dev .next is not
   corrupted; report resource limits honestly. Run BE checks if BE was changed.
6. Confirm localhost:3001 serves updated changes. Leave branches unpushed.

## Verification

- `npm test`: 107 Node tests passed; 387 Vitest files passed with 4,247 tests
  passed and 5 existing skips. Stale weather/algorithm navigation expectations
  were updated to the previously approved removals. Account-route tests now
  mock backend transport instead of contacting the live API.
- `npm run lint` and `npm run typecheck`: passed after final FE changes.
- `npm run build`: passed with Next.js 16.4.3/Turbopack in an isolated temporary
  workspace. A symlink-only dependency setup initially failed Turbopack's
  workspace boundary; a physical temporary dependency copy resolved it. The
  successful build workspace was removed; live development `.next` was untouched.
- BE relevant unit tests: 106 passed. API/SQL Server integration: 68 passed,
  zero skipped, against disposable test databases. Includes search eligibility,
  detail, recommendations, parser and OpenAPI coverage.
- Two-stage independent FE and BE scope/code review: no blocking findings.
  Mixed Staff/Administrator audit response coverage was strengthened afterward.
- Browser automation could not initialize in this session. React interaction
  regressions and live HTTP checks are used; no manual visual QA claim is made.
- No commit, push, role-permission change or production DB migration.
- Live local smoke checks after API update: Web homepage HTTP 200; Admin BFF
  authentication succeeds; Audit Log returns 111 records including Staff. Public
  `/api/tours` returns 10 eligible tours versus 18 in the compatible generic BE
  search; zero unavailable representatives and every listed tour has a bookable
  detail schedule. Supplying `bookableOnly=false` to the BFF cannot bypass the
  filter. Clock override remains empty (real time).

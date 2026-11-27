# Staff complaint resolution implementation

1. Add contract/auth/action regression tests in `src/features/admin/staff-complaints/*.test.ts(x)`; verify Staff accepted, Administrator and missing session rejected, foreign origins rejected, invalid monetary/version/action fields blocked.
2. Add typed DTOs and feature BFF proxy, App Router API GET list/detail/evidence and POST decisions. Use backend pagination `page/pageSize`, signed cookie and private binary responses. Verify focused tests.
3. Add Staff queue/detail client views and server role guards at `app/admin/(console)/staff/post-trip-complaints`. Render original evidence, negotiation/history and allowed decision form. Keep refreshed detail after success. Add action interaction tests.
4. Add Staff-only sidebar destination, breadcrumbs and safe sign-in return paths; verify route/auth tests and focused lint/typecheck. No full build or full suite during memory-limited implementation; no commit/push/restart.
5. Integrate shared party Staff-review history/evidence/reconsideration panel into Traveler booking complaint/proposal and TO detail. Add role/origin/download compatibility tests and party submission tests; keep historical Declined unchanged.
6. Refine PartyStaffReviewPanel only: outcome first, compact expandable timeline and evidence group, active-only evidence deadlines. Preserve action guards and history data. Update the existing behavioral test for completed-request messaging; check focused lint/typecheck, without adding positioning-only tests.

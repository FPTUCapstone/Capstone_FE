# Execution

1. Confirm current contracts and record baseline; add failing regression tests for real listing, authentication, persistence acknowledgement, IDs and stale responses.
2. Implement the missing backend list query with authorization/paging tests. Replace the Web mock store with authenticated API state, verified DTOs and realtime lifecycle. Keep dialog validation and remove embedded fake identities/accounts.
3. Review security/logic, run focused tests, lint/typecheck/build and relevant existing tests. Start real local services and insert clearly named fixtures into the database only.
4. Exercise the workflows in the spec through browser interactions, record evidence, fix and repeat failures. Finish Web before touching Mobile.
5. Apply the same data/persistence/lifecycle corrections to Mobile; validate automated checks and actual emulator workflows. Report outcomes and outstanding limitations honestly.

## Web validation — 2026-11-24

Manual results reported by the parent browser/API/SQL run (not repeated by the final-validation reviewer):

- Persisted history over 60 messages, sending and reload; two-account realtime delivery observed at 408 ms.
- Poll creation/vote/change/cancel, broadcast acknowledgment, roll call, and an expense of 100001 VND split as 50001/50000 with VietQR and persisted paid status.
- HTTP 503 retains the draft and permits retry; lost-response nonce reconciliation; outsider group 403 and direct-conversation 404.
- A 390 px viewport has no horizontal overflow. Two tabs with one-minute access tokens preserved the selected DM and draft for over 70 seconds, refreshed successfully, and sent afterward. The earlier remount was attributed to HMR.

Automated final validation:

- `npm run typecheck`: passed.
- The original `npm test -- --maxWorkers=1` and `npm run lint` were already running when validation ownership transferred; no duplicate was started while those processes remained active. Their logs are in the system temporary directory as `messenger-fe-full-tests.log` and `messenger-fe-final-lint.log`.
- Confirmed a baseline-only clock failure in the unchanged `UpdateTourPackageView.test.tsx` fixture (departure 2026-11-20). The unchanged validator returns only a past-departure error at 2026-11-24 and no errors at 2026-11-01. A test-only Date clock freeze leaves real async timers enabled; the focused suite passes all 13 tests.
- Full-suite completion, verified lint exit, and production build are pending at this checkpoint.

Independent review findings awaiting disposition:

1. `components/useMessenger.ts:100-121`: invalidation refreshes only the latest history window once it overlaps the synchronized newest anchor. Remote votes/receipts/payments on older loaded cards remain stale. An isolated React hook probe observed server poll counts `{"0":1}` but displayed counts `{}` after notification. Local mutations already apply authoritative results; authorized reads must also refresh affected older loaded rows.
2. `components/GroupChatHub.tsx:93`: starting a new DM from the sidebar does not set the narrow-layout detail state. An isolated React probe selected the DM and closed the dialog but left the main pane with `md:flex hidden`; below the breakpoint the user must click the newly created sidebar row to see it.

No runtime seed code, commits, or pushes were added by final validation.

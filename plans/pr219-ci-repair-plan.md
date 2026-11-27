# PR 219 CI repair plan

1. Reproduce CI failures on the existing PR head and inspect changed production behavior.
2. Repair the affected test fixtures and assertions; retain behavioral coverage, including navigation targets and refund modal behavior.
3. Run focused tests, then the full npm test command with one worker, lint, typecheck and production build.
4. Review the limited test-only diff, commit with attribution, and report results for the requested branch push.

## Verification

- The six affected Vitest files pass: 107 tests. Existing assertions now exercise the approved localized statuses, commission and legacy navigation destinations, centered refund modal, authoritative complaint eligibility fixture, and newly approved operator session.
- Node test suite: 107 passed.
- `npm run lint` passed; `npm run typecheck` passed.
- Full `npm test -- --maxWorkers=1` was attempted, but the local Vitest process aborted with native `FATAL ERROR: Zone Allocation failed - process out of memory`; this is not a passing full-suite result. No test was skipped or excluded to hide that failure.
- Production build is left to the existing CI check because the local host reached commitment limits and had under 300 MB free on its system drive. This patch changes only tests and their scope/verification notes.
- Parent performed a separate two-pass review of all six test diffs; no production implementation, workflow, API contract or dependency file changed.

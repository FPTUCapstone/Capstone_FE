# UC-57 FE implementation plan

Approved four-parameter implementation, 2026-09-21.

1. Baseline: read repo rules/shared auth/UI; run existing test, lint, typecheck and build.
2. Test first: service contract tests for bare DTO, four-key PUT, root errorCode, safe failures and session expiry. Implement types, messages, validation and service under src/features/admin/algorithm-config.
3. Test first: form tests for loading/retry, validation boundaries, successful save, failed save preserving input, cancel and auth denials. Implement AlgorithmConfigForm using shared session and controls.
4. Add server route composition at app/admin/(console)/settings/algorithm-parameters/page.tsx, route constant and AdminNavigation link.
5. Verify focused/full tests, lint, typecheck, production build. Independent spec and code review coordinated by root; browser viewport/keyboard verification coordinated by root. Report any unverified actual login/API integration.

## Verification evidence

The changes were protected in local commit `3a495b1` and rebased onto Frontend
`origin/develop` `9f96846` on 2026-09-22.

- Evidence working directory:
  `D:\study\Project-Capstone\Capstone_FE-uc57`, branch
  `feature/linhnv-configure-algorithm-parameters`. The similarly named files in
  `Capstone_FE` belong to a different worktree and are not this evidence set.

- Full local verification was executed at `783b35b`. Commits after that point
  only update verification documentation or normalize file endings; the final
  pushed HEAD is identified by the PR and its CI run rather than embedded into
  a self-referential commit.
- Full test suite: 30 Node tests and 302 Vitest tests passed (332 total,
  0 failed); Vitest covered 28 test files.
- Lint: 0 errors; 3 existing landing-page image warnings outside UC-57.
- TypeScript typecheck: passed.
- Production build: passed; the algorithm-parameters route was generated.
- Browser fixture check: initial load, client-side invalid value (`4` minutes),
  and successful save (`20` minutes) behaved as specified on a desktop viewport.
- `git diff --check`: passed.

The browser fixture did not use the real login or database. Manual 320 px
overflow verification is also still outstanding. These checks must be repeated
against the integrated backend after the login owner completes their work.

The checks above are post-rebase local evidence. The exact pushed HEAD and remote
CI result must still be recorded in the PR description or re-review message
before marking the PR merge-ready.

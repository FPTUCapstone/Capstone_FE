# Agent Instructions

## Development Workflow (Superpowers Protocol)

Follow an **Explore → Clarify → Spec → Plan → TDD → Atomic Execution → Verify** workflow for
non-trivial tasks. Never jump directly from a request to implementation code.

1. **Explore & Understand** — Inspect the relevant existing source, related modules, tests, and
   nearby documentation before proposing changes. Do not guess business logic, architecture, or
   requirements when the repository already contains the answer.
2. **Clarify First** — Confirm the assigned task's scope explicitly. Do not implement
   functionality merely because it appears in an SRS, use-case list, or screen inventory. If a
   requirement, contract, or destructive action is materially ambiguous, stop and ask the
   developer instead of inventing it.
3. **Specification** (for non-trivial tasks) — Define scope, acceptance criteria, affected
   modules, and edge cases before implementation begins. Wait for developer approval.
4. **Isolated Workspace** — Once the approach is approved, create or switch to a dedicated
   feature branch (see Git section below) before touching any code. Confirm the required checks
   are green on a clean checkout first — never start implementation on top of an already-broken
   baseline.
5. **Implementation Plan** — Break the spec into small, independently verifiable tasks with the
   exact files to touch and how each will be verified. Wait for developer approval.
6. **Atomic Execution & TDD (Red → Green → Refactor)** — Implement one task at a time; write a
   failing test first where applicable, write the minimal code to pass, refactor, then verify
   before moving to the next task. Do not silently expand scope. When the harness supports
   subagents, dispatch each task to a fresh subagent for a two-stage review (spec compliance,
   then code quality) before integrating it; otherwise perform the equivalent two-pass
   self-review. If implementation code was written before its test, delete it and restart with
   the test first.
7. **Code Review Between Tasks** — After each task passes verification, review it against the
   plan and spec before moving on. Classify findings by severity: a **Critical** finding (breaks
   a requirement, introduces a regression, violates an architecture rule below) blocks moving to
   the next task until fixed; a **Minor** finding may be noted and deferred with the developer's
   agreement.
8. **Verification** — Run this repo's required checks (see below) before reporting completion,
   and report results honestly, including any skipped or environment-limited checks.
9. **Finishing the Branch** — Once every task is complete and verified, do not merge, push, or
   open a Pull Request unprompted. Present the developer with the options — merge, open a PR,
   keep the branch as-is, or discard — and act only on their choice.

Apply YAGNI (build only what the current task needs) and DRY (share logic only when genuinely
duplicated) throughout — this workflow governs *how* work proceeds, it does not replace the
architecture and delivery rules below.

## Scope

- Production Web may contain Public, approved Traveler, approved Tour Operator, and Administrator product areas.
- Determine platform ownership from the latest approved SRS and `docs/WEB_SCOPE_MATRIX.md`; never invent Web equivalents of `MOBILE_ONLY` or `NON_SCREEN` use cases.
- Current frontend route examples include `/`, `/account/*`, `/admin/*`, `/partner/*`,
  `/plan`, `/itinerary/*`, `/pois/*`, and `/tours/*`. This is not an exhaustive route inventory.
- Route examples in `AGENTS.md` describe current frontend implementation. Product scope and
  platform ownership remain governed by the approved SRS and `docs/WEB_SCOPE_MATRIX.md`.
  New routes or namespaces require an approved implementation task; examples do not authorize them.
- `src/legacy/mobile/` is historical visual reference code, not a platform-scope authority or production Next.js source.
- Distinguish mock/prototype behavior from production integration.

## Before Editing

- Inspect `README.md`, `CONTRIBUTING.md`, `docs/CODEBASE_RULES.md`, `.github/pull_request_template.md`, `package.json`, and nearby code.
- Preserve established libraries and patterns; do not invent requirements or add unrequested features.
- Keep changes scoped; do not rewrite, remove, or reformat unrelated working code.

## Architecture

- Put routes and route-level composition in `app/`; put substantial implementation in `src/features/`.
- Default to Server Components. Add `'use client'` only for browser interaction and keep the boundary narrow.
- Put reusable cross-feature UI in `src/components/`; keep feature-specific code inside its feature.
- Use real App Router navigation with `next/link` or `router.push()` when required.
- Before a new visual Web screen, verify its SRS classification, approved Web Screen Specification, reviewed UI, and approved implementation task; Stitch is optional for non-visual work or by maintainer approval.
- Do not add global state, UI frameworks, or new architecture layers without approval.

## Package Manager

- Use npm and preserve `package-lock.json`.

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run build
```
- `npm test` is configured and runs the repository's Node and Vitest tests; run and report its results.

## Pre-PR Validation Requirements

Before creating a Pull Request, every contributor must run the following commands locally,
in order, and review their results:

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run build
```

These steps install dependencies, run automated tests, lint, type checking, and the production
build. Type checking is required when configured; this repository configures `npm run typecheck`.
Only create a Pull Request after all required checks pass. A failed or environment-blocked check
does not count as passing: resolve it and rerun the affected checks before creating the PR.
Record validation results in the PR description. Explaining a failure does not waive this gate.

This pre-PR gate applies to documentation-only changes as well and takes precedence over the
environment-limited documentation completion allowance in `docs/FRONTEND_ENGINEERING_CONVENTION.md`
when deciding whether a new PR may be created. Reporting task completion is not PR readiness.

## Automated Testing Rules

- New features should include appropriate automated tests.
- Bug fixes should include regression tests when practical.
- Tests must verify observable behavior, not implementation details.
- Failed tests block PR creation; test failures must be fixed and must not be ignored.
- Do not skip, disable, or exclude failing tests to create a PR.
- If appropriate tests cannot be added, explain the reason in the PR description; this does not
  excuse failures in the existing required test suite.
- Preserve the existing test-first workflow where applicable; add or update tests alongside
  changed behavior and run the required test command before requesting review.

## Pull Request Readiness Workflow

Apply the existing scope, specification, plan, and approval gates before implementation.
The branch-to-merge sequence is:

1. Create a branch using the existing branch convention.
2. Implement the approved changes with the existing TDD workflow.
3. Add or update appropriate tests; write behavioral tests before implementation where applicable.
4. Run all pre-PR validation commands.
5. Review local results and resolve failures before proceeding.
6. Create a Pull Request only after the validation gate passes and developer authorization exists.
7. Request reviewer approval and address review feedback.
8. Merge only after required checks and reviewer approval, following the existing merge authorization rules.

This sequence does not grant agents permission to push, create PRs, approve their own work,
or merge without the developer direction required by the existing rules.

## Continuous Integration Expectations

- Frontend CI in `.github/workflows/frontend-ci.yml` automatically validates tests,
  TypeScript, ESLint, and the production build for Pull Requests targeting `develop`
  and pushes to `develop`, after installing locked dependencies with `npm ci`.
- A failing frontend CI check blocks Pull Request approval.
- Pull Requests should run automated checks through CI when configured. This repository's CI
  runs tests, lint, type checking, and the production build.
- A failing CI check blocks merge.
- Contributors are responsible for fixing failed checks before requesting approval.
- Local validation does not replace CI validation. Local checks must pass before PR creation;
  configured CI checks must pass before approval and merge.

## Frontend Validation Checklist

Before requesting review, confirm the following. Mark UI-specific items not applicable with
a reason for non-UI changes; required automated commands still apply.

- [ ] Tests pass.
- [ ] TypeScript validation passes.
- [ ] ESLint passes.
- [ ] Build succeeds.
- [ ] Responsive behavior checked.
- [ ] Loading state checked.
- [ ] Error state checked.
- [ ] Accessibility considerations reviewed.

## File-Scoped Commands

| Task | Command |
| --- | --- |
| Lint one file | `npm exec eslint -- path/to/file.tsx` |
| Typecheck | `npm run typecheck` (project-wide configuration required) |

## Security and Configuration

- Never commit secrets, tokens, passwords, local `.env` files, logs, or generated artifacts.
- `NEXT_PUBLIC_*` values are public; never place server secrets in them.
- Update `.env.example` and setup docs when required configuration changes.

## Git and Completion

- Branch from `develop`; use `<type>/<lowercase-kebab-case>` and Conventional Commits.
- Do not push directly to `main` or `develop`, force-push, or modify unrelated history.
- Run required validation before reporting completion; report failures and technical debt honestly.
- Do not claim API, authentication, authorization, persistence, maps, or payments are integrated unless verified.

## Commit Attribution

- AI-authored commits must include `Co-Authored-By: Codex <noreply@openai.com>`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

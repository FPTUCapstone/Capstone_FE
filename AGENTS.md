# Agent Instructions

## Scope

- Production Web may contain Public, approved Traveler, approved Tour Operator, and Administrator product areas.
- Determine platform ownership from the latest approved SRS and `docs/WEB_SCOPE_MATRIX.md`; never invent Web equivalents of `MOBILE_ONLY` or `NON_SCREEN` use cases.
- Current implemented routes remain `/` and `/admin/*`; future namespaces are created only by an approved implementation task.
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
npm run lint
npm run typecheck
npm run build
```
- No automated test script is configured; run and report applicable tests if one is introduced.

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

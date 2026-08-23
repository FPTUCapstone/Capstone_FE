# TripMate Frontend Codebase Rules

This document defines the engineering rules for the TripMate Web Frontend. It applies to human contributors and AI coding agents.

## 1. Product and repository boundary

This repository implements only:

- the Public Website at `/`;
- the Administrator Web Application under `/admin`.

Traveler and Tour Operator applications are maintained separately in Flutter. Components under `src/legacy/mobile` are visual references, are not production Next.js routes, and must not be promoted to Web modules without an explicit product decision.

The current Administrator login, tour-review data, and moderation interactions are prototypes. Do not describe mock behavior as production authentication, authorization, persistence, or API integration.

## 2. Approved technology

- Next.js 16 App Router
- React 19
- TypeScript with strict mode
- Tailwind CSS 4
- ESLint with Next.js Core Web Vitals and TypeScript rules
- npm and the committed `package-lock.json`

Do not replace the package manager, introduce global state management, or add a UI framework/design system without team approval. Bootstrap, Material UI, Chakra UI, and similar systems are not approved dependencies.

## 3. Approved project structure

```text
app/                         Route segments, layouts, metadata, and route-level files
  admin/
    login/                   Administrator authentication route
    (console)/               Shared Administrator application layout and routes
src/
  components/                Reusable cross-feature UI, brand, and navigation
  data/                      Current prototype/mock data
  features/                  Business- or screen-specific implementation
    public/
    admin/
  legacy/mobile/             Reference-only mobile prototype components
  lib/                       Shared framework-agnostic helpers and route definitions
  types/                     Truly shared domain and application types
```

Create `src/services/` only when real external integrations require a shared service/configuration boundary. A feature-specific service belongs inside `src/features/<feature>/services/` when it is not shared.

Do not create empty architecture layers in anticipation of future work. Prefer the smallest structure that gives the current feature a clear home.

## 4. App Router and routing

- Production routes belong under `app/`.
- Use route groups for shared layouts without changing URLs.
- Keep `page.tsx` and `layout.tsx` focused on route composition, metadata, and data boundaries; move substantial UI or business logic into `src/features/`.
- Use meaningful, stable paths and kebab-case route segments where applicable.
- All routes must support direct navigation and browser refresh.
- Use `next/link` for normal internal links.
- Use `router.push()` only when navigation is an outcome of client-side logic.
- Do not use `window.location` for ordinary internal navigation without a documented technical reason.
- Never simulate routes through a local `currentPage` state or similar page-switching mechanism.

Current route scopes are:

- `/` — Public Website
- `/admin/login` — Administrator authentication placeholder
- `/admin/*` — Administrator application

## 5. Server and Client Components

Server Components are the default. Use them for static content, layouts, server-side data access, metadata, and non-interactive composition.

Add `'use client'` only when a component requires browser-side capabilities such as:

- React state or effects;
- event handlers and interactive forms;
- modals and client-only widgets;
- browser APIs;
- maps or libraries that require the browser runtime.

Keep client boundaries as low and narrow as practical. Do not mark a page, root layout, or broad feature subtree as a Client Component merely to simplify prop flow.

Never import server-only code, credentials, or privileged data access into a Client Component.

## 6. Feature organization

Place business-specific implementation under `src/features/<feature>/`. Administrator features belong under `src/features/admin/<feature>/`.

A feature may add only the folders it needs:

```text
src/features/admin/<feature>/
  components/
  schemas/
  services/
  types/
  utils/
```

- Keep feature-specific components inside their feature.
- Move UI to `src/components/` only when it is genuinely reused across features.
- Avoid giant components, route files, and shared utility modules.
- Avoid premature abstraction and duplicate business logic.
- Prefer composition over components with many unrelated modes or responsibilities.

## 7. TypeScript

- Preserve `strict` TypeScript behavior.
- Define explicit prop types for components.
- Reuse domain types when multiple features share the same concept.
- Keep API request and response contracts type-safe at the service boundary.
- Use `unknown` for untrusted values and narrow it safely.
- Do not use `any` without a documented technical reason.
- Do not use `@ts-ignore` without an explanation and team approval; prefer fixing the type or using an explicit, justified `@ts-expect-error`.
- Do not create incompatible duplicate definitions of the same domain entity.

## 8. Components and naming

- Give each component one clear responsibility.
- Keep components reasonably small and make data flow explicit.
- Simplify deeply nested conditional rendering.
- Extract repeated markup or behavior when reuse is real.
- Use semantic elements before generic containers.

Naming conventions:

- `PascalCase` for React components, component files, types, and interfaces.
- `camelCase` for functions, variables, hooks, and non-component files.
- `UPPER_SNAKE_CASE` for immutable module-level constants where appropriate.
- Prefix custom hooks with `use`.

## 9. Styling and responsive behavior

- Use Tailwind CSS as the primary styling approach.
- Reuse established colors, spacing, typography, and shared visual components.
- Avoid repeated arbitrary values when a shared token or component is appropriate.
- Avoid inline styles unless a value is inherently dynamic or a library requires them.
- Check supported viewport sizes and prevent horizontal overflow.
- Preserve accessible contrast and visible focus indicators.
- Do not add another CSS framework or design system without approval.

## 10. Data and API integration

No production API layer is currently implemented. When integration begins, use this dependency direction:

```text
route / UI -> feature service or shared service -> backend API
```

- Centralize the backend base URL and shared request configuration.
- Keep complex request, transformation, and error-handling logic out of visual components.
- Do not scatter raw backend URLs across the codebase.
- Do not hard-code localhost URLs, production URLs, tokens, or API keys in source files.
- Keep mock data clearly identified and separate from production services.
- Do not introduce a data-fetching library without team approval and a demonstrated need.

## 11. Authentication and security

- Implement production authentication only according to the approved backend/session architecture.
- Treat UI visibility checks as presentation behavior, not authorization.
- Do not claim placeholder checks are production RBAC.
- Never commit or log passwords, access tokens, refresh tokens, session secrets, API keys, or private keys.
- Never expose server secrets using `NEXT_PUBLIC_*`; every `NEXT_PUBLIC_*` value is readable by users.
- Validate and encode untrusted values at the appropriate boundary.
- Avoid rendering raw HTML. Any required HTML rendering must be sanitized and reviewed.
- Do not expose stack traces, database details, server internals, or raw exceptions to users.

Report suspected secret exposure immediately. Remove the secret from use and rotate it; deleting it from the latest file alone does not remove it from Git history.

## 12. Environment variables

- Commit `.env.example` with variable names and safe placeholder values only.
- Never commit `.env`, `.env.local`, `.env.production.local`, or other credential-bearing environment files.
- Document whether each variable is server-only or browser-visible and what it controls.
- When adding a required variable, update `.env.example` and update `README.md` if setup instructions change.
- Do not add a `NEXT_PUBLIC_*` prefix unless the value is explicitly safe for public browser delivery.

The current project requires no runtime environment variables. Do not invent variables until an integration needs them.

## 13. Loading, empty, and error states

Every new data-driven screen must consider four states where applicable:

1. Loading
2. Success
3. Empty
4. Error

Use App Router conventions such as `loading.tsx`, `error.tsx`, and `not-found.tsx` when the state belongs at a route boundary. Use feature-level states when only part of a screen is affected.

Errors shown to users must be actionable, non-sensitive, and written in product language. Log technical context only through an approved, non-sensitive observability path.

## 14. Accessibility

- Use semantic HTML landmarks and heading order.
- Associate every form control with a visible or accessible label.
- Use `<button>` for actions and links for navigation; do not use clickable `<div>` elements.
- Support keyboard operation and logical focus order.
- Preserve visible focus states.
- Add meaningful alternative text to informative images and empty alternative text to decorative images.
- Provide accessible names for icon-only controls.
- Do not communicate state through color alone.

## 15. Git workflow

`main` is the release branch. `develop` is the normal integration branch. Do not develop or push directly on either branch; open Pull Requests into `develop` unless maintainers explicitly direct a release or hotfix workflow.

Create branches from the latest `develop` using:

```text
<type>/<short-description>
```

Allowed types: `feature`, `fix`, `refactor`, `chore`, `docs`, and `test`. Use lowercase kebab-case and keep the description concise.

Examples:

- `feature/admin-poi-management`
- `fix/tour-review-validation`
- `refactor/admin-navigation`
- `chore/update-dependencies`

Never force-push a shared branch, delete remote branches without authorization, or mix unrelated work into a branch. If updating a private feature branch requires a history rewrite, obtain team approval first.

## 16. Commit convention

Use Conventional Commits:

```text
<type>(<optional-scope>): <imperative summary>
```

Examples:

- `feat(admin): add user account details screen`
- `fix(auth): handle expired admin session`
- `refactor(tours): extract review decision panel`
- `chore(deps): update Next.js dependencies`
- `docs(readme): update local setup instructions`
- `test(users): add user management tests`

Keep commits focused and meaningful. Do not use messages such as `update`, `fix code`, `done`, `final`, `abc`, or `test123`.

## 17. Pull Requests and review

Every normal feature, fix, refactor, test, documentation, or maintenance change must be merged through a Pull Request into `develop`.

Each PR must explain:

- what changed and why;
- affected screens and routes;
- testing and validation performed;
- screenshots or recordings for visible UI changes;
- known limitations;
- the related task or issue, when available.

Keep PRs small enough to review and do not combine unrelated features.

Reviewers verify architecture, type safety, routing, responsiveness, accessibility, security, duplication, naming, error handling, testing, and scope compliance. Review code rather than personalities. A useful review comment identifies the issue, explains its impact, and states the expected improvement.

## 18. Validation and testing

Before opening or updating a normal PR, run:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

All commands must pass. Do not knowingly open a normal PR with failing checks unless the failure and explicit maintainer acceptance are documented.

No automated test runner or `npm test` script exists currently. When tests are introduced:

- add and document the canonical npm script;
- add focused tests for changed behavior;
- run the applicable tests before requesting review;
- never claim test coverage that was not executed.

For UI changes, also verify affected routes manually at relevant viewport sizes and exercise keyboard interaction.

## 19. Generated files and dependencies

Do not commit:

- `node_modules/`, `.next/`, `out/`, or `coverage/`;
- `*.tsbuildinfo`, logs, temporary files, or IDE caches;
- secrets or local environment files;
- generated artifacts that the repository does not intentionally version.

Use npm and commit `package-lock.json` whenever dependency changes modify it. Do not hand-edit the lock file.

## 20. Definition of Done

A task is done only when all applicable conditions are met:

- The requested requirement is implemented without unrelated scope.
- Correct route behavior exists and supports direct refresh.
- The code follows the approved architecture and naming rules.
- TypeScript, lint, build, and applicable tests pass.
- Loading, success, empty, and error states are considered.
- Responsive behavior and basic accessibility are checked.
- No secrets, generated artifacts, dead code, debug logging, or unrelated files are included.
- `README.md` and `.env.example` are updated when setup changes.
- The PR template is completed and a Pull Request targets the correct branch.
- Review feedback and required checks are resolved before merge.

"Works on my machine" is not sufficient evidence of completion.

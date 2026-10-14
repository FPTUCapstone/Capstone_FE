# Contributing to TripMate Frontend

TripMate Frontend contains the responsive Next.js Web application: the Public Website, supported Traveler and Tour Operator Web features, and the Administrator Web workspace. The exact Web boundary is defined by the latest approved SRS and [`docs/WEB_SCOPE_MATRIX.md`](docs/WEB_SCOPE_MATRIX.md). The separate Flutter application owns Mobile-only experiences; files under `src/legacy/mobile` are historical visual references, not platform-scope authority.

The canonical engineering guideline is [`docs/FRONTEND_ENGINEERING_CONVENTION.md`](docs/FRONTEND_ENGINEERING_CONVENTION.md). All contributors must read it before creating a Pull Request and follow its architecture, state/API, security, UI, testing, and review rules. It supersedes overlapping guidance in the historical [`docs/CODEBASE_RULES.md`](docs/CODEBASE_RULES.md); product authority remains the approved SRS and Web scope matrix. Proposed libraries require scoped adoption tasks and are not assumed installed.

## Local setup

Prerequisites: Node.js 20.9 or later and npm.

```bash
git clone https://github.com/FPTUCapstone/Capstone_FE.git
cd Capstone_FE
npm install
npm run dev
```

The development server runs at [http://localhost:3001](http://localhost:3001).

## Development workflow

1. Fetch the latest remote changes and update your local `develop` branch.
2. Create a focused branch from `develop` using `<type>/<short-description>`.
3. Verify the use case's platform classification in the approved SRS and Web scope matrix.
4. For a new visual Web screen, verify that an approved Web Screen Specification and reviewed UI exist. Stitch is optional for non-visual work or when maintainers approve proceeding without it.
5. Explore the source and contracts, clarify scope, and obtain approval for the specification and plan for non-trivial work. Implement only the assigned scope with behavioral tests first where applicable; review scope compliance and quality between tasks. Update documentation when behavior or setup changes. Coding agents also follow `AGENTS.md` and do not push, open PRs, or merge without developer direction.
6. Run the required validation commands.
7. Commit using Conventional Commits.
8. For human contributors, or coding agents after explicit developer direction, push the branch and open a Pull Request into `develop`.
9. Address review feedback before merge.

Do not infer platform ownership from a legacy component. Do not create Web equivalents of Mobile-only or system-triggered workflows without an updated approved SRS and screen specification.

Do not develop or push directly on `main`. `main` is the release branch. Normal feature, fix, refactor, documentation, test, and maintenance work is integrated through `develop`.

### Branch names

Allowed types are `feature`, `fix`, `refactor`, `chore`, `docs`, and `test`. Use lowercase kebab-case after the slash.

Examples:

- `feature/admin-user-management`
- `fix/tour-review-validation`
- `refactor/admin-navigation`
- `docs/codebase-rules`

## Commit messages

Use Conventional Commit style:

```text
<type>(<optional-scope>): <imperative summary>
```

Examples:

- `feat(admin): add user account details screen`
- `fix(auth): handle expired admin session`
- `refactor(tours): extract review decision panel`
- `docs(readme): update local setup instructions`

Avoid vague messages such as `update`, `fix code`, `done`, or `final`.

## Required validation

Run before opening or updating a Pull Request:

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run build
```

`npm test` runs the Node tests and Vitest suite using the configuration in `package.json`. CI uses `npm ci` and runs test, lint, typecheck, and build. Report baseline failures, environment limitations, and skipped checks honestly; the convention distinguishes these from regressions. For UI changes, also verify routes, responsive layouts, keyboard interaction, and applicable role/status states.

## Pull Requests

- Target `develop` unless maintainers explicitly direct otherwise.
- Keep one logical change per PR.
- Complete the repository PR template.
- Identify affected routes and screens.
- Include screenshots for visible UI changes.
- Report validation results and known limitations honestly.
- Never include secrets, generated artifacts, or unrelated changes.

A PR must be reviewable and must not be merged until required checks pass and review feedback is resolved.

# TRIPMATE WEB (FE) CLAUDE CODE INSTRUCTIONS (CLAUDE.md)

You are an expert Next.js frontend engineer operating under the **Superpowers / Obra** workflow on `tripmate-web`.
You prioritize correctness, scope discipline, and systematic verification over fast, unchecked coding.

---

## 1. Operating Instructions

- Read and follow `./AGENTS.md` as the authoritative source of truth for architectural constraints and workflow rules.
- Do not bypass the specification, planning, or verification phases.
- Screens for many use cases already exist in this repo. Before changing or adding a screen, inspect the existing implementation, `docs/WEB_SCOPE_MATRIX.md`, and the latest approved SRS — do not assume a use case is unimplemented or invent a new screen without an approved task.
- Strictly respect the platform boundaries documented in `AGENTS.md` (Server Components by default, feature-scoped code under `src/features/`, no invented state management or architecture layers).

---

## 2. Required Development Sequence

```text
Explore & Inspect Existing Code/Screens
  ↓
Clarify Ambiguity with Developer (Never guess requirements)
  ↓
Specification (specs/<TASK_ID>-spec.md)
  ↓
Wait for Developer Approval
  ↓
Isolated Workspace (new branch, clean baseline)
  ↓
Implementation Plan (plans/<TASK_ID>-plan.md)
  ↓
Wait for Developer Approval
  ↓
Atomic Execution & TDD, one task at a time
  ↓
Code Review Between Tasks (severity-based; Critical blocks progress)
  ↓
Local Verification (npm run lint && npm run typecheck && npm run build)
  ↓
Finishing the Branch (ask: merge / PR / keep / discard)
  ↓
Ready to Merge
```

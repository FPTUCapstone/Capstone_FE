# UC-09 Update Travel Preferences — Web Implementation Plan

Status: Updated 2026-10-13

1. Keep strict FE parsing and typed API payloads for five preferences only; remove legacy local-storage travel-style and budget-level code.
2. Remove `defaultBudgetVnd` from DTO types, API parsing, client validation, message mapping, form UI and tests.
3. Render the five optional preference groups with catalog-backed interest options and English display labels/error text, matching the shared Web/Mobile/backend catalogue, while retaining existing accessibility/dirty-state behavior.
4. Keep UC-10 request-level `budgetVnd` optional. Initialize it as blank, submit `null` when blank, and do not fetch a profile budget. Keep supported transport prefill only. This is an intentional, coordinated UC-10 boundary update in this PR.
5. Update component/API/type tests to prove no old fields are rendered or transmitted, and that a saved transport does not populate the scheduling budget.
6. Run lint, typecheck, focused tests and build before handoff.

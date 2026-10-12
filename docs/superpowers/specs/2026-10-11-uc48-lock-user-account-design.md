# UC-48 Lock User Account — Web Design

## Goal

Deliver the Administrator Web confirmation dialog and reason validation for UC-48 (Lock User Account), corresponding to Screen #08 (Lock Account Confirmation), without representing unavailable Backend lock operations as live mutations.

## Scope

- Platform: Next.js Web only (`ADMIN_WEB_ONLY`).
- Screen owned: Screen #08 Lock Account Confirmation.
- Accessible dialog semantics: focus trapping, Escape cancellation, automatic focus on open, reason clearing between sessions, trigger focus restoration on close, required non-whitespace reason before confirmation.
- Policy discipline (SRS V2 BR-117): locks are indefinite until explicitly unlocked by an Administrator via UC-49; temporary duration options are excluded.
- Emits `{ reason, category }` through confirmation callback without performing unverified backend calls.
- English copy backed by resource dictionary.

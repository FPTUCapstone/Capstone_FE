# UC-49 Unlock User Account — Web Design

## Goal

Deliver the Administrator Web confirmation dialog, lock history review context, and reason validation for UC-49 (Unlock User Account), corresponding to Screen #09 (Unlock Account Confirmation), without representing unavailable Backend unlock operations as live mutations.

## Scope

- Platform: Next.js Web only (`ADMIN_WEB_ONLY`).
- Screen owned: Screen #09 Unlock Account Confirmation.
- Accessible dialog semantics: focus trapping, Escape cancellation, automatic focus on open, reason clearing between sessions, required non-whitespace reason before confirmation.
- Lock history area (SRS 3.9.1.3): displays Lock Reason, Locked By, Locked Date so administrators have complete context before deciding to unlock.
- Presentational component architecture: emits intent through `onConfirm({ reason, category })` callback; deferred to future integration increment when backend unlock endpoint is merged into develop.
- English copy backed by resource dictionary with unlock-specific title, description, reason categories, notes placeholder, and confirm button text.

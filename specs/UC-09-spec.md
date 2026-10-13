# UC-09 Update Travel Preferences — Web Specification

Status: Draft v4 — 2026-10-13

## Scope

`/account/preferences` lets an authenticated Traveler view, replace and clear five optional preferences supplied by the backend: interests, preferred transport, travel pace, food preferences, and risk tolerance.

The screen does not render or submit travel style, budget level, auto-apply behavior or a default budget. Option keys are English backend values; labels are localized by feature resources.

## API and form behavior

The browser calls `GET /api/v1/traveler/preferences/options`, `GET /api/v1/traveler/preferences` and `PUT /api/v1/traveler/preferences` using the existing Traveler bearer-token pattern. Responses are strictly parsed; malformed responses show the generic failure state without creating plausible fallback data.

Save sends the full five-field state. Empty collections are `[]`; empty scalar choices are `null`. The backend is authoritative for option membership, ten-interest limit and `NoRestriction` food exclusivity. The form keeps selections on a validation/network failure, disables duplicate submits, warns before losing dirty changes, and provides accessible labels, live feedback and keyboard controls.

## UC-10 boundary

Budget is optional on every scheduling request (`budgetVnd: null` when unselected). It is selected in `CreateSchedulingRequestForm`, is not loaded from UC-09, and is not prefilled from profile data. UC-09 may prefill only supported `preferredTransportMode`; travel pace has no hidden mapping to availability or rest preference.

## Acceptance criteria

1. The preference page renders exactly five preference dimensions and no legacy travel-style or profile-budget control.
2. GET and PUT payloads contain no `defaultBudgetVnd`, `travelStyle`, `budgetLevel` or `autoApplyToPlans`.
3. Scheduling starts with blank optional budget, submits `null` when left blank, and retains all existing request-level budget validation.
4. No preference data is read from or written to browser storage.
5. Session, permission, validation, empty and responsive states remain covered by tests.

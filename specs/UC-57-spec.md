# UC-57 Configure Algorithm Parameters — approved four-parameter scope

User approved implementation of four algorithm parameters on 2026-09-21. This supersedes the draft pending status, not the contradictory eleven-parameter SRS section.

## Contract and acceptance
- Administrator Web route: `/admin/settings/algorithm-parameters`, linked from shared Admin navigation.
- GET/PUT `/api/v1/admin/system-configs/algorithm-parameters`; bare DTO: bufferTimeMinutes (integer 5..60), defaultTravelSpeedKmh (finite number 10..120), reroutingSearchRadiusKm (finite number 1..50), weatherAlertThresholdSeverity (Moderate/Severe/Extreme), `updatedAtUtc: string | null`, and `updatedAtLocal: string | null`. Both timestamps are null when no managed DB row exists. PUT sends only four editable properties.
- Severity input is matched case-insensitively by the backend and normalized to `Moderate`, `Severe`, or `Extreme` in successful responses. The UI sends one of these canonical values.
- Read current values before editing; no seeded fallback masquerading as server data. Defaults are 15/30/5/Severe but no restore-default action in this scope.
- Shared useWebSession restores the approved Web session; AuthStorage supplies an in-memory bearer token. Never read tokens from localStorage or modify login implementation. Non-Admin cannot load/edit; BE remains authorization authority.
- Invalid local values display locked MSG118 next to fields. A bound request that violates semantic rules returns 422; malformed or type-incompatible JSON is rejected by backend model binding as 400. The UI preserves input and displays MSG118 for either status. 401 redirects to admin login with returnUrl; 403 displays MSG126 and prevents further editing; server/network/malformed response uses MSG127. Only a valid successful response displays MSG117.
- Save pending disables duplicate submissions and editing. Cancel restores last loaded/saved values. Failure preserves inputs. Retry available on load failure. Show timestamps without claiming versioning or scheduled activation.
- Remaining four SystemConfigs keys, financial policies, login, algorithms, defaults reset and configuration versioning are outside scope. BE owns atomic persistence and audit MSG119.

## Screen specification
Use existing AdminConsoleLayout, TextField, ActionButton and FeedbackAlert. Responsive centered max-width form: title/description, grouped parameter fields in one column at mobile and two at desktop, weather select, last updated, Cancel and Save actions. Labels include units and help includes range. Loading uses a status; errors use alert; successful save uses status. Visible keyboard focus and no horizontal page overflow at 320px.

## Integration limits
Admin login owner is migrating its legacy session flow separately. UC-57 integrates the shared Web memory-session contract; do not claim end-to-end login verified until that owner finishes. Algorithm consumption of saved configuration is a separately verified BE/service dependency.

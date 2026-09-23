# UC-57 Configure Algorithm Parameters — approved four-parameter scope

User approved implementation of four algorithm parameters on 2026-09-21. This supersedes the draft pending status, not the contradictory eleven-parameter SRS section.

## Contract and acceptance
- Administrator Web route: `/admin/settings/algorithm-parameters`, linked from shared Admin navigation.
- GET/PUT `/api/v1/admin/system-configs/algorithm-parameters`; bare DTO: bufferTimeMinutes (integer 5..60), defaultTravelSpeedKmh (finite number 10..120), reroutingSearchRadiusKm (finite number 1..50), weatherAlertThresholdSeverity (Moderate/Severe/Extreme), `updatedAtUtc: string | null`, and `updatedAtLocal: string | null`. Both timestamps are null when no managed DB row exists. PUT sends only four editable properties.
- Severity input is matched case-insensitively by the backend and normalized to `Moderate`, `Severe`, or `Extreme` in successful responses. The UI sends one of these canonical values.
- Read current values before editing; no seeded fallback masquerading as server data. Defaults are 15/30/5/Severe but no restore-default action in this scope.
- Administrator session uses the existing admin cookie/server-proxy contract (amended 2026-09-23 per leader review): AdminSignInForm signs in through `/api/admin/session`, which keeps the access token in the HttpOnly `tripmate_admin_access_token` cookie. UC-57 calls a same-origin proxy route `GET/PUT /api/admin/system-configs/algorithm-parameters` (server-only handler under `src/features/admin/algorithm-config/algorithmConfigProxy.ts`) that forwards the cookie bearer to the BE path above with same-origin and JSON validation, mirroring the UC-52 POI proxy. The browser never reads, stores, or sends a bearer token; `AuthStorage` is not consulted and no login implementation changes. 401/403 upstream clear the admin session cookie. Non-Admin cannot load/edit; BE remains authorization authority.
- Invalid local values display locked MSG118 next to fields. A bound request that violates semantic rules returns 422; malformed or type-incompatible JSON is rejected by backend model binding as 400. The UI preserves input and displays MSG118 for either status. 401 redirects to admin login with returnUrl; 403 displays MSG126 and prevents further editing; server/network/malformed response uses MSG127. Only a valid successful response displays MSG117.
- Save pending disables duplicate submissions and editing. Cancel restores last loaded/saved values. Failure preserves inputs. Retry available on load failure. Show timestamps without claiming versioning or scheduled activation.
- Remaining four SystemConfigs keys, financial policies, login, algorithms, defaults reset and configuration versioning are outside scope. BE owns atomic persistence and audit MSG119.

## Screen specification
Use existing AdminConsoleLayout, TextField, ActionButton and FeedbackAlert. Responsive centered max-width form: title/description, grouped parameter fields in one column at mobile and two at desktop, weather select, last updated, Cancel and Save actions. Labels include units and help includes range. Loading uses a status; errors use alert; successful save uses status. Visible keyboard focus and no horizontal page overflow at 320px.

## Integration limits
Admin login itself is owned separately; UC-57 consumes its session cookie and must not change sign-in behavior. The FE test suite covers the login-session → proxy → GET/PUT chain at the route-handler and service level (cookie forwarding, origin checks, 401/403 cookie clearing); a live browser pass against a running BE remains required before claiming end-to-end verification. Algorithm consumption of saved configuration is a separately verified BE/service dependency.

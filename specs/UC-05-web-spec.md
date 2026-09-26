# UC-05 Web — Sign Out Specification

Date: 2026-09-17. Status: **APPROVED FOR PLANNING** — this remains the approved functional specification; see the implementation-status note below. Developer decisions D1–D5 resolved 2026-09-17 (see §14 Decision Log); no open decisions remain.

Implementation status (2026-09-17): UC-05 Web sign out is implemented on branch `feature/PhucTV-sign-out-web` per the approved plan T01–T07 (T05 error mapper not required; T06 restore/regression verified through existing coverage). Production changes are limited to `src/lib/authApi.ts` (`webLogout()`) and `src/components/navigation/PublicNavigation.tsx`; tests are the new `src/features/auth/session/webLogout.test.ts` plus the extended `src/components/navigation/PublicNavigation.test.tsx`. Local evidence: 276 FE tests passed / 0 failed / 0 skipped (baseline 263 preserved), focused UC-05 33 passed, lint 0 errors (3 pre-existing unrelated warnings), typecheck and production build PASS. An independent BE + FE cross-review verified the FE↔BE contract, security constraints and scope; the one blocking item it raised (CROSS-01: SRS §3.2.5 BR-13 vs D1) was resolved by recording an explicit, developer-approved deviation as described in §4.2 and §14, with no code change. Real-browser sign-out smoke against the running backend was performed by the developer for both success and failure paths and reviewed for consistency with the implementation and the FE↔BE contract. Success path: `POST /api/v1/auth/web/logout` → HTTP 200 `{"message":"Signed out successfully."}`, navbar became Guest, backend `Set-Cookie` cleared/expired `tripmate_refresh`, the current page was unchanged, F5 remained unauthenticated, and `POST /api/v1/auth/web/refresh` returned 401 with `errorCode = AUTH_TOKEN_INVALID`. Failure path: with the backend unavailable the request failed with `ERR_CONNECTION_REFUSED`, the authenticated UI and the refresh cookie remained, the exact approved copy `Chưa thể hoàn tất việc kết thúc phiên đăng nhập. Vui lòng thử lại.` appeared, logout stayed retryable, and retry after the backend was restored transitioned the UI to Guest. This is **DEVELOPER MANUAL EVIDENCE — REVIEWED**: it was not independently reproduced by the reviewer (**INDEPENDENT REVIEWER REPRODUCTION: NO**). No additional manual confirmation is required for the current UC-05 delivery gate.

Naming: `specs/UC-05-web-spec.md`, matching the repository convention (`UC-01-web-spec.md`, `UC-04-web-spec.md`) — approved as decision D5.

Backend reference: UC-05 BE Sign Out is FINAL PASS. The provisional `POST /api/v1/auth/web/sign-out` row in `specs/UC-04-web-spec.md` §9 is superseded by the FINAL route below. FE task code referenced by UC-04 notes as "D02" (server-side sign-out integration) is satisfied by this UC.

## 1. Scope

**In scope**

- New Web API function `webLogout()` for `POST /api/v1/auth/web/logout` following the existing `webSignIn`/`webRefresh` client pattern in `src/lib/authApi.ts`.
- Rewiring the existing `handleSignOut` in `PublicNavigation.tsx` (currently a UC-04 placeholder that only clears local state) to call that API, clearing local state **only after HTTP 200** (D1).
- Local state cleanup via the existing `AuthStorage.clear()` — no second cleanup mechanism.
- Staying on the current page after success; no navigation calls (D2).
- Loading/duplicate-click protection on the "Đăng xuất" button following existing conventions.
- Navbar-local inline error feedback with the approved copy on logout failure (D4).
- Unit/component tests per §12.

**Out of scope**

- Any change to UC-04 sign-in, refresh, restore, or route-guard behavior (`useWebSession`, `WebSessionProvider`, `PartnerRouteGuard`, `partnerRouteDecision` are consumers, not modification targets).
- The legacy Admin POI console session (`app/api/admin/session` route handler, `signOutAdmin`, `CreatePoiPage.signOut` against `/api/admin/session` DELETE) — a separate server-side Next session architecture calling the legacy mobile `/api/v1/auth/login`; not the UC-04 Web session. It keeps its own behavior unless a separate task is approved.
- `AdminNavigation`'s "Login placeholder" link (routes to `/admin/login`; it is not a sign-out action).
- Confirmation dialog / modal / any new component for sign-out (D3 — deferred enhancement, see §14).
- Backend changes of any kind; cookie attribute changes; token blacklisting (see §11).
- Mobile sign-out.
- Multi-tab sign-out broadcast (deferred in UC-04 §6.9; single-tab behavior only).
- Any new logout route/page or new UX framework.

## 2. Current Architecture / Recon Findings

These recon findings were originally verified on `feature/PhucTV-sign-in-web` during specification drafting and were re-verified as applicable before implementation on `feature/PhucTV-sign-out-web`. Preserved from the approved draft; unaffected by D1–D5.

| Concern | Actual mechanism (file) |
| --- | --- |
| Auth state | `AuthStorage` module singleton in `src/features/auth/session/authSession.ts`: in-memory `WebAuthContext \| null` + `subscribe/notify` pub-sub. React binding: `useWebSession()` (`src/features/auth/session/useWebSession.ts`) via `useSyncExternalStore`, exposing `status: 'restoring' \| 'authenticated' \| 'unauthenticated'`. |
| Access token storage | **Memory only**, inside `AuthStorage` (`getAccessToken()`, validated against `accessTokenExpiresAtUtc`). Never written to localStorage/sessionStorage/cookie by the Web session. Legacy `tripmate_access_token`/`tripmate_refresh_token` keys are actively *removed* by `AuthStorage.accept`/`clear`. |
| Current-user data | In-memory `WebAuthContext`; non-credential display metadata persisted as `tripmate_user` (localStorage when Keep me signed in, else sessionStorage) — presentation cache only, explicitly never restores authentication (tested in `PublicNavigation.test.tsx`). |
| Refresh mechanism | `webRefresh()` in `src/lib/authApi.ts`: `POST ${API_BASE}/auth/web/refresh`, `credentials: 'include'`, no body. Cold-start restore is single-flight per document (`restoreOnce` in `useWebSession.ts`), mounted once via `WebSessionProvider` in `app/layout.tsx`. |
| API client | Plain `fetch` in `src/lib/authApi.ts`, `API_BASE = NEXT_PUBLIC_API_URL ?? http://localhost:5000/api/v1`. No Axios. All Web auth calls use `credentials: 'include'`. |
| Server-state library | **None.** No React Query / TanStack Query / SWR / Zustand / Redux in `package.json`. The only "cache" is the `tripmate_user` display metadata above. |
| Logout UI | "Đăng xuất" button in `src/components/navigation/PublicNavigation.tsx` (rendered only when `status === 'authenticated'`). `PublicNavigation` is rendered only by `LandingPage` (`src/features/public/landing/LandingPage.tsx`) → route `/`. No Partner or Admin screen renders a Web-session logout button today. |
| Current handler | `handleSignOut()` — calls `AuthStorage.clear()` only; its comment states server-side revocation "belongs to UC-05". This spec replaces that body. |
| Navigation conventions | `ROUTES` const (`src/lib/routes.ts`); `next/link` for anchors; `router.push()` after successful auth (`SignInForm.tsx`); `router.replace()` on guard deny (`PartnerRouteGuard.tsx`) and on legacy admin sign-out (`CreatePoiPage.tsx`). |
| Error conventions | Scoped mappers in `src/lib/authErrorMapper.ts` (`mapPasswordSignInError`, `mapGoogleSignInError`, `mapWebRecoveryError`) returning exact allow-listed copy; UI via `FeedbackAlert` (tone `error/success/info`) inside forms. Network failure convention: `TypeError` → connection copy; 5xx → service-unavailable copy. The navbar currently has **no** feedback surface — D4 adds a minimal inline one. |
| Loading conventions | `loading` state + `if (loading) return` guard + `ActionButton loading` prop (`SignInForm.tsx`); `CreatePoiPage` uses an `inFlight` ref + `signingOut` state for its sign-out. |
| Tests | Vitest + jsdom + @testing-library/react (`vitest.config.mts`, `vitest.setup.ts`); `npm test` also runs `tests/*.test.cjs` (node --test, POI only). Existing reusable suites: `PublicNavigation.test.tsx` (includes a warm-session sign-out settle test), `webRefresh.test.ts` (fetch-stub API test pattern via `vi.stubGlobal('fetch')`), `webSignIn.test.ts`, `authSession.test.ts`, `useWebSession.test.tsx`, `WebSessionProvider.test.tsx`. |

Post-logout restore nuance (verified): after a successful logout plus `AuthStorage.clear()`, a *remount* of any `useWebSession` consumer (client-side navigation or F5) starts a new `restoreOnce()` → `webRefresh()`. The cookie is revoked/cleared by then, so this settles 401 → unauthenticated (one harmless request). Under the approved session-preserving failure policy (D1) local state is only ever cleared after the server has confirmed revocation, so there is no window in which a still-valid cookie can silently re-authenticate a locally-signed-out user: local UI always mirrors the real remote session.

## 3. Backend Contract (FINAL — supplied by developer; unchanged)

```
POST /api/v1/auth/web/logout
Request body: NONE
Credentials: HttpOnly cookie tripmate_refresh (browser sends it automatically
             because the FE client uses credentials: 'include')
```

- Success: `HTTP 200` with direct DTO `{"message":"Signed out successfully."}` — **not** the `ApiResponse` envelope used by login/refresh. The FE client must therefore treat the HTTP status (200) as success and must NOT require `success === true` parsing. The `message` field is informational; a missing/non-JSON body on a 200 must not fail the logout.
- Backend revokes the current refresh session and clears the `tripmate_refresh` cookie.
- Idempotent: missing cookie still returns 200.
- Unexpected persistence/infrastructure failure: `HTTP 500` ProblemDetails.
- The already-issued access JWT is NOT blacklisted and remains valid until natural expiry (~15 min).
- After successful logout, `POST /api/v1/auth/web/refresh` → 401 `AUTH_TOKEN_INVALID`.
- FE must never read `tripmate_refresh` (HttpOnly).

## 4. Functional Flow (LOCKED)

### 4.1 Success flow

1. Authenticated user clicks "Đăng xuất" in `PublicNavigation` (button visible only when `status === 'authenticated'`).
2. Duplicate/in-flight guard prevents a second request (§8).
3. UI enters a local logout-loading state (§8).
4. FE calls `webLogout()`: `POST /api/v1/auth/web/logout`, `credentials: 'include'`, no body, no Authorization requirement, no refreshToken field (§10).
5. On `HTTP 200`:
   - call `AuthStorage.clear()` (§5);
   - the access token disappears from memory;
   - `tripmate_user` is removed from localStorage and sessionStorage;
   - legacy token keys are removed by the existing `AuthStorage.clear()`;
   - the navbar immediately renders Guest through the existing `subscribe`/`notify` → `useSyncExternalStore` path — no full page reload, no `restoring` limbo;
   - remain on the current page (D2): no `router.push()`, no `router.replace()`, no `router.refresh()`, no reload;
   - clear any visible logout error from a previous failed attempt;
   - exit the loading state.
6. The browser/server handles HttpOnly cookie expiry via the backend `Set-Cookie`.
7. No page reload or navigation is required.

### 4.2 Failure flow (LOCKED — D1 session-preserving)

1. The request throws a network error OR returns a non-success status such as 500.
2. DO NOT call `AuthStorage.clear()`.
3. The current authenticated context remains fully intact (memory + metadata).
4. Show the approved safe inline error near the logout control (D4, §9).
5. Exit the loading state.
6. The logout button becomes available again; retry issues a new request.
7. Do not navigate.
8. Never claim that logout succeeded.

Rationale (documented per approval): if backend logout fails, the HttpOnly refresh cookie may still be valid. If FE cleared local auth state anyway, the next cold restore/remount/F5 would call `webRefresh()` and silently re-authenticate the user. Local UI must remain consistent with the real remote session. No "best effort fake logout".

Source deviation (developer-approved 2026-09-17): SRS Report 3 §3.2.5 **BR-13** requires the client to clear local session data *even when the server-side invalidation cannot be completed*. UC-05 Web intentionally supersedes that rule with **D1** (session-preserving failure behavior). Reason: after a failed logout request the HttpOnly `tripmate_refresh` cookie and its refresh session may still be valid, so a local-only clear could let silent re-authentication return during cold restore/F5 — the client would then contradict the real remote session. No code change is required in either repository; the SRS wording reconciliation is deferred. Mirror records of this deviation: `Capstone_BE/specs/UC-05-spec.md` §5 (BR-13) and §16 compliance matrix, and `Capstone_BE/plans/UC-05-plan.md` §2.2.

## 5. State Management (LOCKED — success only)

- `AuthStorage.clear()` is called **only after `webLogout()` resolves with HTTP 200** (D1). It is the single cleanup mechanism; no second cleanup path is introduced.
- `AuthStorage.clear()` already handles all of the following (verified in `authSession.ts`; the spec requires nothing beyond calling it):
  - in-memory `WebAuthContext` → `null`;
  - access token removed from memory;
  - `tripmate_user` removed from localStorage;
  - `tripmate_user` removed from sessionStorage;
  - legacy `tripmate_access_token` removed;
  - legacy `tripmate_refresh_token` removed.
- No other FE state participates in authentication (verified: no React Query cache, no context provider holding auth, Firebase auth state is not a Web session source since the UC-04 integration note).
- On failure, none of the above runs — the authenticated context is retained untouched.

## 6. Cache Management

Confirmed by recon: the only FE-side cache is the `tripmate_user` presentation metadata (removed by `clear()` on success). There are no query keys to invalidate (no TanStack Query / SWR). Do **not** add `router.refresh()` solely to update the navbar — `useSyncExternalStore` + `notify()` already updates it without a reload.

## 7. Navigation (LOCKED — D2: stay on current page)

- On successful logout the user stays on the current page: **no `router.push()`, no `router.replace()`, no `router.refresh()`, no full page reload.**
- Rationale: the only logout button today lives on `/` (public landing), which remains valid for unauthenticated users; the navbar already reacts to `AuthStorage` changes through `useSyncExternalStore`.
- Protected routes remain the responsibility of the existing route guards (`PartnerRouteGuard` deny matrix) and are out of scope.
- On failure: no navigation either (§4.2).

## 8. Loading / Duplicate Submission (LOCKED)

- A local sign-out in-flight state guards the handler.
- While in flight, a second click does NOT send another request.
- The logout button is disabled/busy during flight.
- The loading state clears on both success and failure.
- The endpoint is idempotent, but FE still avoids duplicate intent (one request per user intent).
- No global mutex. Implementation may use either the repo's `loading`-state guard or an `inFlight` ref (both conventions already exist — `SignInForm.tsx` / `CreatePoiPage.tsx`); the implementation plan picks one; no additional architecture is prescribed here.

## 9. Error Handling (LOCKED — D1 + D4)

- Approved user-facing copy for logout failure (network error and unexpected backend 5xx alike):

  > `Chưa thể hoàn tất việc kết thúc phiên đăng nhập. Vui lòng thử lại.`

- Presentation: minimal navbar-local inline feedback **near the existing logout control**. No global toast framework, no new feedback architecture. Existing auth error conventions (scoped mapper returning exact allow-listed copy) are reused where practical; if a scoped mapping function is warranted, it is introduced explicitly in the implementation plan — not invented here.
- On failure the session remains locally authenticated; the logout control becomes available again; retry is allowed.
- Known existing auth error categories such as 429 (if ever emitted by this endpoint) use the existing safe rate-limit convention.
- Never render raw backend ProblemDetails `detail`, exception text, token, cookie, or Authorization header content.
- Success clears any visible logout error from a previous failed attempt (§4.1 step 5).

## 10. API Requirements (LOCKED)

- New function `webLogout()` in `src/lib/authApi.ts`, following the `webRefresh` shape:

  ```ts
  fetch(`${API_BASE}/auth/web/logout`, { method: 'POST', credentials: 'include' })
  ```

- **No request body.** No `Content-Type` header solely for an empty request. No `refreshToken` parameter or field anywhere. No Authorization header added specifically for logout.
- Success is determined by successful HTTP status: HTTP 200 with the direct DTO is valid, and a 200 with an empty/non-JSON body must NOT make the logout fail (do not run the envelope parser's `success === true` gate on this endpoint).
- Non-2xx maps to the existing safe `ApiError` convention; a network throw maps to the existing NETWORK-style error convention (`{ code: 'NETWORK', status: 0 }`-style, as in `webRefresh`) so existing mapper patterns work unchanged.
- Preserve credential/cookie policy: `credentials: 'include'` exactly like the other Web auth calls.
- Never touch `document.cookie`.

## 11. Security Requirements (unchanged)

- Never expose the refresh token to JavaScript; never read `tripmate_refresh` via `document.cookie`; never copy it into storage.
- Never send a refresh token in the logout body (body is empty).
- Never log access/refresh credentials, cookie values, or full request headers in errors/console.
- Do not attempt manual HttpOnly cookie deletion from JS (server owns `Set-Cookie` expiry).
- Do not add token-blacklist assumptions; do not treat the old access JWT as immediately invalid server-side — FE simply discards it from memory on success, and no FE behavior or documentation may claim server-side access invalidation at logout time.
- Logout is POST (session-changing), consistent with the approved Web auth convention.

## 12. Test Matrix (FINAL)

Stack: Vitest + jsdom + @testing-library/react; API-level tests stub `global.fetch` (`vi.stubGlobal('fetch')`, pattern in `webRefresh.test.ts`); component tests mock `@/lib/authApi` (pattern in `PublicNavigation.test.tsx`). All conditional branches resolved per D1–D5.

| ID | Scenario | Expected (final) |
| --- | --- | --- |
| TC-FE-01 | Authenticated user clicks "Đăng xuất" | `webLogout` called **exactly once**. API-level assertion on the real function: `POST /api/v1/auth/web/logout`, `credentials: 'include'`. |
| TC-FE-02 | Successful HTTP 200 logout | `AuthStorage.clear()` occurs (only after 200). Navbar changes from authenticated UI to Guest UI. No `restoring` limbo, no full reload. |
| TC-FE-03 | Successful logout clears local presentation/session state | `tripmate_user` removed from BOTH localStorage and sessionStorage; legacy token-storage keys remain cleaned through `AuthStorage.clear()`. |
| TC-FE-04 | Navigation after success | **Stay on current page.** Assert: no `router.push()`, no `router.replace()`, no full reload solely for logout. |
| TC-FE-05 | Request carries no refresh credential body | `body === undefined`; no `refreshToken` property; no Authorization header introduced specifically for logout. |
| TC-FE-06 | Cookie credential handling | `credentials === 'include'`; no `document.cookie` access. |
| TC-FE-07 | Repeated / already-logged-out behavior | API level: 200 (incl. missing cookie) remains accepted — idempotent, no throw. Component level: after a successful local clear, the authenticated-only logout button is no longer rendered. |
| TC-FE-08 | Duplicate click while request pending | Only ONE logout request fired; button disabled/busy; state settles correctly after the promise resolves or rejects. |
| TC-FE-09 | Network / backend logout failure | **Session-preserving**: `AuthStorage.clear()` NOT called; authenticated state retained; user remains visually authenticated; approved safe inline error shown; logout button available again; retry can issue a new request; no navigation. Coverage must include a network error and a representative 500/server failure, without duplication if the test architecture permits. |
| TC-FE-10 | Secret exposure regression | No refresh token reaches JS-owned storage; no refresh token in any request body; no token/cookie value in UI errors; no console secret logging introduced. |
| TC-FE-11 | Post-success cold restore | After successful logout, a new restore / F5 path with mocked `webRefresh` → 401 `AUTH_TOKEN_INVALID` settles unauthenticated: no re-authentication, no stuck `restoring`. |
| TC-FE-12 | Access-JWT architecture regression (assert-by-review) | FE discards the access token locally after success, but no frontend behavior or documentation claims the old JWT was blacklisted server-side immediately. |

## 13. Definition of Done

- `npm run lint`, `npm run typecheck`, `npm run build` all pass.
- Full applicable FE suite passes: `npm test` (node --test POI files + vitest suites), including the new UC-05 cases; **existing UC-04 authentication tests remain green**.
- No unrelated changes; no refresh token exposed to JS; UC-04 implementation files untouched except the approved integration points (`authApi.ts` addition, `PublicNavigation.tsx` handler rewire) plus, if planned, scoped mapper copy in `authErrorMapper.ts`.
- Manual browser smoke test against the real backend (success path):
  sign in → authenticated navbar → click "Đăng xuất" → `POST /api/v1/auth/web/logout` = 200 → `tripmate_refresh` removed by backend `Set-Cookie` → navbar immediately becomes Guest → stay on current page → F5 remains unauthenticated → `POST /api/v1/auth/web/refresh` returns 401 `AUTH_TOKEN_INVALID`.
- Failure-path manual smoke if practical: simulate backend unavailability → click logout → authenticated UI remains → safe error appears → retry available.
- Explicitly reported, not silently skipped, if live BE/Firebase is unavailable.

## 14. Decision Log (all RESOLVED 2026-09-17)

| ID | Decision | Resolution |
| --- | --- | --- |
| D1 — Logout failure policy | **RESOLVED — Session-preserving.** Clear `AuthStorage` only after HTTP 200. On network error or non-2xx (e.g. 500): do not clear, keep authenticated state, show safe error, re-enable the logout control, allow retry, never claim success. Local UI stays consistent with the real remote session; no best-effort fake logout. |
| D2 — Post-logout navigation | **RESOLVED — Stay on current page.** No `router.push()`, no `router.replace()`, no `router.refresh()`, no full page reload. The navbar reacts through the existing subscribe/notify mechanism. Protected routes remain the route guards' responsibility (out of scope). |
| D3 — Confirmation dialog | **RESOLVED — No confirmation dialog for UC-05 MVP.** Keep the existing direct "Đăng xuất" button; no modal, confirmation component/state, extra route/page, or new UX framework. This is a developer-approved MVP deviation / deferred enhancement relative to the `docs/WEB_SCOPE_MATRIX.md` UC-05 row (R3 §3.2.5 "Account action plus confirmation dialog") full-product expectation — that requirement is deliberately deferred, not deleted, and remains recorded here and in the scope matrix. |
| D4 — Error surface | **RESOLVED — Navbar-local inline safe error.** Approved copy: `Chưa thể hoàn tất việc kết thúc phiên đăng nhập. Vui lòng thử lại.` Displayed near the existing logout control; no global toast framework; no new feedback architecture; no raw ProblemDetails detail, token, cookie, or header content exposed; user remains authenticated after failure; logout control becomes available again; retry allowed. |
| D5 — Spec file name | **RESOLVED — `specs/UC-05-web-spec.md`**, matching repository convention (`UC-01-web-spec.md`, `UC-04-web-spec.md`). Not renamed to `UC-05-FE-spec.md`. |

**Source-deviation cross-reference:** the D1 entry above deliberately supersedes SRS Report 3 §3.2.5 **BR-13** ("the local session data and the stored tokens must always be cleared on the client, even when the server-side invalidation cannot be completed") for the UC-05 Web flow. Developer-approved 2026-09-17; no code change is required in either repository; SRS reconciliation is deferred. Mirror records: `Capstone_BE/specs/UC-05-spec.md` §5 (BR-13 note) and §16 compliance matrix, `Capstone_BE/plans/UC-05-plan.md` §2.2.

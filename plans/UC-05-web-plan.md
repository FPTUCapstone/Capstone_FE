# UC-05 Web Sign Out Implementation Plan

## Status
APPROVED FOR IMPLEMENTATION (plan content approved by developer; baseline evidence recorded 2026-09-17 — see Baseline Record)

## Inputs

| Input | Value |
| --- | --- |
| Specification | `specs/UC-05-web-spec.md` — status APPROVED FOR PLANNING (D1–D5 final) |
| Branch | `feature/PhucTV-sign-out-web` (verified current; matches `<type>/<member>-<description>` rule) |
| Base / worktree | D:\FPTUCapstone\Capstone_FE; working tree clean except untracked `specs/UC-05-web-spec.md` |
| Backend dependency | UC-05 BE FINAL PASS: `POST /api/v1/auth/web/logout` (direct-DTO 200, idempotent, ProblemDetails 500) |
| Rules | `D:\FPTUCapstone\TEAM_ENGINEERING_RULES.docx` v2.0; `D:\FPTUCapstone\Dev_and_CrossReview_Checklist.docx` v2.0 |
| Baseline | See Baseline Record below |

## Mandatory Rules Review Summary

Both mandatory documents were read in full (extracted text, 413 + 298 lines). Applicable-rule checklist internalized for this plan:

- **Workflow (rules §6)**: spec → workspace+baseline → plan → TDD+self-review → verify → cross-review; plan must fit the approved spec and must not create empty layers/files to satisfy a diagram. This plan touches 2 production files + 2 test files only.
- **Impact-based testing (rules §7)**: sign-out is a Write/auth-level change → unit + component tests + real-browser flow required (not just green suites).
- **Web architecture (rules §8)**: logic per feature, API access only through the existing layer (`src/lib/authApi.ts`); no raw fetch in components; no new framework/global store; clean diff (no debug prints/unused imports); DRY only for genuinely identical concepts.
- **Response contract (rules §9)**: success DTO trực tiếp / failure ProblemDetails — matches the UC-05 logout contract (200 direct DTO; 500 ProblemDetails). FE success must NOT parse the legacy `{success,data}` envelope for this endpoint.
- **State-before-implement (rules §16 / U05)**: initial / loading / success / error states defined below; no false success on network/500; double submit blocked; retry reuses the same intent.
- **Evidence (rules §20)**: every run records command, head SHA, exit code, pass/fail/skip; "Chưa kiểm tra" is not pass.
- **Commands (rules §19, Web)**: `npm ci` (env already installed), `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- **Conflict check**: NONE. The two rule documents, `specs/UC-05-web-spec.md`, the task prompt and the current source architecture are mutually compatible (direct-DTO success rule §9 explicitly supports the approved logout contract; U05 double-submit/no-false-success maps exactly to D1 session-preserving). No BLOCKED condition.

## Locked Decisions D1–D5 (from spec §14 — FINAL)

| ID | Locked decision |
| --- | --- |
| D1 | Session-preserving: `AuthStorage.clear()` ONLY after HTTP 200. On network error / non-2xx: keep authenticated state, show safe error, re-enable button, allow retry, never claim success. |
| D2 | Stay on current page: no `router.push()`, `router.replace()`, `router.refresh()`, no reload. |
| D3 | No confirmation dialog for MVP (deferred enhancement vs WEB_SCOPE_MATRIX R3 §3.2.5 — documented, not deleted). |
| D4 | Navbar-local inline error, exact copy `Chưa thể hoàn tất việc kết thúc phiên đăng nhập. Vui lòng thử lại.` |
| D5 | Spec file `specs/UC-05-web-spec.md`. |

## Current Architecture (verified on branch, unchanged from spec §2)

- `AuthStorage` singleton (`src/features/auth/session/authSession.ts`): memory-only `WebAuthContext`, `subscribe/notify`, `clear()` removes memory context + `tripmate_user` + legacy `tripmate_access_token`/`tripmate_refresh_token` from BOTH storages.
- `useWebSession()` (`useSyncExternalStore`) exposes `restoring|authenticated|unauthenticated`; `WebSessionProvider` mounted once in `app/layout.tsx`; single-flight cold restore via `webRefresh()`.
- API layer: plain `fetch` in `src/lib/authApi.ts`; all web auth calls `credentials: 'include'`; network failures in `webRefresh` map to `{ code: 'NETWORK', status: 0 }`-style `ApiError`; non-2xx goes through `handleResponse` → `ApiError` (ProblemDetails `errorCode` passthrough).
- Logout UI: "Đăng xuất" button in `src/components/navigation/PublicNavigation.tsx` rendered only when `status === 'authenticated'`; current `handleSignOut()` = `AuthStorage.clear()` only (UC-04 placeholder to replace). Navbar rendered only on `/` via `LandingPage`.
- No React Query/SWR/Zustand/Redux; no toast system. Error UI convention: `FeedbackAlert` (`src/components/ui/FeedbackAlert.tsx`, `role="alert"` when tone=error, allow-listed copy only). Loading convention: local state + early-return guard + disabled control (`SignInForm.tsx`).
- Test conventions: API tests stub `global.fetch` (`webRefresh.test.ts`, `webSignIn.test.ts` in `src/features/auth/session/`); component tests mock `@/lib/authApi` and drive `AuthStorage` directly (`PublicNavigation.test.tsx`).

## Planned File Footprint (smallest repo-consistent)

| File | Change | Why |
| --- | --- | --- |
| `src/lib/authApi.ts` | ADD `webLogout()` (+ JSDoc). ~15 lines. | Existing web auth API layer; no new file needed. |
| `src/components/navigation/PublicNavigation.tsx` | REWIRE `handleSignOut` (call `webLogout` → clear on 200 only), ADD `signingOut`/`signOutError` state, disabled button, inline error row. | The one approved UI integration point. |
| `src/features/auth/session/webLogout.test.ts` | NEW test file (API level). | Follows `webRefresh.test.ts`/`webSignIn.test.ts` location + pattern; a separate file keeps the suite focused and mirrors existing naming. |
| `src/components/navigation/PublicNavigation.test.tsx` | EXTEND with a UC-05 describe block; extend the existing `vi.mock('@/lib/authApi')` factory to also mock `webLogout`. | Reuse existing suite/mocks; no parallel file. |

NOT modified (verified unnecessary): `authSession.ts`, `useWebSession.ts`, `WebSessionProvider.tsx`, route guards, `src/lib/authErrorMapper.ts` (T05 NOT REQUIRED — see T05), `app/`, `package.json`, backend, other specs/plans/docs.

## Design decisions required by the task

- **Loading/duplicate mechanism — OPTION A: local React state guard.** `const [signingOut, setSigningOut] = useState(false)` + `if (signingOut) return` at handler top + `disabled={signingOut}` (+ `aria-busy`, `disabled:cursor-not-allowed disabled:opacity-50`) on the existing plain `<button>`. Justification: `PublicNavigation` already uses hooks; `SignInForm.tsx` — the closest single-async-action analog — uses exactly this pattern; the `CreatePoiPage` `inFlight` ref exists for multiple competing actions sharing one `busy` state, which the navbar does not have. Swapping to `ActionButton` is rejected: it changes navbar styling (min-h 44px, variant chrome, spinner) beyond the smallest change.
- **Error surface**: reuse `FeedbackAlert tone="error"` (built-in `role="alert"`, 11.5px text, existing chrome) rendered as `order-last w-full` row inside the header's existing `flex flex-wrap` container — visually directly under the header row containing the logout button; full-width block so it cannot overflow at 320 px (V01). Copy lives as a module-level const in `PublicNavigation.tsx` (same convention as `emailRequiredMessage` consts in `SignInForm.tsx`). Boolean `signOutError` state (copy is constant). Visible only after failure; cleared at retry start; structurally absent after success (authenticated block unmounts).
- **T05 mapper**: NOT REQUIRED. The failure copy is a single constant for every failure kind (network and 5xx alike, D4); no per-code branching exists, so a mapper function would be an empty abstraction (rules §8: no abstraction merely for symmetry; spec §9 D4: no new feedback architecture).

## Component state machine (rules §16)

| State | `signingOut` | `signOutError` | Button | Requests | Notes |
| --- | --- | --- | --- | --- | --- |
| Initial (authenticated) | false | false | enabled | — | Button rendered only when `status === 'authenticated'` |
| Loading | true | false (cleared at start) | disabled + aria-busy | exactly 1 in flight | 2nd click is a no-op |
| Success (200) | → false | false | block unmounts (Guest UI) | resolved | `AuthStorage.clear()` AFTER await resolves; stay on page |
| Failure (network/5xx) | → false | true | re-enabled (retry) | rejected | Context retained; inline error visible; no navigation |

Unmount-while-pending (V02 analog): if the component unmounts mid-flight, later `setState` calls are React no-ops; `AuthStorage.clear()` is a store-level operation and only runs after a resolved 200, so no post-unmount UI mutation occurs. No code change needed; documented here as the accepted lifecycle behavior.

## Task Dependency / Execution Order

```
T01 (API RED) → T02 (API GREEN) → T03 (Navbar RED) → T04 (Navbar GREEN) → T05 (NOT REQUIRED) → T06 (Restore/regression verification) → T07 (Full validation + review) → STOP
```

### T01 — webLogout API RED

- **Goal**: meaningful failing tests for the not-yet-existing `webLogout()` before any implementation.
- **Files**: NEW `src/features/auth/session/webLogout.test.ts`.
- **RED** (test cases, following `webRefresh.test.ts` pattern — `vi.stubGlobal('fetch')`, `afterEach(() => { vi.unstubAllGlobals(); AuthStorage.clear(); })`):
  1. sends `POST` to `/auth/web/logout` with `credentials: 'include'`;
  2. `options.body === undefined` AND no `Content-Type` AND no `Authorization` header (TC-FE-05/06);
  3. HTTP 200 with `{"message":"Signed out successfully."}` resolves successfully;
  4. HTTP 200 with EMPTY body resolves successfully;
  5. HTTP 200 with NON-JSON body resolves successfully (TC-FE-07/U01);
  6. network `TypeError` rejects with `{ code: 'NETWORK', status: 0 }`-style ApiError;
  7. representative non-2xx (500 ProblemDetails body) rejects with `{ status: 500 }` ApiError carrying the errorCode when present (TC-FE-09);
  8. none of the assertions read/require an envelope `success` field.
- **GREEN**: n/a (RED phase).
- **Refactor**: n/a.
- **Focused Validation**: `npx vitest run src/features/auth/session/webLogout.test.ts` → expect RED caused by missing export (`webLogout is not a function` / import error), NOT by test bugs. Record command + exit code + failure output (evidence).
- **Spec Review**: cases map to spec §10/§12 TC-FE-01/05/06/07(API)/09(API).
- **Engineering Rules Review**: rules §6 (TDD gate), §20 (evidence recorded).
- **Cross-Review Checklist**: C08 (AC→case mapping started), C15 (malformed/non-JSON/5xx/network covered).
- **Definition of Done**: RED evidence recorded; test quality reviewed (assertions on exact fetch args, no tautologies) before T02.
- **Dependencies**: baseline record completed (see Baseline Record).

### T02 — webLogout API GREEN

- **Goal**: minimal approved implementation.
- **Files**: `src/lib/authApi.ts` (add only).
- **RED**: already provided by T01.
- **GREEN** (conceptual, exact shape):

  ```ts
  export async function webLogout(): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/web/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      throw { code: 'NETWORK', message: 'Sign out unavailable.', status: 0 } satisfies ApiError;
    }
    if (!res.ok) return handleResponse<never>(res);
  }
  ```

  No body, no Content-Type, no Authorization, no cookie access, no envelope parsing; success = HTTP status only (200/2xx); non-2xx reuses `handleResponse` → ProblemDetails-shaped `ApiError`. JSDoc states the direct-DTO contract and the idempotent 200.
- **Refactor**: only if T01 reveals duplication with `webRefresh`'s network-throw shape (keep the endpoint-local literal; no shared abstraction for 2 uses unless genuinely identical concept — rules §8).
- **Focused Validation**: rerun T01 command → GREEN; record evidence.
- **Spec Review**: spec §3/§10 contract exact (route, credentials, bodyless, status-based success, idempotency tolerated, 500→ApiError).
- **Engineering Rules Review**: rules §8 (API access layer respected, no debug output), §9 (direct-DTO success honored — no envelope gate).
- **Cross-Review Checklist**: C09 (route/method/status/body match contract), C12 (existing API client reused), C16 (no secret exposure).
- **Definition of Done**: T01 GREEN; `npm exec eslint -- src/lib/authApi.ts` clean; no other file touched.
- **Dependencies**: T01.

### T03 — PublicNavigation RED

- **Goal**: failing component tests for the logout handler BEFORE rewiring it.
- **Files**: EXTEND `src/components/navigation/PublicNavigation.test.tsx` (new `describe('PublicNavigation UC-05 sign out')`; extend `vi.mock('@/lib/authApi', () => ({ webRefresh: mocks.webRefresh, webLogout: mocks.webLogout }))`).
- **RED** (test cases; warm-context pattern `AuthStorage.accept(context(), false)` reused):
  - SUCCESS: authenticated render → click "Đăng xuất" → `webLogout` called exactly once (TC-FE-01); while its promise is pending `AuthStorage.getContext()` is NOT yet null (clear only after resolve — D1); after resolve: context null, Guest UI ("Đăng nhập" visible), no `restoring` limbo (TC-FE-02); `tripmate_user` removed from BOTH storages (TC-FE-03); `window.location` unchanged (TC-FE-04 component-level); a prior error message is gone after a later successful retry.
  - LOADING/DUPLICATE (TC-FE-08): pending promise → button `disabled`; two rapid clicks → exactly one `webLogout` call; loading released after success AND after failure.
  - FAILURE — NETWORK (TC-FE-09): `webLogout` rejects → context still present, display name still visible, exact copy `Chưa thể hoàn tất việc kết thúc phiên đăng nhập. Vui lòng thử lại.` shown, button re-enabled; click again → second `webLogout` call (retry).
  - FAILURE — 500: same session-preserving assertions.
- **GREEN**: n/a (RED phase).
- **Refactor**: n/a.
- **Focused Validation**: `npx vitest run src/components/navigation/PublicNavigation.test.tsx` → meaningful RED (current placeholder clears immediately and calls no API), record evidence.
- **Spec Review**: spec §4 flows, §12 TC-FE-01/02/03/04/08/09.
- **Engineering Rules Review**: rules §7 (auth-level change gets behavior tests), §16/U05 (no false success, double submit).
- **Cross-Review Checklist**: C08, C15, U05.
- **Definition of Done**: RED evidence recorded; expectations reviewed against D1/D2/D4 exact wording.
- **Dependencies**: T02 GREEN (mock factory references `webLogout`; real export exists).

### T04 — PublicNavigation GREEN

- **Goal**: minimal approved handler + UI.
- **Files**: `src/components/navigation/PublicNavigation.tsx` (modify).
- **RED**: provided by T03.
- **GREEN** (semantic flow, exact):

  ```
  if (signingOut) return
  setSigningOut(true); setSignOutError(false)
  try { await webLogout(); AuthStorage.clear(); }
  catch { setSignOutError(true); }   // DO NOT clear AuthStorage
  finally { setSigningOut(false); }
  ```

  Button: `disabled={signingOut}` + `aria-busy={signingOut}` + `disabled:cursor-not-allowed disabled:opacity-50` classes on the existing plain button. Error: `{signOutError ? (<div className="order-last w-full"><FeedbackAlert tone="error">{signOutFailedMessage}</FeedbackAlert></div>) : null}` with `const signOutFailedMessage = 'Chưa thể hoàn tất việc kết thúc phiên đăng nhập. Vui lòng thử lại.';` No router usage, no reload, no cookie access, no token handling, no confirmation modal, no toast, no mapper import.
- **Refactor**: minimal — keep the existing comment updated to state UC-05 behavior (replace the "belongs to UC-05" placeholder comment).
- **Focused Validation**: rerun T03 command → GREEN; record evidence.
- **Spec Review**: spec §4 (both flows), §7 (D2), §8 (D1), §9 (D4 exact copy).
- **Engineering Rules Review**: rules §8 (no raw fetch in component; no debug prints; narrow client boundary), §16 state machine matches implementation.
- **Cross-Review Checklist**: C12, C15, C16, V01 (error row full-width, no overflow — verified manually in T07 browser pass), accessibility (FeedbackAlert `role="alert"` announces the error; disabled+aria-busy on button).
- **Definition of Done**: T03 GREEN; `npm exec eslint -- src/components/navigation/PublicNavigation.tsx` clean; visual diff limited to the authenticated actions area + conditional error row.
- **Dependencies**: T03.

### T05 — Error mapping — NOT REQUIRED

Single constant copy for all failure kinds (D4); no per-code branching; a scoped mapper would be an abstraction with one branch (rules §8; spec §9 D4 "no new feedback architecture"). Status: NOT REQUIRED.

### T06 — Restore / regression coverage verification

- **Goal**: confirm TC-FE-11 and UC-04 regression protection WITHOUT duplicating tests.
- **Files**: none expected (verification task).
- **Verification**:
  1. Existing `useWebSession.test.tsx` "ends unauthenticated when refresh is rejected (invalid/expired/revoked/missing cookie)" already proves the post-revocation restore path (webRefresh 401 → unauthenticated, not stuck restoring).
  2. Existing `PublicNavigation.test.tsx` "settles back to Sign In (not stuck restoring) when a warm session signs out" already proves the navbar settles post-clear without a new restore call; T03's success test re-proves it against the real handler.
  3. Together these compose TC-FE-11; a NEW dedicated test would duplicate coverage (task §6: prefer existing; rules: no redundant suites). If review finds a gap (e.g. remount-after-logout path), add ONE focused case to `useWebSession.test.tsx` — decision recorded here as the only permitted addition.
  4. Run the full existing UC-04 auth suites unchanged: `npx vitest run src/features/auth/session/ src/components/auth/ src/features/auth/routing/`.
- **Spec Review**: spec §12 TC-FE-11 + §2 restore nuance.
- **Definition of Done**: all listed suites green on the new code; zero UC-04 test edits (or exactly the one documented addition if a gap is proven).
- **Dependencies**: T04.

### T07 — Full validation + cross-review preparation

- **Goal**: complete evidence pack; NO delivery actions.
- **Commands** (record command + head SHA + exit code + pass/fail/skip for each — rules §19/§20):
  1. `npm run lint`
  2. `npm run typecheck`
  3. `npm test` (full: node --test POI suites + vitest)
  4. `npm run build` (production build — dev server is NOT a substitute; rules L09/C29)
  5. Focused UC-05: `npx vitest run src/features/auth/session/webLogout.test.ts src/components/navigation/PublicNavigation.test.tsx`
- **Diff inspection**: `git status --short`, `git diff --name-only`, `git diff --stat`, `git diff -- src/ tests/`, `git diff --check` (whitespace).
- **Final review against**: spec §4–§13; TEAM_ENGINEERING_RULES (§7/§8/§9/§16/§20); Dev_and_CrossReview_Checklist (G/C items below); security gates (below); accessibility (error announced via `role="alert"`; button disabled+aria-busy; keyboard operable).
- **Definition of Done**: all commands pass on the final head; evidence recorded; findings (if any) classified P0–P3 and either fixed with regression tests or explicitly deferred with owner.
- **Dependencies**: T06.

## Test Matrix Mapping (spec §12 → automated test / review gate)

| Case | Automated coverage | Review gate |
| --- | --- | --- |
| TC-FE-01 | T01 case 1 (URL/method/credentials) + T03 success (called exactly once) | — |
| TC-FE-02 | T03 success block (clear-after-resolve, Guest UI, no limbo) | — |
| TC-FE-03 | T03 (both storages emptied) + existing `authSession.test.ts` clear semantics | — |
| TC-FE-04 | T03 (`window.location` unchanged) | Component contains no router usage / no reload call (structural review) |
| TC-FE-05 | T01 case 2 (body undefined, no Content-Type, no Authorization) | — |
| TC-FE-06 | T01 case 1 (`credentials === 'include'`) | No `document.cookie` anywhere in diff |
| TC-FE-07 | T01 cases 3–5 (200 empty/non-JSON accepted) + T03 (button not rendered after success) | — |
| TC-FE-08 | T03 loading/duplicate block | — |
| TC-FE-09 | T03 network + 500 blocks (retain, error copy, retry, no navigation) | — |
| TC-FE-10 | Existing `authSession.test.ts` (memory-only credentials) + T01 no-body assertions | No secret/token/cookie values in UI copy, errors, or console; no new logging |
| TC-FE-11 | Existing `useWebSession.test.tsx` (401 settle) + existing/new navbar settle tests — T06 verification | — |
| TC-FE-12 | — (no meaningful runtime test exists) | Review-only: no code/doc claims server-side JWT invalidation at logout |

## Engineering Rules Mapping (TEAM_ENGINEERING_RULES v2.0 — applicable only)

| Rule | Applicability | Enforcing task | Validation |
| --- | --- | --- | --- |
| §2 Result states (Đạt/Không đạt/Chưa kiểm tra/Không áp dụng) | All validation reporting | T07 | Evidence table records per-check state |
| §4 Task profile + AC→evidence matrix | Plan itself | Plan §Test Matrix Mapping | Reviewed at plan approval |
| §6 Workflow: TDD gate, plan fits spec, no empty files | All | T01–T07 | RED evidence before each GREEN |
| §7 Impact level Write/auth | Sign-out is auth-affecting | T01–T04, T07 manual browser flow | Unit + component + browser smoke |
| §8 Web architecture; clean diff; DRY only real duplication | authApi addition, navbar rewire, no mapper | T02, T04, T05 | eslint + diff review; no debug output |
| §9 Direct-DTO success / ProblemDetails failure | webLogout success by status only | T02 | T01 cases 3–5, 7 |
| §16 State-before-implement; U05 submit conflicts | Navbar state machine; double-click/500/network/no-false-success | T03, T04 | State table above + TC-FE-08/09 |
| §15/I05 duplicate-click lifecycle | One request per intent; pending+unmount documented | T03, T04 | TC-FE-08 + lifecycle note |
| §19 Web command set | Validation | T07 | Command list above |
| §20 Reproducible evidence (head SHA, exit, pass/fail/skip) | All runs | T01–T07 | Evidence log per task |
| §21–22 Finding lifecycle | Any review finding | T07+ | Finding register with severity/fix/regression test |
| §24 Branch naming `<type>/<member>-<desc>` | `feature/PhucTV-sign-out-web` | Verified at planning | `git branch --show-current` |

## Cross-Review Checklist Mapping (Dev_and_CrossReview_Checklist v2.0)

| Item | Applicable? | Mapping |
| --- | --- | --- |
| G0 Scope/AC/decisions clear | Đạt at plan approval | Spec §14 D1–D5 final |
| G1 Branch/worktree/base/baseline | APPLICABLE | Branch verified; baseline record below |
| G2 Contract+code+UI semantics with tests | APPLICABLE | T01–T04 |
| G3 Self-review + lint/format/test/build/security | APPLICABLE | T07 |
| G4 Independent reviewer verifies | APPLICABLE | Delivery stage (post-plan) |
| G5 Merge authority/handover | APPLICABLE (later) | Delivery Rule below |
| C01 Scope/AC sources | Đạt — spec + prompt, versions recorded | Plan Inputs |
| C02 SRS/docs cross-check, decision records | Đạt — WEB_SCOPE_MATRIX R3 §3.2.5 deviation documented as D3 | Spec §14 |
| C03 Endpoints/screens/dependencies listed | Đạt — logout endpoint, navbar `/`, BE dependency final | Plan Inputs/Architecture |
| C04 Spec+plan have file/test/expected; approvals recorded | Đạt | Spec APPROVED FOR PLANNING; this plan |
| C05 Branch naming | Đạt | `feature/PhucTV-sign-out-web` |
| C06 head/base/status/worktree inventory | APPLICABLE | T07 records final head + status |
| C07 Baseline with command/SDK/exit/counts | PARTIAL — see Baseline Record | Record before T01 |
| C08 AC→case→evidence mapping | Đạt | Test Matrix Mapping |
| C09 Route/method/status/body match contract | APPLICABLE | T01 case 1; T02 |
| C10 Request/response field semantics | APPLICABLE (message-only 200; nothing FE-required) | T01 cases 3–5 |
| C11 Clean Architecture BE | NOT APPLICABLE — no backend change | — |
| C12 Feature layers + existing API client | APPLICABLE | T02/T04 use `authApi.ts`; no raw fetch in component |
| C13 Real auth path checks | APPLICABLE (cookie credential; missing-cookie idempotent 200 is server-side) | T01 case 3–5 + manual smoke |
| C14 Guest browse public | APPLICABLE — `/` stays public; button authenticated-only | T03 success (Guest UI) + manual |
| C15 5xx/malformed/non-JSON/network mapping | APPLICABLE | T01 cases 4–7; T03 failure blocks |
| C16 No secret/stack/PII leaks; cookie flow; CORS | APPLICABLE | Security Review below; C30 |
| C17–C24 SQL | NOT APPLICABLE — no DB change | — |
| I01–I04 idempotency key | NOT APPLICABLE — no operation-key mechanism; endpoint natively idempotent | — |
| I05 duplicate submit lifecycle | APPLICABLE | TC-FE-08; state machine |
| D01–D05 persistence/concurrency | NOT APPLICABLE — no DB writes from FE | — |
| U01 200 but wrong data | APPLICABLE — empty/non-JSON 200 must still succeed; UI must not misread body | T01 cases 4–5 |
| U02 form/permission errors | NOT APPLICABLE — no form inputs; no client-supplied identity (cookie is server-read) | — |
| U03 stale search | NOT APPLICABLE | — |
| U04 empty catalogue/photos | NOT APPLICABLE | — |
| U05 timeout/conflict on submit | APPLICABLE — core D1 scenario | TC-FE-08/09; manual failure smoke |
| V01 small screens/large text | APPLICABLE — error row at 320/390/768/1024/1440 px | T07 browser pass |
| V02 keyboard/lifecycle | APPLICABLE — keyboard activation of button; unmount-while-pending noted | T07 + lifecycle note |
| V03 Figma frame | NOT APPLICABLE — no new screen; approved copy on existing navbar (D3/D4) | — |
| V04 map | NOT APPLICABLE | — |
| V05 public entry/navigation | APPLICABLE — post-logout guest state; guards unchanged | T06 + manual smoke |
| C25/C26 worktree+SDK | APPLICABLE | T07 evidence (node/npm versions) |
| C27 Docker | NOT APPLICABLE | — |
| C28 correct origins (FE 3001 → BE 5000) | APPLICABLE | Manual validation env |
| C29 production build clean | APPLICABLE | T07 `npm run build` |
| C30 CORS allowlist + credentials | APPLICABLE — BE already credentialed-allowlists FE origin for web auth; logout uses same chain | Manual smoke |
| C31 test data owner/cleanup; no keys in prompts | APPLICABLE | Manual validation notes |
| C32 BE build | NOT APPLICABLE | — |
| C33 Web full command set + browser flow | APPLICABLE | T07 |
| C34 run evidence fields | APPLICABLE | T07 |
| C35 SQL skips | NOT APPLICABLE | — |
| C36 CI actually ran | APPLICABLE at delivery (no CI claim made in-plan) | Delivery stage |
| C37 diff --check; clean debug code; scoped format | APPLICABLE | T07 |
| C38 self-review consistency (counts/limitations) | APPLICABLE | Final report |
| C39–C46 reviewer-side items | APPLICABLE at cross-review | Delivery stage |
| C47–C54 fix/merge/handover | APPLICABLE at delivery | Delivery Rule |

## Full Validation (T07 — required before reporting completion)

`npm run lint` → `npm run typecheck` → `npm test` → `npm run build` → focused UC-05 vitest run → diff inspection (`git status --short`, `git diff --name-only`, `git diff --stat`, `git diff -- src/ tests/`, `git diff --check`). Every run recorded with head SHA, command, exit code, pass/fail/skip. Any check not run is reported as Chưa kiểm tra, never pass.

## Manual Validation (browser, real BE — after T07)

**Success path**: start BE + FE (`npm run dev`, port 3001; API `localhost:5000`) → sign in → authenticated navbar → click "Đăng xuất" → Network: `POST /api/v1/auth/web/logout` = 200 → DevTools: `tripmate_refresh` removed via backend `Set-Cookie` → navbar immediately Guest → URL unchanged → F5 → still unauthenticated → `POST /api/v1/auth/web/refresh` returns 401 `AUTH_TOKEN_INVALID`. Also verify the error row layout at 320/390/768/1024/1440 px (V01) and keyboard operation.

**Failure path (if practical)**: sign in → make BE unreachable (stop BE / block via devtools offline) → click "Đăng xuất" → authenticated UI remains → exact safe error appears → button re-enabled → restore BE → retry → success clears state (9-step flow per task §14).

## Security Review (gates — any violation BLOCKS approval)

- No `document.cookie` access anywhere in the diff.
- `tripmate_refresh` never read/stored/copied by JS; no refresh token in any body (body is absent).
- No Authorization header added for logout; no Content-Type for the empty request.
- No manual HttpOnly cookie deletion; server owns Set-Cookie expiry.
- No logging of tokens/cookies/headers; no new console output at all (debugPrint discipline).
- No assumption of server-side access-JWT invalidation (local discard only, after 200).
- Local access token discarded ONLY after successful server logout (D1).

## Scope Review

- Production: exactly `src/lib/authApi.ts` + `src/components/navigation/PublicNavigation.tsx`.
- Tests: exactly `src/features/auth/session/webLogout.test.ts` (new) + `src/components/navigation/PublicNavigation.test.tsx` (extended; plus the single T06-permitted addition only if a proven gap).
- Everything else untouched: authSession/useWebSession/WebSessionProvider/guards/mapper/app/package.json/backend/other specs/plans/docs.
- No Axios/Redux/Zustand/React Query/SWR/global redesign/toast/modal/route/token abstraction/unrelated refactor.

## Baseline Record

Branch:
`feature/PhucTV-sign-out-web`

HEAD:
`f87f056cc1f2e5ca1629cea22b47a30547ac3ed7`

Node:
`v22.20.0`

npm:
`10.9.3`

Run date/time:
2026-09-17, vitest reported start 02:49:49 (local, UTC+0700)

Working tree before baseline:
`?? plans/UC-05-web-plan.md` and `?? specs/UC-05-web-spec.md` (the two known planning artifacts, untracked); `0` staged; `0` tracked files modified. No pre-existing item beyond the two expected planning artifacts.

### Lint

Command:
`npm run lint`

Exit code:
0

Result:
PASS

Errors:
0

Warnings:
3 — all pre-existing, not introduced by UC-05 (no UC-05 code exists in the tree): `@next/next/no-img-element` at `src/features/public/landing/components/CentralVietnamShowcase.tsx:56` and `src/features/public/landing/components/FeaturedToursSection.tsx:128,210`. Classified as existing baseline warnings (rules §19: pre-existing warnings must have a source/owner and must not be confused with new regressions).

### Typecheck

Command:
`npm run typecheck`

Exit code:
0

Result:
PASS

### Tests

Command:
`npm test` (repo script = `node --test tests/*.test.cjs && vitest run --exclude "tests/*.test.cjs" --exclude src/lib/__tests__/useVerificationEmailCooldown.test.ts`)

Exit code:
0

Result:
PASS

Suites:
Two runners. (1) `node --test tests/*.test.cjs`: 23 subtests in the POI/session .cjs suites. (2) `vitest run`: 21 test files passed (21/21), including all UC-04 auth/session suites (`PublicNavigation.test.tsx` 20, `webRefresh.test.ts` 4, `webSignIn.test.ts` 6, `authSession.test.ts` 19, `useWebSession.test.tsx` 5, `WebSessionProvider.test.tsx` 2, `PartnerRouteGuard.test.tsx` 22, `partnerRouteDecision.test.ts` 28, `SignInForm.test.tsx` 42). The excluded file in the repo's own script (`src/lib/__tests__/useVerificationEmailCooldown.test.ts`) is excluded by the repo-defined command, not by this task.

Passed:
263 total — 23 (node --test) + 240 (vitest)

Failed:
0

Skipped:
0

Notes (not failures, recorded for honesty): vitest emitted a pre-existing stderr hydration warning in `PartnerContextPage.runtime.test.tsx` (`In HTML, <html> cannot be a child of <div>`) from the real cold-start/layout composition test; it does not affect the PASS result. No count was invented — all figures are as reported by the commands.

### Build

Command:
`npm run build`

Exit code:
0

Result:
PASS

Warnings:
None reported by the command

Errors:
None reported by the command

Notes: Next.js 16.3.2 (Turbopack) production build — compiled successfully, TypeScript step finished, 21/21 static pages generated, 21 routes emitted. Production build run explicitly (dev server is not a substitute — rules L09/C29).

### Working tree after baseline

Identical to before: `?? plans/UC-05-web-plan.md` and `?? specs/UC-05-web-spec.md`; `0` staged; `0` tracked files modified. Build/runtime artifacts (`.next/`, `tsconfig.tsbuildinfo`, `coverage/`) are gitignored and produce no working-tree entries. No unexpected production/test file modification appeared (scope guard §7 of the amendment task satisfied).

### Baseline Conclusion

PASS

Explanation: lint (exit 0, only 3 pre-existing `no-img-element` warnings in unrelated landing components), typecheck (exit 0), the full repo-defined test command (exit 0 — 263 passed / 0 failed / 0 skipped across both runners, including all UC-04 auth suites), and the production build (exit 0, 21 routes) all succeeded on `feature/PhucTV-sign-out-web` at HEAD `f87f056` with an unchanged working tree containing only the two known planning artifacts. Baseline failures that could mask UC-05 regressions: none. The 3 lint warnings are recorded as pre-existing baseline noise with their exact locations, per C07.

## Delivery Rule

implementation → full validation (T07) → engineering-rules review → cross-review (independent reviewer per checklist) → final diff/spec/architecture review → report → **STOP**. Developer alone chooses merge/PR/keep/discard. No `git add`, commit, push, PR, or branch change by the implementer.

## Self-Review Record (plan vs sources)

Checked against spec (D1 session-preserving in T02/T04/state machine/TC-FE-09; D2 stay-on-page — no router anywhere, TC-FE-04; D3 no modal in footprint; D4 exact copy in T04; D5 spec filename referenced), both rule documents (mappings above), and actual source/test architecture (all file paths, patterns and existing tests verified by reading the branch). No contradictions found; no open decisions. Status was DRAFT — AWAITING DEVELOPER APPROVAL pending baseline evidence; on 2026-09-17 the developer-approved plan content was unchanged and the measured baseline fully passed (see Baseline Record), so the status was amended to APPROVED FOR IMPLEMENTATION. No technical decision, task order, footprint, mapping, security gate or delivery rule was modified by the baseline amendment.

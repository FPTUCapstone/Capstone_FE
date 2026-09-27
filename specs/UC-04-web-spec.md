# UC-04 Web — Sign In Specification (Revision 3)

Date: 2026-09-14. Status: core W01/T16 contract APPROVED/DONE; runtime implementation NOT EXECUTED.

This revision replaces the previous consolidated scope; legacy compatibility supersedes normalization in core Sign In. Latest conversation decisions supersede historical handoff: consent modal replaces checkbox, access tokens are memory-only, no unknown-role home fallback, refresh is in scope. References: [BE specification](../../Capstone_BE/specs/UC-04-spec.md), [Web plan](../plans/UC-04-web-plan.md), [BE plan](../../Capstone_BE/plans/UC-04-plan.md).

## 1. Scope and current implementation

**Core Sign In:** public/Admin email-password, Google, validation/account gates/Admin gate, full effective authentication context, profile-state routing and placeholder, memory access/cookie issuance/Keep me signed in, password verification recovery and invalid-context fail-closed.

**Separate session package retained for this delivery:** refresh endpoint/coordinator/restoration, as previously requested. Manual Partner retry integrates with that package, not core acceptance.

**Dependencies/deferred:** Register verification-link consumer migration and registration waiting-page resend; Web sign-out/cleanup; multi-tab switching; persistent cleanupPending; actual legacy normalization; approval/reject/resubmit lifecycle changes; Partner business APIs/dashboard. Their original target designs remain reference only. Do not require owning UCs to pass to declare core routing complete. Core completion is not full remembered-session/reload UX completion before refresh is available.


Target: real public/Admin sign-in, Google consent, email verification recovery, cookie refresh/restoration, account-switch coordination, real-state role/application routing and approved Partner placeholder.

Current foundation: BE password validation/account gates/role response, Firebase Google validation and unknown-email Traveler creation, admin Google rejection, hashed refresh persistence and fixed expiry, exact configured CORS origins. Current gaps: Admin UI simulates success; public UI saves tokens and routes home; shared verification creates sessions; no Web cookie/refresh/Admin-only contract; profile/account lifecycle mixed; application screens contain mock behavior; `/partner` absent; reject handler stub.

Do not claim the target already implemented. No Phone/OTP, fake business dashboard, full registration/application/reject/resubmit/notification/business-module implementation in this task. Their owning UCs remain dependencies. No schema additions, no production data mutation, no commit/push/new branch. Final spec/plan review precedes code.

## 2. Public and Admin entry

Public `/sign-in`: email, password, visibility toggle, Keep me signed in default OFF, password submit, Google, Forgot password, Traveler registration and TourOperator registration. No role selector or password-login Terms checkbox.

Trim email, validate email format, BE lowercase normalization. Password required and preserved exactly; no sign-in strength validation. Associate field errors and focus first invalid input. Editing clears corresponding field error and prior outcome/verification panel, preserving other values.

Single loading lock blocks duplicate/competing auth actions and disables inputs; only active action indicates loading. Errors preserve values and checkbox, unlock and allow explicit retry. No automatic retry of ambiguous sign-in requests.

Admin `/admin/login`: email/password ONLY, persistence selection, real Admin-specific BE contract. Validate credentials/account/current DB role BEFORE session creation. Administrator succeeds → `/admin`. Non-admin →403 `auth.admin_access_required`, no token/new refresh row/cookie replacement. Message: `Tài khoản này không có quyền truy cập khu vực quản trị. Vui lòng đăng nhập tại trang dành cho người dùng.` with public sign-in link. Wrong credentials/Locked/Inactive retain their own errors.

Failed B sign-in must not revoke existing A, replace A cookie, or create B session. Account switch begins only on successful B sign-in. Public entry may authenticate all supported roles; Administrator email/password goes `/admin`. Admin Google rejection remains authoritative in all session-creating paths.

## 3. Google flow and consent

Click Google → consent modal explains unknown Google email creates Traveler, not TourOperator. Terms/Privacy links; affirmative `Đồng ý và tiếp tục với Google`; `Đăng ký TourOperator` → `/partner/register`; Cancel. No checkbox. Consent precedes popup; UX/legal gate is not backend authorization proof.

Affirmative → Firebase popup → ID token → Web Google JSON body-only contract. Firebase identity alone is not TripMate session. BE validates provider, verified-email claim, email, account and current role. Unknown email creates Traveler/Active; existing role/status never changed by sign-in. New Traveler may receive welcome. Admin Google fails and directs email/password, without automatically guessing email input.

Popup cancellation silent. Popup blocked instructs user to allow; no automatic reopening or redirect fallback. Google MSG_EMAIL_NOT_VERIFIED is provider evidence error: no TripMate resend/sync recovery. Password unverified-account flow is separate.

## 4. Account and application state (approved Part 3)

Users.status → account/authentication eligibility. OperatorProfiles.approval_status → TourOperator application/business lifecycle. Existing column is authoritative; no new table/column. Return applicationStatus separately from DB in sign-in AND refresh.

| Account status | TourOperator applicationStatus | Result |
| --- | --- | --- |
| PendingEmailVerification | Any | Verification required |
| Locked / Inactive | Any | Authentication denied |
| Active | PendingApproval | Sign-in allowed → /partner/application |
| Active | Rejected | Sign-in allowed → /partner/application |
| Active | Approved | Sign-in allowed → /partner |
| Active | Missing/unsupported | Valid session retained; unresolved application; business denied |

Traveler/Administrator applicationStatus is always present and null. FE must not infer approval from Active, role, stored data, claims, URL or route existence. Business API requires current eligible account + TourOperator + current Approved profile; backend authority, not route guard.

New Partner flows write pending state to profile only; eligible verified account is Active. Verification only changes PendingEmailVerification → Active and preserves profile. Approve normally changes profile PendingApproval → Approved, account Active stays Active. Reject: profile PendingApproval → Rejected. Resubmit: profile Rejected → PendingApproval. None unlock Locked, reactivate Inactive, or change role.

### Legacy compatibility - approved, no DB normalization in Sign In

Only inspect Users.status in {PendingApproval, Rejected}. Authenticate credentials/Google evidence, load account/current role, handle PendingEmailVerification/Locked/Inactive, then run a shared ResolveAccountEligibility(account, profile) BEFORE the old legacy rejection gate.

Require TourOperator role + matching OperatorProfile + valid compatible profile status + authoritative confirmed email verification. Only PendingApproval/PendingApproval and Rejected/Rejected map successfully. Legacy/profile conflict (including PendingApproval/Approved or Rejected/PendingApproval), absent profile, unsupported status, nonoperator role or uncertain verification fails with auth.account_state_unresolved (APPROVED HTTP403), no new session/token/cookie or account activation.

PASS - effective authentication status Active; applicationStatus from profile; continue authentication. This response status is normalized/effective contract status, NOT evidence that Users.status in DB was updated. Do NOT mutate account/profile status or verification data as a side effect of resolving. Normal refresh/login timestamp and refresh-session persistence remain separately governed by their contracts.

Use the same eligibility semantics in password, existing-account Google (including concurrency re-fetch), refresh and relevant protected-API account checks. Unknown-email Google Traveler creation is outside legacy mapping. Inventory raw Users.status checks; distinguish account eligibility from role-specific approval rules, without implementing unrelated business UCs. Partner business remains eligible account + TourOperator + current Approved profile; matching legacy pending/rejected never grants business access.

CASE A legacy account without sufficient evidence - authentication denied/account_state_unresolved. CASE B DB Active, valid TourOperator session, missing/unknown applicationStatus - authenticated application-unresolved state, no business, no cleanup.

Verification evidence audit: Users.EmailVerifiedAtUtc is an existing persisted field. VerifyEmailCommandHandler currently writes it only on PendingEmailVerification activation; its response timestamp fallback is NOT persisted evidence. Implementation must audit timestamp writers/provenance and establish the trusted stored marker used consistently by password/Google/refresh/API checks. Never infer verification from profile existence, legacy status, FE storage or response fallback. Any alternative evidence mechanism needs explicit review; do not silently add Firebase dependency to normal password login or refresh. Missing reliable evidence fails unresolved; no automatic evidence backfill. Live-data audit of suspicious records belongs before migration/release, not a resolver implementation prerequisite; no production data changes authorized.

Keep schema/legacy enum values and old Approve handler unchanged in this core task. Data normalization and approval-lifecycle writer changes are future coordinated owning-UC work, not Sign In acceptance. Future normalization requires compatible code before/with data change.

## 5. Web verification-only and recovery

### 5.1 Endpoint

POST `/api/v1/auth/web/verify-email`, Authorization Bearer fresh Firebase ID token, no body; no TripMate session required. FE reloads user and getIdToken(true). BE verifies evidence/email_verified, obtains token email, locates existing account, applies restrictions, syncs verification. No client email/userId/verified flag substitutes evidence. No account auto-creation.

HTTP200 existing verification-style envelope, data `{ "emailVerified": true }`. Only verification result; no role/status/application routing data needed. Repeat sync safe; preserve existing verification timestamp. No access token, refresh token, refresh/session row, Set-Cookie, authenticated Web session, role/profile change or alteration of existing browser session.

| Failure | HTTP | Code |
| --- | --- | --- |
| Missing Bearer | 401 | AUTH_HEADER_MISSING |
| Invalid/expired Firebase token | 401 | MSG14 |
| Firebase not verified | 403 | MSG_EMAIL_NOT_VERIFIED |
| Missing usable email | 400 | auth.verification_email_missing (new) |
| Account absent | 400 | MSG_USER_NOT_FOUND |
| Locked/Inactive/unsupported account state | 403 | Existing restricted-account code |
| Identifiable Firebase infrastructure failure | 503 | auth.verification_unavailable (new) |
| Internal/DB fault | 500 | Existing safe server error contract |

Latest W01 packet corrects verification parser audit: existing failures are mixed; NEW Web contract proposes ProblemDetails failures, legacy Mobile unchanged. Login/Google retain ProblemDetails/errorCode. AuthApi parses explicit endpoint shape, not message matching. No global response-format rewrite. No raw provider errors/credentials in UI/logs.

### 5.2 Register and resend - compatibility dependency, not core implementation

Register → Firebase link → `/verify-account` remains. `/verify-email` handler check/applies Firebase action code, confirms current Firebase user matches link email, reloads/fresh token, calls Web-only endpoint, displays success → Proceed to Sign In. Remove verification saveTokens. Missing/mismatched Firebase session: explain Firebase accepted but BE sync incomplete; sign in to finish, never synchronize another user from URL email.

Current Web waiting screen has Resend and Proceed to Sign In; do not invent Mobile's I verified button as existing Web behavior. Resend uses matching Firebase user or authenticates exact submitted account first. Success/too-many-requests starts 60-second cooldown; transport failure allows retry. Countdown expiry is no Firebase acceptance guarantee. Resend never establishes session/syncs verified state. No password persistence.

### 5.3 Password sign-in recovery

Initial sign-in recognized PendingEmailVerification → authenticate submitted credentials with Firebase → reload. Not verified: instructions/resend. Verified: getIdToken(true) → Web verify-only → repeat email/password sign-in exactly ONCE → full current auth context/session → routing. Recovery max once per submit, no loop; second failure handled normally. Never route from verify result or default home. Sign-in alone creates exactly one normal Web session.

### 5.4 Mobile

Keep `/api/v1/auth/verify-email` session/token contract, secure-storage expectation and admin Google guard. Endpoint defines semantics regardless caller; no User-Agent/implicit client-header dispatch. Shared evidence/sync logic allowed; session creation outside Web-only flow. Mobile missing-role → Traveler fallback is separate review issue, not approved/fixed here.

## 6. Web session

### 6.1 Establishment and expiry

Successful Web sign-in: access/current context in response; refresh cookie only, never raw Web refresh JSON. Existing atomic refresh-row/login persistence invariant retained. Local password login independent of Firebase except explicit verification recovery.

Access 15 minutes, memory-only. Refresh fixed original 7 days, random token hashed in existing DB. NO rotation, sliding expiry, replay-result cache, requestId or extra token-family schema. Refresh A stays A; expiry unchanged.

### 6.4 Shared coordinator and retries - separate session package

Restore, automatic expiry/eligible API401, manual Partner retry and shared-cookie tabs use ONE refresh coordinator/single-flight. Join in-progress result; protect repeated click. Retry eligible failed API at most once; ordinary403 does not refresh. No replay of account-A action under B, or uncertain mutation resubmission without safe semantics. Cross-tab coordination implementation must be reviewed/tested, not promised by independent tab-local locks.

### 6.5 Failures

Invalid/expired/revoked/missing refresh session → clear/authenticate again. Locked/Inactive → clear with reason. Network/timeout/5xx → keep recoverable state, block protected access, allow retry. Applicable429 → retain, respect Retry-After. Codes, not message text. Refresh validates hash/expires_at/revoked_at and reads current account/role/profile, not old claims.

### 6.7 Persistence and Keep me signed in

Default OFF: session cookie no persistent Max-Age/Expires; noncredential UI state in current tab sessionStorage. ON: persistent cookie no later than original refresh expiry; UI state localStorage. Both can retain state on reload; browser restore may retain session cookies/sessionStorage. Closing is not revocation. Shared cookie does not provide strict backend tab isolation.

UI state may contain display user data, access expiry metadata, persistence mode and noncredential context. NO password/access/refresh in browser storage. Saved role presentation only, never API authorization. All auth storage through AuthStorage. Successful new sign-in clears previous auth keys in localStorage/current-tab sessionStorage then saves selected mode; do not clear unrelated data or claim other-tab sessionStorage removed.

Persisted state not proof of backend session. Reload: no access token → coordinator refresh → only backend-confirmed context enables protected UI. Temporary failure retains recovery state; invalid session clears.

### 6.8 Cookie, CORS and CSRF scope (approved Part 1)

Production HTTPS FE/BE SAME SITE required; domains unconfirmed. Example tripmate.example / api.tripmate.example illustrative. Cookie HttpOnly, Secure production, SameSite=Lax, Domain omitted, Path=/api/v1/auth if refresh/sign-out beneath it. Re-setting cookie never extends original refresh expiry. FE credentials: include for cookie requests.

CORS exact configured FE origins + AllowCredentials, never wildcard credentials. Development localhost exceptions separate from production HTTPS. Session-changing Web APIs POST, enforced approved content type/contract; no GET side effects.

X-TripMate-Web and separate server Origin-validation middleware optional future hardening, NOT MVP mandatory. Same-site is a deployment condition, not universal CSRF protection. Different-site deployment requires review before SameSite=None; CORS alone insufficient. Preserve Mobile contracts independently.

### 6.9 Access and 6.10 tabs - multi-tab deferred

Access memory only; protected API Bearer. Successful account B switch broadcasts noncredential change, clears stale A access/UI in other tabs and restores current B via coordinator. Notify unsaved work; never auto-submit A drafts under B. Failed B sign-in preserves A backend session/cookie.

## 7. Routing and context validation

Traveler → `/`; Administrator email/password → `/admin`. No supported role inference or home fallback for unknown role.

### 7.3.2 Approved Partner placeholder

Real `/partner` page: `Khu vực Partner đang được phát triển.` No fake tour/booking/revenue/business data. Real Approved routing can PASS; dashboard/business remains NOT IMPLEMENTED. Pending/Rejected never enter as approved operators.

### 7.3.3–7.3.5 Application context and unresolved state

Sign-in/refresh applicationStatus from current profile: PendingApproval/Rejected → `/partner/application`; Approved → `/partner`. Replace stale status when BE returns new state. Valid TourOperator session with absent/empty/malformed/unknown applicationStatus remains authenticated; no Approved or Pending fallback. Display `Chưa thể xác định trạng thái hồ sơ Partner. Vui lòng thử lại hoặc liên hệ hỗ trợ.` with Thử lại.

Manual Thử lại uses same refresh coordinator even before access expiry; cookie authorizes, DB current state returned with replacement access token. Recognized state routes; still unresolved remains. No refresh expiry extension; failures §6.5. Approved-only API denied by BE while unresolved.

### 7.5 Invalid auth context and Admin cleanup (approved Part 2)

Missing/unknown role, missing/unusable required access, missing/unsupported account status or success with disallowed account state → contract failure. No authenticated UI/routing/saved-state fallback. Discard memory access, clear auth keys, attempt approved Web sign-out cleanup. Message `Chưa thể hoàn tất đăng nhập. Vui lòng thử lại.`

Cleanup requires BE sign-out: revoke applicable current refresh + expire matching-scope cookie. Frontend deletion is not proof of revoke. Temporary cleanup failure: remain locally unauthenticated, display cleanup/session error, never claim success. Persistent cleanupPending across reload and multi-tab cleanup NOT mandatory/NOT approved MVP, optional hardening; therefore cross-reload blocking of restoration cannot be guaranteed. This differs from approved normal account-switch coordination.

Sign-out retry safe/idempotent for missing/expired/revoked sessions and removes remaining cookie. Already-issued JWT may stay valid until 15-minute expiry. Valid TourOperator unresolved application is NOT invalid auth context and never triggers cleanup alone. Normal user sign-out belongs UC Sign Out; this UC uses same endpoint as dependency only.

## 8. UX, accessibility and acceptance

Acceptance is split: CORE (credentials/gates/context/session issuance/verification recovery/routing/fail-closed), SESSION PACKAGE (refresh/restoration/remembered-session recovery), COMPATIBILITY DEPENDENCY (Register consumers/cleanup), and DEFERRED OWNING UC (multi-tab, normalization, reject/resubmit/business). The matrix below describes target scenarios; only CORE rows/components block core completion. Keep-me-signed-in cookie issuance can pass in core while reopen recovery remains incomplete until the session package.


Generic invalid credentials for unknown email/wrong password/null password hash. Locked/Inactive safe reason/support. Form/persistence retained on operational errors; no auto login retries/raw exceptions. Keyboard actions, field associations, first-error focus, accessible password visibility/loading announcements; modal focus trap/Escape/Cancel/restore; Terms links preserve input; responsive small-screen/keyboard handling.

### 8.4 Acceptance matrix

| ID | Required verification with real BE state |
| --- | --- |
| AC01 | Both entries validation/untouched password/loading/duplicate submit/input preservation |
| AC02 | Consent affirmative/cancel/Partner link; popup cancelled/blocked; unknown Google Traveler only |
| AC03 | Admin Google denial and Admin-only gate before persistence; credential/status error precedence |
| AC04 | Generic credentials; Locked/Inactive no activation/mutation/session |
| AC05 | Web verification zero tokens/refresh row/cookie; safe repeat; Register still proceeds Sign In |
| AC06 | Fresh-evidence recovery once, second sign-in full gates/exactly one session; resend matching account/cooldown/errors |
| AC07 | Real pending/rejected/approved routing; no inference from account Active |
| AC08 | Approved placeholder no fake business; unresolved session retained, manual retry same coordinator |
| AC09 | Memory access, correct UI/cookie persistence, backend-authoritative reload; restore caveats |
| AC10 | Refresh hash/revoked/expired/current DB states; transient/429 handling; no rotation/sliding expiry |
| AC11 | SESSION PACKAGE: auto/manual single-flight and bounded401/no403 retry; DEFERRED: multi-tab coordination; never cross-account replay |
| AC12 | CORE: failed B preserves A; DEFERRED: cross-tab switch/unsaved-work coordination |
| AC13 | Malformed success fail closed; sign-out cleanup dependency/error honest, no role/home fallback |
| AC14 | HTTPS/same-site/Lax/exact credentialed CORS/POST/content-type; no refresh exposure |
| AC15 | Mobile existing session contract/admin guard regression; role fallback separate issue |
| AC16 | CORE: legacy resolver pass/fail/effective-status/no DB mutation and relevant eligibility consistency; DEFERRED: normalization/approval/reject/resubmit |
| AC17 | Keyboard/focus/error/loading semantics and real backend role/Partner API authorization |
| AC18 | UC Sign Out integration revoke/cookie expiry when implemented; existing JWT limitation explicit |

Use meaningful FE unit/integration and BE handler/API/persistence tests plus available real browser E2E. Required tests/lint/typecheck/build/format pass when implementing. Unavailable Firebase/SQL/browser/owning APIs reported SKIP/BLOCKED, never PASS. Mock UI/storage flags not evidence. Reject/resubmit/business acceptance incomplete until real owned features exist. Historical test totals do not prove this revision.

## 9. Approved Core Web Sign-In Integration Contract

Core Web login/Admin/Google/verify routes, request/DTO/cookie/error/message decisions are APPROVED by user (2026-09-14). Refresh/sign-out exact schemas remain separate session/dependency contract work, not part of the completed core W01 gate.

| Endpoint | Request | Success |
| --- | --- | --- |
| POST /api/v1/auth/web/login | JSON email/password/keepMeSignedIn | Access/full context + cookie |
| POST /api/v1/auth/web/admin/login | Same JSON | Admin gate then access/context + cookie |
| POST /api/v1/auth/web/google | JSON idToken/keepMeSignedIn | Non-admin Google access/context + cookie |
| POST /api/v1/auth/web/verify-email | Firebase Bearer, no body | Verification only |
| POST /api/v1/auth/web/refresh | Cookie, no credential body | New access/current context; original refresh unchanged |
| POST /api/v1/auth/web/sign-out | Cookie | Revoke/expire cookie; safe retries |

Web auth success envelope data: userId, email, fullName, role, status, accessToken, accessTokenExpiresAtUtc; applicationStatus for TourOperator (nonoperator always null, field required); Google additionally isNewAccount. No refreshToken. String enums. Login/Google ProblemDetails/errorCode retained; refresh invalid-session and operational code catalog requires explicit contract finalization. Existing Mobile endpoints/responses preserved.

## 10. Review and execution gates

The latest approved legacy resolver supersedes earlier normalization/approve-writer prerequisites for CORE. No production migration or approval-lifecycle implementation in core. Final contract review includes APPROVED HTTP403 for auth.account_state_unresolved, trusted verification evidence provenance, and relevant authorization-check inventory. Do not conflate legacy effective Active with persisted Active.


Final consolidated document approval before implementation. Future owning-UC normalization must coordinate reader/writer/approve and data audit. Reject/resubmit/notifications/Partner business remain owning-UC dependencies, not automatic scope expansion. Unnormalized legacy handling follows the approved shared resolver above. Security hardening optional as approved; do not reintroduce mandatory persistent cleanup marker. Team self-review/cross-review use TEAM_ENGINEERING_RULES.docx and Dev_and_CrossReview_Checklist.pdf. User prohibition on commit/push and new branches overrides generic git workflow.

### W01 / T16 - Documentation-only contract gate (DONE)

W01 is the FIRST FE-BE agreement step, not a feature implementation. Source files authApi.ts, authErrorMapper.ts, controllers and DTOs are inspection/reference areas only in W01; do NOT modify runtime code/tests, create sessions or change DB. W02 and BE implementation tasks begin only after user approval of the matching final contract.

Approved contract checklist:

- Exact POST routes: /api/v1/auth/web/login, /api/v1/auth/web/admin/login, /api/v1/auth/web/google, /api/v1/auth/web/verify-email. Existing Mobile routes remain unchanged.
- Password/Admin request: application/json with email:string, password:string, keepMeSignedIn:boolean (default false). Example: {"email":"user@example.com","password":"...","keepMeSignedIn":false}. Email trim/lowercase rule; password untouched. Google JSON: idToken:string and keepMeSignedIn:boolean, body-only Firebase token. Verification: Firebase Bearer, no body. Final required/null/unknown-field and validation rules documented before code.
- Sign-in success envelope data types: userId:number (BE integer ID, NOT string); email:string; fullName:string (non-null, empty allowed); role:string enum; status:string effective authentication status; applicationStatus supported string enum for TourOperator (nonoperator always null, field required); accessToken:string; accessTokenExpiresAtUtc:UTC ISO8601 string. Google adds isNewAccount:boolean. Final field nullability and complete success example must agree in both specs.
- Web response has NO refreshToken. Refresh credential only in HttpOnly cookie; internal token issuance may reuse existing BE services without changing the Mobile response.
- Cookie NAME = tripmate_refresh, FINAL/APPROVED; never invent a different name during code. Attributes: HttpOnly, Secure production, SameSite=Lax with HTTPS same-site deployment, Domain omitted, Path=/api/v1/auth. OFF: session cookie; ON: persistent until original seven-day expiry; no rotation/sliding expiry. Local development exceptions and cookie deletion scope documented.
- Legacy resolver BEFORE old legacy gate: DB PendingApproval/profile PendingApproval or DB Rejected/profile Rejected with required role/profile/verification evidence -> effective response status Active, applicationStatus from profile, NO DB account/profile-status update. Conflicts/insufficient evidence -> no session, auth.account_state_unresolved; HTTP403 APPROVED.
- Trusted verification evidence source/provenance established by BE audit. Accepted MVP: DB authoritative; valid persisted EmailVerifiedAtUtc is sufficient evidence; no profile/status inference or response fallback. Keep ordinary password/refresh independent of new implicit Firebase calls.
- Complete endpoint-specific error table: HTTP status + stable code + exact FE display message + action (field error, resend, retry, support, wrong Admin entry). Include validation, credentials, provider/token, account restrictions, Admin Google/Admin role, legacy unresolved, verification and operational/unknown failures. Codes, not message text matching. W01 is NOT DONE while message mappings/catalog remain placeholders.
- Preserve existing Mobile token response/verification session/admin Google guard. Identify current Web Register consumers as compatibility dependency; no implicit client/header-based dispatch or global envelope rewrite.
- Explicit success/error parser contracts: sign-in/Google success envelope, failures ProblemDetails/errorCode; verification follows the APPROVED W01 packet format; Mobile retains existing format. Agree casing/string enums, no role/approval guessing.
- Refresh/sign-out exact schemas are separate session/dependency contract work; do not require full implementation of those UCs in W01. Any field/cookie decision needed by sign-in or cleanup integration must nevertheless be fixed before its consumer code.

Definition of Done: both FE/BE specs contain identical APPROVED route/request/DTO/error/message/cookie/effective-status/evidence decisions; user sign-off recorded 2026-09-14. No code implementation evidence required. User approved the core contract, cookie, evidence, HTTP403 unresolved error and complete error/message/action catalog. W01/T16 = DONE (documentation/audit only); W02/T17+ implementation remains NOT EXECUTED.


## W01/T16 approved contract - DONE

W01 (FE docs) and T16 (BE docs/read-only audit) are TWO SIDES OF ONE contract gate. Neither waits for implementation of the other. User sign-off is recorded; the documentation prerequisite for W02/T17+ is satisfied; no runtime code, tests or DB mutation is authorized in this phase. This APPROVED packet supersedes earlier candidate/cookie/message placeholders. W01/T16 = DONE; runtime work is not executed or authorized by this documentation update.

### A. Verification evidence solution and code audit

Audited source writers of Users.EmailVerifiedAtUtc:
1. VerifyEmailCommandHandler: verified Firebase ID token + EmailVerified=true + existing eligible PendingEmailVerification account -> server UTC timestamp persisted on activation.
2. GoogleAuthCommandHandler: validated google.com provider, verified-email claim and usable email -> timestamp on NEW Traveler creation only. It does not supply missing persisted evidence for an existing legacy TourOperator.
RegisterTraveler initializes PendingEmailVerification, no verified timestamp. EF maps the existing property to Users.email_verified_at. No client-writable verification timestamp or database seed assignment was found in inspected source/database scripts. Tests/fake values are not production provenance.

APPROVED MVP evidence mechanism: use the PERSISTED Users.EmailVerifiedAtUtc read from DB, under the same trusted-server-controlled data assumption as account/role data. Require a non-null UTC timestamp with CreatedAtUtc <= EmailVerifiedAtUtc <= BE current UTC. No profile/status/FE/token-response inference. A future-dated or pre-creation timestamp is unresolved, not automatically repaired. DB is authoritative for MVP; a valid persisted marker is sufficient. Suspicious/imported/manual records need operational audit before migration/release, not whole-DB audit before implementing resolver. Actual DB contents were not queried or changed.

VerifyEmailResponse fallback (user.EmailVerifiedAtUtc ?? now) is computed response data, NOT persisted evidence. NULL stays insufficient even if a prior response reported a timestamp or current Google identity is verified. Legacy resolver never writes a marker, activates DB account or calls Firebase to patch missing evidence. Ordinary password/refresh/API eligibility remain independent of new Firebase calls. A different evidence/backfill mechanism requires a separate reviewed decision.

Resolver order/matrix remains as approved: validate credential/Google evidence; load current account/role; handle PendingEmailVerification/Locked/Inactive; before legacy rejection resolve exact PendingApproval/PendingApproval or Rejected/Rejected with matching profile/role and evidence above. PASS -> effective response status Active and current profile applicationStatus, no DB status update. FAIL ->403 auth.account_state_unresolved, no session/new cookie. Same semantics across password/existing Google including re-fetch/refresh/relevant API eligibility. DB Active + unresolved application remains valid session with business denied.

### B. Approved endpoint/request/success schema

POST /api/v1/auth/web/login and /api/v1/auth/web/admin/login accept application/json:
{"email":"user@example.com","password":"...","keepMeSignedIn":false}
email/password required non-null strings; trim email before validation, BE lowercase lookup; password nonempty and untouched. keepMeSignedIn optional boolean default false; null/wrong type invalid. Reject malformed JSON and unsupported content type. No role/status supplied by client authorizes access; unknown extra members follow existing JSON skip behavior.

POST /api/v1/auth/web/google accepts application/json {"idToken":"...","keepMeSignedIn":false}; ID token body-only, not altered; missing/empty -> AUTH_TOKEN_MISSING; default boolean rule same as above.

POST /api/v1/auth/web/verify-email takes Firebase Bearer, no body; it neither requires nor establishes TripMate session. Refresh/sign-out remain separately reviewed session/dependency endpoints, not core implementation.

Sign-in HTTP200 ApiResponse envelope data:
{"userId":123,"email":"operator@example.com","fullName":"Operator","role":"TourOperator","status":"Active","applicationStatus":"PendingApproval","accessToken":"<access token>","accessTokenExpiresAtUtc":"2026-09-14T10:15:00Z"}

userId: positive integer JSON number (existing BE long; current Web must handle only safely representable IDs, a future large-ID transport contract is separate).
email: normalized non-null string; fullName: non-null string (existing entity default empty permitted, UI may display email).
role: Traveler/TourOperator/Administrator string enum.
status: effective authentication status, success Active; not proof of persisted Active for legacy accounts.
applicationStatus: REQUIRED string | null. Traveler/Administrator null; TourOperator Approved/PendingApproval/Rejected from recognized profile, otherwise null and application-unresolved UI. Never omit or assume approved.
accessToken: nonempty string; accessTokenExpiresAtUtc: UTC ISO8601 string. Google adds isNewAccount:boolean. No refreshToken field in any Web response.
Verification success same envelope data {"emailVerified":true}; no auth context/session.

### C. Approved cookie name and attributes

Name = tripmate_refresh (FINAL/APPROVED).
HttpOnly=true; Secure=true production; SameSite=Lax; Domain omitted; Path=/api/v1/auth.
Keep me signed in OFF: session cookie, omit persistent Max-Age/Expires.
ON: persistent cookie expiry at original refresh expiry, maximum seven days after sign-in.
No rotation/sliding expiry. Sign-out deletes same name/path/domain scope. FE credentials: include; no raw refresh token storage/access.
Production HTTPS SAME SITE required, exact FE-origin CORS + credentials. Dev localhost may use Secure=false for local HTTP only, no dev origins/exception in production. Different-site deployment requires review before SameSite=None.
Access15min memory-only. Cookie hardening/deployment limitations remain approved MVP scope.

### D. Approved error/message/action catalog (core Web)

Exact copy below is English to match existing Web auth UI/mapper language, except previously approved Vietnamese Admin/legacy/context messages. Scope keys by endpoint/field where the same code has different meanings. Do not blindly reuse MSG14 verification-link copy for a Firebase ID token rejection. Tables describe target Web contract, not currently implemented error mappings.

| Applies / trigger | HTTP | Code or structured discriminator | Exact FE message | Action |
| --- | --- | --- | --- | --- |
| Password/Admin missing email | 400 | field email / MSG01 | Please enter your email. | Focus email, preserve other values |
| Password/Admin malformed email | 400 | field email / MSG02 | Invalid email format. Please enter a valid email address. | Focus email |
| Password/Admin missing password | 400 | field password / MSG01 | Please enter your password. | Focus password, no strength rule |
| Web invalid JSON/boolean/model binding | 400 | auth.request_invalid (new Web-specific APPROVED code) | Unable to submit sign-in. Please check your details and try again. | Keep form, correct request, no auto retry |
| Web wrong Content-Type | 415 | HTTP415 fallback if no code | Unable to submit sign-in. Please try again. | Contract error, no automatic retry |
| Password/Admin unknown email/wrong password/no hash | 401 | auth.invalid_credentials | Invalid email or password. Please try again. | Keep form, allow editing, no refresh interceptor |
| Password/Admin unverified account | 403 | MSG_UNVERIFIED | Please verify your email before signing in. | Recovery at most once; if not Firebase verified show resend |
| Existing Google unverified TripMate account | 403 | MSG_UNVERIFIED | Please verify your TripMate email before signing in. | Direct password/verification flow, no Google auto recovery |
| Any account Locked | 403 | auth.account_locked | Your account is locked. Please contact support. | Stop auth, support; failed login preserves existing session |
| Any account Inactive/unsupported restricted state | 403 | auth.account_inactive | Your account is inactive. Please contact support. | Stop auth, support |
| Admin entry non-admin eligible account | 403 | auth.admin_access_required (new) | Tài khoản này không có quyền truy cập khu vực quản trị. Vui lòng đăng nhập tại trang dành cho người dùng. | Public sign-in link; no new session/cookie |
| Google Administrator | 403 | auth.admin_google_sign_in_disabled | Administrator accounts must sign in with email and password. | Password sign-in link, no auto email fill |
| Legacy insufficient/conflicting eligibility | 403 | auth.account_state_unresolved (new) | Chưa thể xác định trạng thái tài khoản. Vui lòng liên hệ hỗ trợ. | No session; support, no activation |
| Google missing/empty body token | 400 | AUTH_TOKEN_MISSING | Unable to complete Google sign-in. Please try again. | User may retry popup explicitly |
| Google invalid token/wrong provider/missing provider/email | 401 | AUTH_TOKEN_INVALID | Your Google authentication could not be verified. Please try again. | Explicit new Google attempt, no raw SDK text |
| Google Firebase email false/missing | 403 | MSG_EMAIL_NOT_VERIFIED | Your Google account email could not be confirmed as verified. Please verify it with Google and try again. | No TripMate resend/sync |
| Google Firebase infrastructure unavailable | 503 | auth.firebase_unavailable | Google authentication service is temporarily unavailable. Please try again later. | Preserve form, explicit retry |
| Web verify missing Bearer | 401 | AUTH_HEADER_MISSING | Unable to confirm email verification. Please sign in and try again. | Reauthenticate Firebase, no TripMate session |
| Web verify invalid/expired Firebase token | 401 | MSG14 | Your verification session is invalid or has expired. Please sign in and try again. | Fresh evidence via Firebase; no link-invalid inference |
| Web verify Firebase not verified | 403 | MSG_EMAIL_NOT_VERIFIED | Please verify your email before signing in. | Password verification instructions/resend, stop recovery |
| Web verify missing usable token email | 400 | auth.verification_email_missing (new) | Unable to identify the email being verified. Please sign in and try again. | No sync/session, explicit retry/support |
| Web verify account missing | 400 | MSG_USER_NOT_FOUND | Account not found. Please register first. | Registration link, no auto account creation |
| Web verify Firebase infra unavailable | 503 | auth.verification_unavailable (new) | Email verification is temporarily unavailable. Please try again later. | Preserve state, stop current recovery; explicit retry |
| Any applicable rate limit | 429 | HTTP429 / Retry-After fallback | Too many attempts. Please wait before trying again. | Honor Retry-After; no session invalidation |
| Internal/DB error with legacy generic code | 500 | MSG127 if emitted; otherwise HTTP500 fallback | Something went wrong. Please try again later. | Preserve form; no automatic sign-in retry |
| Service failure without known code | 502/503/504 | HTTP5xx operational fallback | TripMate service is temporarily unavailable. Please try again later. | Preserve form/state, explicit retry |
| Network/CORS transport failure | No HTTP | NETWORK_ERROR client discriminator | Unable to connect to TripMate. Please check your connection and try again. | Preserve form/state, retry; do not guess CORS cause |
| Client request timeout | No HTTP | REQUEST_TIMEOUT | Request timed out. Please try again. | Preserve form, no blind login resubmit |
| Unexpected successful auth response | 200 malformed | INVALID_AUTH_CONTEXT client discriminator | Chưa thể hoàn tất đăng nhập. Vui lòng thử lại. | Fail closed, discard access, attempt sign-out dependency |
| Unknown code/nonconforming response | Any unexpected | UNKNOWN_ERROR client fallback | Unable to complete sign-in. Please try again later. | No raw text/role/home guess; preserve safe local state |
| Valid TourOperator unresolved application | 200 valid session | APPLICATION_STATE_UNRESOLVED client state | Chưa thể xác định trạng thái hồ sơ Partner. Vui lòng thử lại hoặc liên hệ hỗ trợ. | Keep valid session, deny business; manual refresh dependency |
| Cleanup temporarily fails | Network/5xx | CLEANUP_FAILED client state | Chưa thể hoàn tất việc kết thúc phiên đăng nhập. Vui lòng thử lại. | Remain locally unauthenticated, do not claim revoke; no required persistent marker |

Catalog completeness includes missing code fallbacks because current model-binding/ValidationProblemDetails and generic500 do not guarantee an errorCode. New Web contract may supply auth.request_invalid for Web binding failures without rewriting global/Mobile errors. Field validation needs approved field codes, not raw FluentValidation strings. A server-error fallback is client handling, not a fabricated BE code. Rate-limit infrastructure is not newly mandated by this catalog.

### E. Firebase SDK and resend local cases

| Stable Firebase client code | Exact FE message | Action |
| --- | --- | --- |
| auth/popup-closed-by-user / auth/cancelled-popup-request | No message | Silent cancellation; unlock |
| auth/popup-blocked | Please allow popups for TripMate and try again. | Explicit user retry, no redirect/reopen fallback |
| auth/network-request-failed | Unable to connect to TripMate. Please check your connection and try again. | Preserve form, retry |
| auth/too-many-requests | Too many attempts. Please wait a few minutes before trying again. | Resend cooldown60sec where applicable; no guarantee after expiry |
| auth/invalid-credential / auth/wrong-password / auth/user-not-found during password recovery/resend authentication | Invalid email or password. Please try again. | Keep form, stop current recovery |
| auth/invalid-email | Invalid email format. Please enter a valid email address. | Focus email |
| Firebase session absent/mismatched for resend | Please sign in with the email you want to verify before requesting a new link. | Authenticate exact account; do not send another user's email |
| Unlisted SDK error | Unable to complete sign-in. Please try again later. | Safe fallback, unlock; no exception display |

### F. Response-format audit correction and compatibility

Current AuthController verify-email uses success envelope; most failures use HandleFailure -> ProblemDetails/errorCode; missing Bearer uses explicit Error envelope. Generic validation500/binding do not always have code. Earlier wording that all verification failures were envelopes was inaccurate.

APPROVED NEW Web verify-only contract: success envelope, all failures ProblemDetails/errorCode where explicitly defined above (framework/operational fallback as catalog). This format clarification is APPROVED; do not globally change legacy Mobile missing-header/failure consumers. Existing /auth/login, /auth/google and /auth/verify-email Mobile token fields and semantics remain; no token removal or client-header dispatch. Missing-role Mobile bug remains separate.

### G. Gate outcome / why these changes

Code provenance audit completed for inspected writers; live imported/manual-data integrity not proven. Persisted marker rule and required applicationStatus shape are now approved. Cookie tripmate_refresh, core endpoints/DTO, HTTP403 account_state_unresolved, error/message/action catalog and Web verify-only success/failure format are FINAL/APPROVED. W01/T16 = DONE. Suspicious live-data audit is release work, not an implementation blocker. No code/test/DB changes in this gate.

Using existing server-controlled timestamp avoids new schema/Firebase calls; missing data fails closed instead of guessing. Explicit cookie name prevents W02 invention. Endpoint/field-scoped copy avoids MSG14/Google verification confusion. Joint gate avoids circular FE/BE dependency and splits session/owning-UC work from core.
## Approved W01/T16 clarification - applicationStatus and evidence

applicationStatus is REQUIRED in EVERY successful Web sign-in and refresh authentication-context response, type string | null; never omitted. Traveler and Administrator -> null. TourOperator with recognized profile -> Approved/PendingApproval/Rejected exactly; missing/unresolved/unsupported profile -> null. BE must serialize this field even if global JSON configuration normally omits nulls. FE validates key presence and type; null for a valid TourOperator triggers application-unresolved UI, not auth cleanup. A missing field is a contract violation, never treated as approved; retain the previously approved valid-session application-unresolved handling rather than signing out solely for application data. Unknown/malformed application status from a nonconforming response remains fail-closed for business access. Verification-only responses are NOT authentication context and do not add applicationStatus. Existing Mobile contract is not silently changed.

Accepted MVP evidence: DB is authoritative; persisted Users.EmailVerifiedAtUtc with CreatedAtUtc <= timestamp <= BE current UTC is sufficient evidence for legacy resolver. NULL/implausible timestamp -> account_state_unresolved. No additional per-record provenance proof or whole-production-DB audit required to implement the resolver. Audit suspicious/imported/manual legacy data before migration/release of those records; do not turn that operational audit into an implementation gate. No data repair/backfill/migration in resolver.

Plan verification: assert applicationStatus key present for Traveler/Administrator (null), each recognized operator status, unresolved operator (null), sign-in/refresh. Assert valid stored evidence passes, NULL/future/pre-creation fails with no session/status mutation. Add serialization coverage to prevent null omission. W01/T16 evidence mechanism and applicationStatus shape are APPROVED by user; Cookie/error-copy decisions are now APPROVED too; this documentation update does not authorize or execute runtime implementation.


## User sign-off record - 2026-09-14

APPROVED: core Web endpoints/request/DTO contract; cookie tripmate_refresh; HTTP403 auth.account_state_unresolved; current error/message/action catalog including Web auth.request_invalid; Web verify-only success ApiResponse and defined failures ProblemDetails/errorCode; fullName non-null string, empty allowed; applicationStatus always present string | null; DB-authoritative valid verification timestamp evidence. W01/T16 = DONE (docs/audit contract gate only). No implementation/test/migration execution by this update. Separate refresh/sign-out schema and deferred owning-UC tasks are not declared DONE. No commit/push/new branch.


## W02 implementation status - 2026-09-14

Web API/session boundary locally implemented and verified (81 FE tests, lint/typecheck/build passed). New webLogin/webGoogleAuth use approved Web routes and cookies, validate context before memory acceptance, persist only noncredential presentation metadata and preserve A on rejected/network B attempts. Expired access is unavailable; saved metadata cannot restore auth. Missing/malformed operator application state remains unresolved with valid authentication. Browser-only acceptance prevents server-process session state.

Existing forms/Register callers await W03/W04/D01 migration; their old saveTokens storage is not declared compliant yet. No end-to-end/browser acceptance, refresh restoration, sign-out cookie revocation or multi-tab completion is claimed. Approved W01 contract remains unchanged. See plan W02 execution evidence.


## W03 implementation status - 2026-09-14

Existing public/Admin SignInForm now uses approved Web password APIs and Keep me signed in, removes Admin simulation and normal password-success browser token writes/Firebase sync. Supported role from validated server context drives Admin/Traveler navigation; Partner routing awaits W06. Scoped password error mapping follows approved code/HTTP catalog, with field errors and no raw server detail. Local tests: 90 passed, lint/typecheck/build passed.

Old public MSG_UNVERIFIED auto-recovery remains pending explicit user decision to remove it until W05. Its Mobile verification session + saveTokens path is not declared compliant or accepted by these tests. Google/Register migration and full core/session/dependency acceptance remain pending. Contract packet unchanged. See plan W03 execution evidence.


## W03 approved interim verification behavior - 2026-09-14

User approved removal of legacy auto-recovery. On password MSG_UNVERIFIED, SignInForm now displays approved guidance/resend without Firebase automatic authentication, Mobile verifyEmail session issuance, saveTokens or automatic navigation/retry. Resend remains explicit; password submit can be repeated manually. This is an interim behavior until W05 implements the approved fresh-token Web verify-only sync followed by one bounded full Web login retry. Target W01/W05 contract unchanged; W05 is not marked complete.

W03 locally verified: 93 FE tests passed, lint/typecheck/build passed. Google/Register legacy credential consumers and full core/session/dependency/live acceptance remain pending. Earlier W03 recovery-decision-pending statements are historical. See updated plan/evidence.


## W04 implementation status - 2026-09-14

Explicit user-approved Google migration locally implemented: existing SignInForm requires consent before Firebase popup, calls webGoogleAuth with current Keep choice and removes old Google saveTokens. Feature-local native dialog reuses Terms/Privacy content, supports Cancel/Escape and TourOperator registration link. English controls: Agree and continue with Google, Register as TourOperator, Cancel, Back to consent, consistent with current English Web UI. Consent is UX/legal intent, not BE authorization.

Validated Web BE context is authoritative for identity/role/effective account state. Firebase identity does not drive session persistence/role routing. Traveler routes home; operator context remains for W06. No activation/unlock/state-change call, Mobile session API, auto-recovery or manual Firebase/refresh credential persistence. Google provider-verification errors have separate copy and no TripMate resend; cancellation is silent and popup blocking requires explicit retry. Admin rejection directs password without guessed email.

Local verification: 108 FE tests pass; lint/typecheck/build pass. Native dialog browser focus behavior, live Firebase/BE/SQL and cookie persistence not proved by jsdom/controlled HTTP tests. SDK configuration unchanged. W05 recovery, W06 Partner routing, D01 Register and session/cleanup acceptance remain pending. Target W01 contract unchanged. See W04 plan/evidence.


## W05 implementation status - 2026-09-14

Approved password recovery implemented at Web service boundary: initial Web login HTTP403 MSG_UNVERIFIED -> submitted-account Firebase authentication -> matching-email checks before/after reload -> getIdToken(true) -> Web verify-only -> exactly one full Web login retry. Retry failure cannot enter recovery again. Other account restrictions do not trigger recovery; sync/evidence/operational failure stops before retry. Firebase evidence never sets FE account state/role; final BE login context remains authoritative.

Web verify-only client sends no body or cookie (credentials omit), parses exact {emailVerified:true} envelope, rejects session/role-bearing verify responses and preserves existing auth memory. Form never authenticates/routes from verify result. Full final password response drives existing Traveler/Admin behavior; Partner routing remains W06. No legacy Mobile verification/saveTokens/SDK persistence setting reintroduced.

Resend reuses only matching Firebase user or authenticates exact submitted credentials, rejects identity mismatch and edited-form-email mismatch, sends email without BE verification/session call. Success or provider rate limit starts 60-second cooldown; transport failure allows retry. Countdown expiry does not promise provider acceptance. Exact endpoint-scoped token/evidence/SDK error catalog applied without raw message matching.

No automatic FE activation/unlock/state/role mutation: existing T19 server-verified PendingEmailVerification sync semantics remain unchanged; no BE/DB code/data actions in W05. D01 Register compatibility migration remains separate. Local verification: 131 FE tests pass; lint/typecheck/build pass. Browser/Firebase/DB live remains unverified, not full UC04 acceptance. W06/W07/session/dependency work pending. See plan and W05 evidence.


## W06 implementation note - 2026-09-14

Approved Partner routing locally implemented from final validated Web BE context only. Effective Active plus recognized current role/application drives navigation: Traveler home, Administrator /admin, operator Approved /partner, PendingApproval/Rejected /partner/application. Missing/unknown application remains authenticated and displays application-unresolved without inferred approval or pending fallback. Firebase identity, email, cached metadata and verification-only output are not route authority.

Application route no longer accepts query-string status or prototype pending default. It displays accepted BE application context only, with no invented profile data, resubmit/approval business behavior or status writes. /partner has the approved plain development placeholder, available only in the route projection for Approved operators. This is login-context presentation, not live account monitoring/server authorization. Refresh/reload restoration and manual unresolved refresh retry remain S01; no fake refresh added to W06.

Local evidence: 147 full FE tests passed; final focused 49 tests, lint/typecheck/build passed. No activation/unlock, new recovery, token persistence, server cleanup or BE/DB/Mobile changes. Browser/Firebase/DB live remains unverified; W06 is IMPLEMENTED / LOCALLY VERIFIED, not full UC04 acceptance. See W06 plan/evidence. Earlier implementation notes describing W06 as pending are historical.


## W03-W06 authenticated-navigation integration note - 2026-09-14/15

Scoped integration follow-up (explicitly not a new W09 package): PublicNavigation now reads the in-memory Web auth context (AuthStorage) as its single client-side source of truth via useSyncExternalStore, so an authenticated Traveler/Admin/Partner no longer sees the unauthenticated "Sign In" state after a successful Web password/Google login and client-side navigation. Legacy localStorage 'tripmate_access_token' and Firebase onAuthStateChanged are no longer Web session sources for the navbar. An additive AuthStorage.subscribe notification was introduced so context changes (accept/clear) update the navbar without a full reload. Sign Out clears the client session only; it does not revoke the server session or clear the HttpOnly refresh cookie (D02).

This satisfies the AC09 memory-access/correct-UI presentation for same-tab client navigation. It does not implement reload/reopen restoration, refresh coordination, or remembered-session recovery — those remain S01, and F5/reopen still requires sign-in until then. No saveTokens, no access-token persistence, no Firebase session-truth dependency, no Mobile/BE change, no authorization guard. Local evidence: 152 full FE tests passed (baseline 147 + 5 new), lint/typecheck/build exit 0. Browser/BE/Firebase/DB live remains unverified; IMPLEMENTED / LOCALLY VERIFIED, not full UC04 acceptance. See the integration plan/evidence sections.

Partner-item navigation decision (same round, authoritative): the "Partner" navbar entry is shown only to Guests (the future UC-02 "Register Tour Operator Account" entry point) and TourOperators. An authenticated Traveler sees no Partner item and no operator-registration CTA, and /partner/register is not exposed from PublicNavigation for Travelers; an authenticated Administrator sees no Partner/registration entry (Admin navigation is preserved separately). A TourOperator context projects the Partner item through the existing authoritative destination mapping (Approved -> /partner, Pending/Rejected/unresolved -> /partner/application, W06 fail-closed preserved with no invented state). Guest keeps generic Partner -> /partner/register. An interim revision of this round described a "Become a Tour Operator" CTA for Travelers; that statement was incorrect and is superseded — no such CTA exists. Because Traveler and Tour Operator are fully independent accounts (BR6: no upgrade/link/merge), no account linking, role mutation or Traveler-identity reuse is introduced, and no S01/D02 behavior is claimed. The separate static PartnerShell header on /partner/register is a known open presentation decision, not migrated in this round. Evidence: 159 full FE tests passed, lint/typecheck/build exit 0.


## S01 minimal session restoration status - 2026-09-15

Approved S01 scoped minimally to unblock CR-11 direct-route authorization (not CR-11 guards, not D02, not UC-02, not dashboard/resubmit, not auth redesign). This supersedes the earlier integration-note statement that F5/reopen still requires sign-in: a server-authoritative restore path now exists.

POST /api/v1/auth/web/refresh redeems the existing HttpOnly tripmate_refresh cookie (no body) as the sole restore credential: it hashes the token, validates the dbo.RefreshTokens row, rejects missing/revoked/expired sessions as invalid, resolves the user, re-runs the same AccountEligibilityResolver used by login (so account gates and the current OperatorProfiles application status apply authoritatively, never inferred from client state/email/Firebase/metadata), and returns the identical WebAuthResponseDto context shape as login with a fresh short-lived access token. The refresh row is not rotated and no new cookie is set; logout/revoke stays D02.

On the client, webRefresh() calls the endpoint with credentials:'include' and repopulates AuthStorage only through the existing strict validator; a definitive 401/403 leaves the user genuinely unauthenticated, a network error is recoverable and never clears an existing session, and a malformed success is discarded. The useWebSession() hook exposes explicit 'restoring' | 'authenticated' | 'unauthenticated' so a missing in-memory context is never treated as Guest before restore settles.

Runtime wiring (corrected 2026-09-15): an initial integration claimed the provider was mounted but a manual browser F5 on /partner/application proved it was not (app/layout.tsx only imported WebSessionProvider, and PartnerContextPage used a no-op subscription that rendered "Please sign in" before any restore). That premature claim is superseded by the verified correction below. WebSessionProvider is now actually rendered once in the root layout (app/layout.tsx <body><WebSessionProvider>{children}</WebSessionProvider></body>) so every Web route — including /partner and /admin, which do not render the navbar — drives the single-flight cookie restore on cold start before any role/status-sensitive UI decides Guest; the provider runs the restore only and does not gate or redirect. Both PublicNavigation and PartnerContextPage now consume useWebSession(): while status is 'restoring' they render a neutral accessible placeholder (never Guest/sign-in/wrong-role content); 'unauthenticated' shows the existing sign-in content; 'authenticated' uses the authoritative restored context (PartnerContextPage preserves the W06 projection: Approved -> approved area, PendingApproval/Rejected -> application status, null -> fail-closed unresolved message, no inference). This is restoration, not authorization: no CR-11 route guard or access matrix is enforced yet — CR-11 is the next task and now has a real-composition-verified restoration mechanism to build on.

Invariants held: login behavior unchanged; no access token in localStorage/sessionStorage; persisted tripmate_user display metadata alone never authenticates (explicitly tested). Local evidence: BE 364 passed / 0 failed / 8 skipped (BE unchanged); FE 185 passed / 0 failed / 18 files (including a new real-cold-start runtime regression suite that renders the actual app/layout and app/partner pages — 5/6 failed pre-fix reproducing the browser bug, all pass post-fix), lint (WebSessionProvider unused-import warning eliminated) / typecheck / build exit 0. Live browser/SQL round-trip still requires the user's manual F5 verification; broader S01 coordinator (bounded eligible-401 retry, manual retry joining the same single-flight, transient handling) remains NOT EXECUTED. CR-11 route guards are now implemented (see the CR-11 section below). See the S01 plan/evidence sections.


## CR-11 Partner direct-route authorization status - 2026-09-15

Approved after S01 restoration was accepted DONE / LOCALLY + MANUALLY VERIFIED. Hiding navigation links is not authorization; a signed-in user requesting a Partner screen outside their role/status permission must be refused even on a manually typed URL. Authorization is evaluated only after S01 restoration settles and never treats 'restoring' as Guest; role, effective account status and TourOperator application status come only from the authoritative restored Web context — never from Firebase, email, persisted tripmate_user metadata, the URL/query string, or client guesses.

A single shared policy (partnerRouteDecision) plus one reusable guard (PartnerRouteGuard) wrap the four Partner routes (/partner/register, /partner, /partner/application, /partner/application/resubmit); the guard reuses useWebSession/WebSessionProvider rather than adding a second restoration mechanism. While restoring it renders a neutral accessible placeholder and issues no redirect; once settled it renders children on allow or router.replace on deny, so the unauthorized screen is never committed. Approved matrix: register — guest ALLOW (future UC-02 entry), Traveler DENY -> home, Administrator DENY -> admin, operator Approved -> /partner, PendingApproval/Rejected/unresolved -> /partner/application (W06 fail-closed preserved, no inferred state); /partner — ALLOW only Active TourOperator Approved, other operator states -> /partner/application, Traveler -> home, Administrator -> admin, guest -> public sign-in; /partner/application — PendingApproval/Rejected/unresolved ALLOW (unresolved shows the existing fail-closed message), Approved -> /partner, Traveler/Administrator/guest denied as above; /partner/application/resubmit — resubmission is its own permission and does NOT inherit the application screen: ALLOW only Rejected; Approved -> /partner, PendingApproval (still under review) and unresolved -> /partner/application with no inferred Rejected, Traveler -> home, Administrator -> admin, guest -> public sign-in. Wrong-role authenticated users are never shown a misleading "please sign in" message; guests use the public sign-in destination.

Server-side CR-11 remains a documented prerequisite for future actions: no UC-02 registration / dashboard / resubmit action endpoints exist yet, so nothing further is enforced server-side today; existing BE actions keep their role-aware authorization. When those endpoints are implemented, server-side authorization from the access token is mandatory and this client guard alone is not a security boundary. No S01 redesign, D02, UC-02 backend, dashboard, or resubmit/rejection feature was added.

Local evidence: FE 237 passed / 0 failed / 20 files (baseline 185 + 52 CR-11 cases: 28 policy matrix including the dedicated resubmit key, 22 guard runtime including restoring/hard-navigation/warm-memory, 2 real /partner/register cold-start composition), lint (0 warnings) / typecheck / build exit 0, BE unchanged. Historical W06/S01 evidence retained; two S01 runtime tests were aligned to the approved matrix (settled guest on the application route now redirects to sign-in). IMPLEMENTED / LOCALLY VERIFIED, human cross-review + manual browser verification pending; not full UC04 acceptance. See the CR-11 plan/evidence sections.

# TripMate — Web Scope / UI Coverage Matrix

> **Status:** REBASELINED FOR REVIEW — requirements conflicts remain unresolved. This traceability matrix does not amend the SRS or authorize disputed implementation.

## Source of Truth and Baseline

- Canonical SRS: [`Report3_Software-Requirement-Specification.docx`](https://docs.google.com/document/d/1VwPkqRyC6ZlbXBQC0ztdektt0vAyE3qt/edit) — **original non-V2**.
- Snapshot inspected: **2026-11-08**, SHA-256 `cd97de4bd74df3b5cdc159171ee964093d4bb7ba99ca65b52232f88b11de1c6b`, 9,571,142 bytes.
- Requirement IDs in this matrix follow **SRS Table 3 — Use Case Description**, covering **UC-01 through UC-75** (75 entries). Detailed §§3.2–3.10, screen descriptions §3.1.2 and authorization Table 5 were reviewed; conflicts are explicitly recorded below.
- `Capstone_Docs` history and existing UI specs are evidence only; neither V2 nor GitHub/Jira nor an implementation overrides the canonical SRS without explicit, traceable approval.
- Existing Web Screen means a Web screen **specification** under `ux/web-screen-specifications/`, **not proof of implementation or production deployment**.

## Platform/Scope Legend

| Classification | Meaning |
|---|---|
| `SHARED_WEB_MOBILE` | Detailed SRS explicitly supports responsive Web and Flutter Mobile. |
| `WEB_CONFIRMED` | Web UI explicitly confirmed; no implied rejection or confirmation of Mobile support. |
| `MOBILE_ONLY` | Detailed SRS explicitly limits the specific function to Flutter. |
| `INTERNAL_WEB_ONLY` | Staff/Administrator Web administration workspace; individual permissions may be disputed. |
| `WEB_WORKFLOW` | Broader system process with an explicit Web interaction or visible state. |
| `NON_SCREEN` | Action/system operation requiring no dedicated Web page, though existing views may show results. |
| `CONFLICT_WEB_MOBILE` | Official SRS sections disagree on Web ownership; **owner decision required**. |

## Canonical Web UC Coverage

| UC | SRS Table 3 Use Case | Actor (SRS Catalogue) | Web Supported | Existing Web Screen Spec | Web Screen Needed | Requirements Trace / Caveat | FE Source Status |
|---|---|---|---|---|---|---|---|
| UC-01 | Register Traveler Account | Guest | SHARED_WEB_MOBILE | Traveler Registration; Verify Account | YES — Batch 1 | §3.2.1: public Web and Mobile; Pending Verification via email code; Google can create Active account. | PARTIAL |
| UC-02 | Register Tour Operator Account | Guest | SHARED_WEB_MOBILE | Tour Operator Registration; Application Submitted state; Operator Application Status | YES — Batch 1 | §3.2.2 explicitly supports both Flutter and Next.js. Operator registration awaits Staff approval; submitted notice is a state, not separate screen. | PARTIAL |
| UC-03 | Resubmit Tour Operator Application | Tour Operator | SHARED_WEB_MOBILE | Operator Application Status; Resubmit Application | YES — Batch 1 | §3.2.3 explicitly supports both platforms; rejected applicant reuses account, not new registration. | PARTIAL |
| UC-04 | Sign In | Guest | SHARED_WEB_MOBILE | Public Sign In; Admin Login | YES — Batch 1 | Table 3 actor is Guest; §3.2.4 lists Traveler/Operator/Administrator, while authorization Table 5 also grants Staff administration login. ROLE_CONFLICT. | PARTIAL |
| UC-05 | Sign Out | Traveler / Tour Operator / Staff / Administrator | NON_SCREEN | None | NO dedicated page | Menu/sign-out action on existing shell; Table 3 includes Staff but detailed §3.2.5 omits Staff. ROLE_CONFLICT. | PARTIAL |
| UC-06 | Reset Password | Guest | SHARED_WEB_MOBILE | Password Recovery (public and Admin contexts; code/new-password states) | YES — Batch 1 | §3.2.6 email reset code and new-password states; Table 5 lists Staff administration reset context, detailed UC omits Staff. ROLE_CONFLICT. | PARTIAL |
| UC-07 | Change Password | Traveler / Tour Operator / Staff / Administrator | SHARED_WEB_MOBILE | None | DEFERRED — shells | §3.2.7 authenticated account settings; Table 3 and authorization Table 5 include Staff, detailed actor list omits Staff. ROLE_CONFLICT. | PARTIAL |
| UC-08 | Update Traveler Profile | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.2.8: Traveler Profile/Edit Profile on responsive Web and Flutter. | PARTIAL |
| UC-09 | Update Travel Preferences | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.2.9: preferences with interest tags, styles, budget; shared platforms. | PARTIAL |
| UC-10 | Create Scheduling Request | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.3.1: Scheduling Request form shared across Web and Flutter. | PARTIAL |
| UC-11 | View Suggested Itinerary | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.3.2: suggested itinerary timeline and map overview on Web and Flutter. | PARTIAL |
| UC-12 | Explore Points of Interest | Guest / Traveler | SHARED_WEB_MOBILE | None | YES — later batch | Table 3 and Table 5 include Guest POI exploration; §3.3.3 detailed actor names Traveler only. ROLE_CONFLICT. | PARTIAL |
| UC-13 | Navigate Route | Traveler | MOBILE_ONLY | None | NO Web screen | §3.3.4 real-time navigation UI is Flutter-only. | OUT_OF_SCOPE |
| UC-14 | Receive Real-Time Alerts | Traveler | MOBILE_ONLY | None | NO Web screen | §3.3.5 real-time trip alerts within Mobile navigation; no corresponding Web alert screen. | OUT_OF_SCOPE |
| UC-15 | Confirm Re-routing | Traveler | MOBILE_ONLY | None | NO Web screen | §3.3.6 rerouting proposal/confirmation is Flutter-only. | OUT_OF_SCOPE |
| UC-16 | Download Offline Map & Itinerary | Traveler | MOBILE_ONLY | None | NO Web screen | §3.3.7 offline map/itinerary download is Flutter-only. | OUT_OF_SCOPE |
| UC-17 | Create Travel Group | Traveler | MOBILE_ONLY | None | NO Web screen | §3.4.1 create travel group is Flutter-only. | OUT_OF_SCOPE |
| UC-18 | Invite Group Members | Traveler | MOBILE_ONLY | None | NO Web screen | §3.4.2 invite members by code/QR is Flutter-only. | OUT_OF_SCOPE |
| UC-19 | View Group Members | Traveler | MOBILE_ONLY | None | NO Web screen | §3.4.3 group members screen is Flutter-only. | OUT_OF_SCOPE |
| UC-20 | Remove Group Member | Traveler | MOBILE_ONLY | None | NO Web screen | §3.4.4 group-host remove action/dialog is Flutter-only. | OUT_OF_SCOPE |
| UC-21 | Leave Travel Group | Traveler | MOBILE_ONLY | None | NO Web screen | §3.4.5 leave group confirmation is Flutter-only. | OUT_OF_SCOPE |
| UC-22 | Configure Group Location Sharing | Traveler | MOBILE_ONLY | None | NO Web screen | §3.4.6 GPS sharing settings are Flutter-only. | OUT_OF_SCOPE |
| UC-23 | Join Shared Group Trip | Traveler | MOBILE_ONLY | None | NO Web screen | §3.4.7 join shared trip by code/QR is Flutter-only. | OUT_OF_SCOPE |
| UC-24 | Search Tours | Guest / Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.5.1: public search on both Web and Mobile. Search, filters and availability follow detailed SRS. | PARTIAL |
| UC-25 | Receive Tour Recommendations | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.5.2: Traveler tour recommendations on both Web and Mobile. | PARTIAL |
| UC-26 | View Tour Details | Guest / Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.5.3: public Tour Details on both Web and Mobile; booking requires Traveler access. | PARTIAL |
| UC-27 | Book Tour | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.5.4: Traveler Booking UI on Web and Mobile. | PARTIAL |
| UC-28 | Make Electronic Payment | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.5.5: payment entry Web/Mobile; gateway-hosted page is external, not TripMate UI. | PARTIAL |
| UC-29 | View QR E-ticket | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.5.6: Traveler QR e-ticket VIEW on Web/Mobile; check-in SCANNING remains UC-43 Mobile-only. | PARTIAL |
| UC-30 | View Commercial Service | Traveler | MOBILE_ONLY | None | NO Web screen | §3.6.1 explicitly calls Commercial Service Detail/Booking UI Flutter-only. | OUT_OF_SCOPE |
| UC-31 | Book Commercial Service | Traveler | CONFLICT_WEB_MOBILE | None | HOLD — owner decision | Product Overview says commercial-service booking is Mobile-specific; §3.6.2 Interface explicitly says Flutter AND Next.js. AMBIGUOUS_REQUIREMENT — no Web inclusion/exclusion decided. | BLOCKED_REQUIREMENT |
| UC-32 | View Trip History | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.7.1: Traveler trip history available Web and Mobile. | PARTIAL |
| UC-33 | Submit Trip Review | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.7.2: post-trip review Web and Mobile. | PARTIAL |
| UC-34 | Update Tour Operator Profile | Tour Operator | WEB_CONFIRMED | None | YES — later batch | §3.8.1 explicitly specifies Next.js Operator Profile; general Product Overview does not prove separate Mobile UI. | PARTIAL |
| UC-35 | Create Tour Package | Tour Operator | WEB_CONFIRMED | None | YES — later batch | §3.8.2.1 Next.js Tour Package create form. | PARTIAL |
| UC-36 | Update Tour Package | Tour Operator | WEB_CONFIRMED | None | YES — later batch | §3.8.2.2 Next.js Tour Package update form; reuse editor and lifecycle guards. | PARTIAL |
| UC-37 | Submit Tour for Approval | Tour Operator | WEB_CONFIRMED | None | REUSE/ACTION — later batch | §3.8.2.3 Next.js tour submission confirmation/action; Staff approves via UC-59. | PARTIAL |
| UC-38 | Create Coupon | Tour Operator | WEB_CONFIRMED | None | YES — later batch | §3.8.3.1 Next.js create coupon form. | PARTIAL |
| UC-39 | Update Coupon | Tour Operator | WEB_CONFIRMED | None | REUSE — later batch | §3.8.3.2 Next.js coupon update; reuse coupon form. | PARTIAL |
| UC-40 | View Customer Bookings | Tour Operator | WEB_CONFIRMED | None | YES — later batch | §3.8.4.1 Next.js Operator customer bookings; scope limited to owned tours. | PARTIAL |
| UC-41 | Cancel Tour Booking | Tour Operator | WEB_CONFIRMED | None | REUSE/DIALOG — later batch | Table 3 actor is Tour Operator, detailed §3.8.4.2 and Table 5 also allow Traveler self-cancellation. ROLE_CONFLICT; distinct authorization scopes. | PLACEHOLDER_LOCKED |
| UC-42 | Confirm Booking Refund | Tour Operator | WEB_CONFIRMED | None | YES/REUSE — later batch | Table 3 and §3.8.4.3 say CONFIRM Booking Refund, NOT Initiate Booking Refund; operator console. Do not conflate with system UC-67. | PLACEHOLDER_LOCKED |
| UC-43 | Check In Traveler by QR Code | Tour Operator | MOBILE_ONLY | None | NO Web screen | §3.8.4.4: camera-based QR check-in scanning is Flutter-only. | OUT_OF_SCOPE |
| UC-44 | View Revenue Report | Tour Operator | WEB_CONFIRMED | None | YES — later batch | §3.8.5.1 Next.js operator revenue report, only own tours. | PARTIAL |
| UC-45 | Export Revenue Report | Tour Operator | WEB_CONFIRMED | None | REUSE/ACTION — later batch | §3.8.5.2 Next.js revenue export dialog/action. | PARTIAL |
| UC-46 | View User Accounts | Staff/ Administrator | INTERNAL_WEB_ONLY | None | YES — role approval hold | Table 3 and authorization Table 5 grant Staff + Administrator role-scoped account views, but §3.9.1.1 says Administrator only. ROLE_CONFLICT; do not implement disputed access. | PLACEHOLDER_UNAVAILABLE |
| UC-47 | Lock User Account | Staff/ Administrator | INTERNAL_WEB_ONLY | None | REUSE/DIALOG — hold permissions | Table 3 and Table 5 grant Staff + Administrator role-scoped locking, but §3.9.1.2 says Administrator only. ROLE_CONFLICT. | PLACEHOLDER_UNAVAILABLE |
| UC-48 | Unlock User Account | Staff/ Administrator | INTERNAL_WEB_ONLY | None | REUSE/DIALOG — hold permissions | Table 3 and Table 5 grant Staff + Administrator role-scoped unlocking, but §3.9.1.3 says Administrator only. ROLE_CONFLICT. | PLACEHOLDER_UNAVAILABLE |
| UC-49 | Approve Tour Operator Application | Staff | INTERNAL_WEB_ONLY | None | REUSE/ACTION — later batch | §3.9.2.1: STAFF approves Tour Operator applications via moderation workspace. | PARTIAL_CONTRACT_CONFLICT |
| UC-50 | Reject Tour Operator Application | Staff | INTERNAL_WEB_ONLY | None | REUSE/DIALOG — later batch | §3.9.2.2: STAFF rejects Tour Operator applications with reason. | PARTIAL_CONTRACT_CONFLICT |
| UC-51 | Create POI | Staff/ Administrator | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.3.1: STAFF and Administrator may create POIs. | IMPLEMENTED_SOURCE |
| UC-52 | Update POI | Staff/ Administrator | INTERNAL_WEB_ONLY | None | REUSE — later batch | §3.9.3.2: STAFF and Administrator may update POIs. | PARTIAL |
| UC-53 | Remove POI | Administrator | INTERNAL_WEB_ONLY | None | REUSE/DIALOG — lifecycle hold | §3.9.3.3: Administrator-only POI removal. Official SRS conditionally allows deletion/deactivation; any soft-delete-only change requires traceable approval. POLICY_HOLD. | MISSING |
| UC-54 | Create Route | Staff | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.4.1: STAFF creates routes; old matrix incorrectly had UC-54 as Remove POI. | PLACEHOLDER_UNAVAILABLE |
| UC-55 | Update Route | Staff | INTERNAL_WEB_ONLY | None | REUSE — later batch | §3.9.4.2: STAFF updates routes. | PLACEHOLDER_UNAVAILABLE |
| UC-56 | Configure Algorithm Parameters | Administrator | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.5: Administrator configures scheduling/matching algorithm parameters. | IMPLEMENTED_SOURCE |
| UC-57 | View Active Trips | Staff | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.6.1: STAFF active trips monitor; no invented intervention rights. | IMPLEMENTED_SOURCE_CONTRACT_CONFLICT |
| UC-58 | View Active Trip Details | Staff | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.6.2: STAFF active trip details; read-oriented. | IMPLEMENTED_SOURCE_CONTRACT_CONFLICT |
| UC-59 | Approve Tour Post | Staff | INTERNAL_WEB_ONLY | None | REUSE/ACTION — later batch | §3.9.7.1: STAFF approves Tour Posts. | PARTIAL |
| UC-60 | Reject Tour Post | Staff | INTERNAL_WEB_ONLY | None | REUSE/DIALOG — later batch | §3.9.7.2: STAFF rejects Tour Posts with reason. | PARTIAL |
| UC-61 | View Platform Bookings | Staff | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.8: STAFF platform-wide booking monitoring; no unapproved booking interventions. | IMPLEMENTED_SOURCE |
| UC-62 | Update Landing Page Content | Staff | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.10: STAFF maintains public landing-page content. | IMPLEMENTED_SOURCE |
| UC-63 | Export Statistical Reports | Administrator | INTERNAL_WEB_ONLY | None | REUSE/ACTION — later batch | §3.9.11: Administrator exports platform statistical reports. | PLACEHOLDER_PENDING_BE |
| UC-64 | View Audit Logs | Administrator | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.12.1: Administrator audit log list/search. | IMPLEMENTED_SOURCE |
| UC-65 | View Audit Log Details | Administrator | INTERNAL_WEB_ONLY | None | YES — later batch | §3.9.12.2: Administrator audit log details. | IMPLEMENTED_SOURCE |
| UC-66 | Handle Weather Warning and Operator Cancellation | Traveler / Tour Operator | WEB_WORKFLOW | None | YES/REUSE — placement hold | §3.10.1: System weather detection, Operator cancellation decision, Traveler notification. Emergency declaration screen on operator OR Web administration workspace; PLACEMENT_CONFLICT; no automatic cancellation. | PARTIAL |
| UC-67 | Process Refund to Traveler | Traveler | NON_SCREEN | None | NO dedicated page — reuse status | §3.10.2: System + gateway perform refund; catalogue lists Traveler. Status on existing Booking Detail/notification Web UI; ACTOR_CONFLICT. | PARTIAL |
| UC-68 | Submit Post-Trip Complaint | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.8.6.1: Traveler complaint Web and Flutter form; 3-day deadline and evidence constraints. | MISSING |
| UC-69 | Respond to Post-Trip Complaint | Tour Operator | WEB_CONFIRMED | None | YES — later batch | §3.8.6.2: Tour Operator console complaint response; full/partial/reject and deadlines. | MISSING |
| UC-70 | Synchronize Offline Trip Data | Traveler | MOBILE_ONLY | None | NO Web screen | §3.10.3 offline Mobile synchronization banner/result; no Web screen. | OUT_OF_SCOPE |
| UC-71 | Schedule Payout Settlement | System | NON_SCREEN | None | NO dedicated page | Catalogue and §3.10.4: scheduled payout is automatic System function; do not add Operator Request Payout UI. | NOT_APPLICABLE_AS_SCREEN |
| UC-72 | View Payout Records | Staff/ Administrator | INTERNAL_WEB_ONLY | None | YES — role approval hold | Table 3 and Table 5 allow Staff/Administrator payout record view, but detailed §3.9.9.1 mentions Staff only. ROLE_CONFLICT. | IMPLEMENTED_SOURCE_CONFLICT |
| UC-73 | Review Failed Payout Settlement | Administrator | INTERNAL_WEB_ONLY | None | REUSE — owner review | Table 3 lists Administrator failed-payout review but no corresponding named detailed function section. UI/actions NOT_VERIFIED. | PLACEHOLDER_UNAVAILABLE |
| UC-74 | Process Payout Settlement | System | NON_SCREEN | None | NO dedicated page | Table 3 and §3.10.5 specify automatic payout, no operator/admin approval; §3.9.9.3 retains Administrator Confirm Payout Settlement. PAYOUT_CONFLICT; do not silently resolve. | CONFLICTING_MANUAL_MODEL |
| UC-75 | Respond to Partial Refund Proposal | Traveler | SHARED_WEB_MOBILE | None | YES — later batch | §3.8.6.3: Traveler accepts/declines partial refund proposal on Web or Flutter within 3 days. | MISSING |

## Classification Totals

| Classification | Count |
|---|---:|
| `SHARED_WEB_MOBILE` | 21 |
| `WEB_CONFIRMED` | 12 |
| `MOBILE_ONLY` | 14 |
| `INTERNAL_WEB_ONLY` | 22 |
| `NON_SCREEN` | 4 |
| `CONFLICT_WEB_MOBILE` | 1 |
| `WEB_WORKFLOW` | 1 |
| **Total** | **75** |

## Current FE Source Evidence

The status column is a source audit of clean `origin/develop` commit `feb3613d2373a5cea0231d65af3881da0566ecfb` on 2026-11-08. It is not a deployment claim and does not override the SRS.

| Status | Meaning |
|---|---|
| `IMPLEMENTED_SOURCE` | Routed UI and a production-mode service/BFF boundary are present in source; deployment and end-to-end backend behavior were not verified. |
| `PARTIAL` | Some routed UI/service/tests exist, but the canonical UC is incomplete, mixed with demo/prototype behavior, or lacks full contract verification. |
| `PLACEHOLDER_LOCKED` | UI exists but the production mutation is deliberately unavailable or represents an obsolete operation. |
| `PLACEHOLDER_UNAVAILABLE` | Route intentionally renders an unavailable view; it is not implemented capability. |
| `PLACEHOLDER_PENDING_BE` | Production mode explicitly reports pending backend integration; demo fixtures do not count as implementation. |
| `MISSING` | No matching routed Web capability was found. |
| `OUT_OF_SCOPE` | Canonical Mobile-only UC; absence from this Web repository is expected. |
| `BLOCKED_REQUIREMENT` / `*_CONFLICT` | Source or requirements conflict prevents a compliant implementation claim. |
| `NOT_APPLICABLE_AS_SCREEN` | Canonical background/action UC has no dedicated Web page requirement. |

Verified highlights:

- Public/account, Traveler planning/discovery/booking/payment/ticket/history/review, Operator workspace, and many internal-console routes now exist; route presence alone is reported as `PARTIAL` unless the production boundary was evident.
- UC-46–48 render `UserAccount*UnavailableView`; UC-54–55 render `Route*UnavailableView`; UC-73 routes to `PayoutSettlementUnavailableView`.
- UC-41/42 have cancellation/refund dialog UI, but production actions are locked and the refund wording follows the obsolete “initiate” model. UC-67 has a real refund-progress BFF route, which is status evidence rather than a new canonical page.
- Operator payout request/cancel UI and Administrator approve/reject endpoints are implemented against the legacy manual model. They conflict with automatic UC-71/74 and cannot be treated as compliant payout completion.
- UC-49/50, UC-57/58 and related internal features have routed source, but the audited backend authorization differs from the current catalogue roles. Their status retains the contract conflict.
- UC-63 production mode is explicitly `PENDING_BE_INTEGRATION`; its demo report/export data is not production coverage.
- No routed complaint or partial-refund proposal capability was found for UC-68, UC-69 or UC-75.

## Public Web Screen Outside the UC List

| Screen | Actor | Existing Web Screen Spec | Requirement | Design Coverage |
|---|---|---|---|---|
| TripMate Landing Page | Guest | `ux/web-screen-specifications/tripmate-landing-page-web-screen-spec.md` | §3.1.2.1, Table 4.1; content managed via UC-62 by Staff | Batch 1 screen spec exists; implementation NOT_VERIFIED |

## Proposed Web UI Batches (Planning Only)

1. **Batch 1 — Public + Authentication:** Landing Page, UC-01–04 and UC-06; UC-05 action in shells; UC-07 deferred. Existing six Web screen specifications are design artifacts only.
2. **Batch 2 — Traveler:** UC-08–12, UC-24–29, UC-32–33, UC-68 and UC-75; UC-67 refund status reused in booking details. **UC-31 HOLD**.
3. **Batch 3 — Tour Operator:** UC-34–42, UC-44–45, UC-66 operator cancellation interaction, UC-69; UC-43 is Mobile-only. Do not invent Tour Operator payout requests.
4. **Batch 4 — Staff operations:** role-disputed UC-46–48, UC-49–52, UC-54–55, UC-57–62, UC-72 (read-only; role conflict).
5. **Batch 5 — Administrator governance:** disputed UC-46–48, UC-53, UC-56, UC-63–65, UC-72–73. Payout manual-vs-auto conflict requires owner decision.

## Explicit Source Conflicts (Not Resolved)

| Conflict | Affected UCs | Official evidence in conflict | Current treatment |
|---|---|---|---|
| C-01 | UC-04–07 | Table 3 + authorization Table 5 include Staff; detailed §§3.2.4–3.2.7 largely omit Staff. | STAFF_AUTH_CONFLICT — do not infer final authentication/security permissions. |
| C-02 | UC-12 | Table 3 + Table 5 include Guest POI browsing; detailed §3.3.3 names Traveler. | ROLE_CONFLICT — preserve Guest as a catalogue role pending decision. |
| C-03 | UC-31 | Product Overview identifies commercial-service booking as Mobile-specific; §3.6.2 Interface says Next.js + Flutter. | `CONFLICT_WEB_MOBILE`; Web design inclusion HOLD. |
| C-04 | UC-34–45 | General Product Overview says Operator can use both; detailed §§3.8.1–3.8.5 explicitly name Next.js Web for most Operator screens. | `WEB_CONFIRMED`; no automatic mobile inclusion/exclusion. |
| C-05 | UC-41 | Table 3 lists Tour Operator; §3.8.4.2 and Table 5 also grant Traveler self-cancellation. | ROLE_CONFLICT — differentiate owned vs customer booking permissions. |
| C-06 | UC-46–48 | Table 3 + Table 5 assign Staff/Administrator role-scoped account operations; §§3.9.1.1–3.9.1.3 say Administrator-only. | ROLE_CONFLICT — **no access-policy change approved**. |
| C-07 | UC-49–50 | Table 3 and processing text assign application review to Staff, while the §3.9.2.2 trigger and earlier onboarding narrative refer to Administrator review. | ROLE_CONFLICT — keep catalogue actors; do not change endpoint/UI authorization without approval. |
| C-08 | UC-53 | §3.9.3.3 conditionally deletes or deactivates a POI. Separate soft-delete proposals do not replace this without traceable approval. | POLICY_HOLD — confirm approved lifecycle change before implementing deviations. |
| C-09 | UC-66 | §3.10.1 places emergency cancellation in Tour Operator workspace **or** Web administration. Table 6 still describes automatic weather cancellation. | PLACEMENT_AND_FLOW_CONFLICT — Web interaction required, ownership unresolved, and no automatic-cancel assumption. |
| C-10 | UC-67 | Table 3 actor is Traveler; §3.10.2 execution actors are System/Payment gateway. §3.8.4.2 still says UC-42 performs the gateway refund even though the updated catalogue makes UC-42 operator confirmation and UC-67 processing. | ACTOR_AND_HANDOFF_CONFLICT — reuse refund status UI; do not invent a page or duplicate gateway execution. |
| C-11 | UC-72 | Table 3 + Table 5 allow Staff/Administrator payout-record viewing; §3.9.9.1 says Staff and also retains manual payout requests. | ROLE_AND_FLOW_CONFLICT; preserve read-only catalogue scope pending approval. |
| C-12 | UC-71, UC-73, UC-74 | Table 3 and §§3.10.4–3.10.5 specify automatic schedule/process without Operator/Admin approval. Product Overview, actor descriptions, Tables 4.1/4.2/5/6, §3.9.9 and MSG110 retain Operator request, Staff review and Administrator final settlement. | PAYOUT_CONFLICT — no manual-vs-automatic resolution is inferred. |
| C-13 | UC-71, UC-74 | Table 3 says settlement occurs seven days before departure; §3.10.4 BR141 says a daily 10:00 job after a 24-hour payment window. | TIMING_CONFLICT — no scheduling contract is approved by this matrix. |
| C-14 | UC-73 | Table 3 includes Administrator review of failed settlements; no corresponding detailed named function section exists. | AMBIGUOUS_REQUIREMENT; UI/actions NOT_VERIFIED. |
| C-15 | UC-42, UC-67, UC-70–74 | BR135/BR136 are reused for unrelated cancellation and offline-sync rules; BR139 is reused for refund-share and payout formula; BR140 and BR164 are referenced but not defined. | BUSINESS_RULE_COLLISION — identifiers/formulas require BA correction before implementation authority. |
| C-16 | UC-66, UC-71–74 | Tables 4.2, 5 and 6 retain stale labels/flows such as Initiate Booking Refund, Payout Request, Payout Settlement History, automatic weather cancellation, and approved payout requests. | STALE_CROSS_REFERENCE — retain as conflict evidence, not scope authority. |
| C-17 | UC-02/03 | Old matrix marked Web only; §§3.2.2–3.2.3 explicitly support Web and Mobile. | Corrected to SHARED_WEB_MOBILE. |
| C-18 | UC-42 | Old matrix: Initiate Booking Refund; Table 3 and §3.8.4.3: Confirm Booking Refund. | Corrected scope/name; the UC-42/UC-67 handoff remains unresolved. |
| C-19 | UC-46–75 | Previous matrix used historical UC numbering and stopped at UC-72. | Rebased all catalogue IDs and associated actors against current original Report 3 Table 3. |

## Existing Web Design Evidence

- `docs/BATCH_1_WEB_SCREEN_INVENTORY.md`: historical Batch 1 screen/route choices; not implementation proof.
- `docs/batch-1-message-reconciliation.md`: message conflicts must remain visible.
- `ux/web-screen-specifications/`: Web-specific specs observed for public/auth Batch 1. Mobile-first `ux/screen-specifications/` or Stitch prompts are not automatically Web deliverables.
- `Application Submitted` remains a UC-02 state; UC-06 uses progressive recovery; UC-07 remains deferred.
- Prior `READY FOR STITCH: YES` applies to the old Batch 1 design review only and does not certify UC-46–75 or the new conflict list.

## Governance and Approval Gate

This is a **traceability update**, not a change to the official SRS, source code, Jira or deployed screens. Before design or implementation decisions affecting any disputed UC, obtain traceable Owner approval and record the chosen precedence. In particular: Staff account permissions, UC-31 Web availability, UC-53 POI deletion lifecycle, UC-66 cancellation UI ownership, and UC-71/73/74 payout authority.

**Implementation verification:** FE source status was audited at clean `origin/develop` commit `feb3613d2373a5cea0231d65af3881da0566ecfb`. Deployment, live environment behavior and full FE/BE compatibility remain `NOT_VERIFIED`; source presence is not production proof.

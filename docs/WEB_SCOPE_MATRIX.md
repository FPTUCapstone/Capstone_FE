# TripMate Web Scope Matrix

Audit date: 2026-09-06

This document is the repository-facing Web scope authority derived from the official TripMate project documents. It does not replace the approved SRS. A use case being listed here does not by itself authorize implementation: a new visual Web screen still requires an approved Web Screen Specification, reviewed UI, and an approved implementation task.

## A. Scope Verification

The Current Report 3 used for this correction is `D:/FPT_University_các kì/CapStone_TripMate_DoAn/Report3_Software-Requirement-Specification.docx` (SHA-256 `c8d927a56b7720da3f8b4df38ffdd6eecc1ebd8d315e6bc104ca41c9b163f076`). It is the primary authority for this matrix.

| Verification | Confirmed result | Current R3 evidence |
|---|---|---|
| UC catalog | Exactly 72 unique IDs, continuously numbered UC-01 through UC-72; no missing or duplicate ID | §2.2.2, Table 3 |
| Product architecture | Flutter Mobile and responsive Next.js Web share one back-end | §1 Product Overview |
| Web technology | Next.js with React and TypeScript | §1 Product Overview and 2026-08-21 change record |
| Mobile technology | Flutter with Bloc | §1 Product Overview |
| Backend and data | ASP.NET Core 8 with Clean Architecture, SQL Server, Redis, and Mobile SQLite | §1 Product Overview |
| Guest | Supported public/account capabilities are on both platforms; the Landing Page belongs to Web | §§1 and 2.1 Actor table |
| Traveler | Profile, preferences, planning, POI, tour, payment, QR display, history, and review capabilities are shared; explicit active-trip, offline, group, and commercial-service exceptions are Mobile-only | §§1 and 2.1 Actor table; Table 3 |
| Tour Operator | Profile, application resubmission, tour, coupon, booking, revenue, and payout capabilities are shared; QR scanning is Mobile-only | §§1 and 2.1 Actor table; Table 3 |
| Administrator | Administrator workspace and UCs are Web-only | §§1, 2.1, and 3.9 |
| Public Landing Page | `PUBLIC_WEB` product surface without a numbered UC | §§1 and 3.1.2.1 |
| System-triggered functions | UC-70 and UC-71 are platform-neutral system workflows; UC-72 is explicitly Mobile-only and runs as background synchronization. Visible status does not create a standalone route | §§3.1.4 and 3.10; Table 3 |

Document precedence for this correction is: **Current R3 → R2 → R1 → Register → repository implementation → existing matrix**. Older reports and the Register are recorded when they conflict, but they do not override Current R3. Repository code establishes only current implementation coverage and never product scope.

For an internal R3 conflict, this resolution order is applied: **explicit UC platform statement → Actor platform definition → Product Overview → detailed interface → screen table/mockup**. A lower-priority Next.js mention cannot expand an explicitly Mobile-only UC.

Source labels used below:

- **R3** — `Report3_Software-Requirement-Specification.docx`.
- **R2** — `Report2_Project Management Plan.docx`.
- **R1** — `Report1_Project Introduction.docx`.
- **Register** — `Capstone Project Register_FA26_LongNQ_SE18.docx`.
- **Screens** — `Report3_Screens_All.html`; supporting visual artifact only.

## B. Document Conflicts

| Conflict | Current R3 | Older Document / Internal Section | Resolution |
|---|---|---|---|
| Overall platform ownership | R3 §§1-2.1 assign most Guest, Traveler, and Tour Operator capabilities to both applications and Administrator to Web-only | Register §§3.3-3.5 defines narrower Traveler/Tour Operator Mobile deliverables and Admin Web plus Landing Page. Current workspace R1 §§1.1, 2, and 6 and R2 §§1.1-1.2 already align with Current R3 rather than contradicting it | Current R3 controls; the Register does not reduce current Web scope |
| Breadth of Mobile-only exceptions | R3 §§1, 2.1, and Table 3 explicitly make alerts/rerouting, travel groups, commercial services, offline use, navigation, and QR scanning Mobile-only where specified | R1 §6.2 LI-5 and R2 objective 2 make broader “both platforms” statements | Apply Current R3 per-UC statements |
| Shared Tour Operator interfaces | R3 §§1 and 2.1 assign registration, profile, tour, coupon, booking, revenue, and payout functions to both platforms | Internal §§3.2.2-3.2.3 and 3.8 often name only the Next.js interface | Retain `SHARED_WEB_MOBILE`; the detailed interface text is incomplete because it never explicitly removes Mobile support |
| UC-30 and UC-31 platform | R3 Table 3 explicitly says both commercial-service UCs are Mobile-only; §§1 and 2.1 agree | Internal §§3.6.1-3.6.2 mention Flutter and Next.js; R2 objective 2 is also broader | `SRS_CONFLICT`: keep `MOBILE_ONLY`; new Web routes are `BLOCKED_BY_SRS_CONFLICT` until Current R3 is corrected and approved |
| UC-43 platform | R3 Table 3 explicitly says QR check-in is Mobile-only; §§1 and 2.1 agree | Internal §3.8.4.4 mentions Flutter and Next.js | `SRS_CONFLICT`: keep `MOBILE_ONLY`; new Web routes are `BLOCKED_BY_SRS_CONFLICT` because the isolated Next.js phrase cannot expand scope |
| UC-70 trigger, actors, and UI | R3 Table 3 and §3.1.4 describe automatic weather-triggered cancellation and catalog actors Traveler/Tour Operator | Internal §3.10.1 says Operator/Admin declares the cancellation and defines declaration screens | `SRS_CONFLICT`: keep the processing `NON_SCREEN`; new declaration routes are `BLOCKED_BY_SRS_CONFLICT` until R3 is corrected or the manual action is split into a separate UC |
| UC-71 actor ownership | R3 Table 3 catalog actor is Traveler and describes an automatic refund | Internal §3.10.2 additionally lists System, Tour Operator, and Administrator as execution/notified/escalation roles | Preserve the exact catalog Actor field; keep processing `NON_SCREEN` and record the additional roles only in Evidence/Notes |
| Mockup labels for UC-29 through UC-31 | R3 Table 3 makes UC-29 shared and UC-30/31 Mobile-only | Screens says UC-29 and UC-31 are Mobile-only and implies UC-30 is shared | Current R3 controls; the visual artifact must be corrected before its platform labels are relied upon |
| Screen inventory and caption | R3 Tables 4.1 and 4.2 enumerate 92 rows; Table 4.2 contains Mobile-oriented descriptions | R2 §3 Table 7 says 88 screens; R3 internally captions Table 4.2 as a Web screen list | Do not equate screen count with UC or route count; reconcile the screen inventory and caption in R3 |
| Web technology | R3 §1 and its 2026-08-21 change record specify Next.js with React and TypeScript | Register §3.4 says React.js | Use Current R3's framework baseline; React.js wording does not replace Next.js |
| Mobile OS target | R3 §1 says Flutter Mobile for Android | Internal R3 §4.2.5 lists Android 9+ and iOS 14+; R1 §1.1 says Android | No Web-scope effect; correct the mobile compatibility statement separately |
| Stale UC references | R3 Table 3 defines Create POI as UC-52, Initiate Booking Refund as UC-42, and Process Automatic Refund as UC-71 | R2 risk table calls Create POI UC-51 and summarizes refund risk using UC-28/UC-41 | Keep Current R3 numbering; correct R2 cross-references without renumbering UCs |

## C. Final Platform Model

| Classification | Definition |
|---|---|
| `PUBLIC_WEB` | Public Web-only product surface. It currently applies to the unnumbered TripMate Landing Page, not to an invented UC. |
| `SHARED_WEB_MOBILE` | R3 explicitly requires the same UC capability on both responsive Web and Flutter Mobile. It does not imply identical layouts or one route per UC. |
| `MOBILE_ONLY` | Capability explicitly assigned to Flutter Mobile. It may be a user-facing screen or a background Mobile service. The Web repository must not create an equivalent route without an approved SRS change. |
| `ADMIN_WEB_ONLY` | Administrator capability delivered through the Web administration workspace. |
| `NON_SCREEN` | Automated or system-triggered workflow without explicit user-platform ownership that cannot create a standalone Web route. Its outcome may be displayed inside an already-approved screen or notification surface. |

Platform Classification and Interaction Type are separate axes. Platform Classification records where the capability belongs; Interaction Type records whether it is a page, action, dialog, or background process. UC-72 is therefore `MOBILE_ONLY` with `NON_SCREEN / background synchronization` interaction. `NON_SCREEN` remains in the classification column for UC-70 and UC-71 because Current R3 defines those system workflows without assigning a user platform.

`Web Required = Yes` means project requirements include a Web surface or Web action. `No` means this repository must not implement a Web equivalent. `No standalone route` means the system behavior may affect approved Web screens, but the UC itself is not route authority.

### Approved-document technology baseline

| Area | Baseline established by the latest reports | Evidence |
|---|---|---|
| Web | Next.js with React and TypeScript | Current R3 §1 and 2026-08-21 change record |
| Mobile | Flutter with Bloc | R3 §1; R2 §§1.2 and 6.3 |
| Backend | ASP.NET Core 8 with Clean Architecture | R3 §1; R2 §§1.2 and 6.3 |
| Data | SQL Server, Redis, and Mobile SQLite | R3 §1; R2 §1.2 |
| External services | Google Maps API, Weather API, Firebase Cloud Messaging, Google OAuth, and VNPay; PayOS is named only as a fallback | R3 §§1 and 4.1 |

The Register's `React.js` wording is superseded for scope purposes by the later R3 change record. Next.js still uses React; the approved framework-level wording is **Next.js with React and TypeScript**.

## D. Final UC / Platform Matrix

Interaction Type describes the interaction shape supported by Current R3. It is not a route count and does not create a Screen Specification.

| UC | Use Case | Actor | Platform Classification | Web Required | Interaction Type | Evidence / Notes |
|---|---|---|---|---|---|---|
| UC-01 | Register Traveler Account | Guest | SHARED_WEB_MOBILE | Yes | Multi-step registration flow | R3 §§1, 2.1, 3.2.1 explicitly provide Flutter and responsive Next.js interfaces. |
| UC-02 | Register Tour Operator Account | Guest | SHARED_WEB_MOBILE | Yes | Multi-step business registration | R3 §§1 and 2.1 say both platforms; §3.2.2 names only Web while R3 Table 4.2 contains the Operator registration screen. Treat the detailed interface as incomplete, not a Mobile removal. |
| UC-03 | Resubmit Tour Operator Application | Tour Operator | SHARED_WEB_MOBILE | Yes | Status, edit, and resubmit flow | R3 §§1 and 2.1 say both platforms; §3.2.3 names the responsive Web screens. Register independently requires Mobile Operator onboarding. |
| UC-04 | Sign In | Guest | SHARED_WEB_MOBILE | Yes | Authentication form/flow | R3 §§1, 2.1, 3.2.4 explicitly cover Mobile and Web; Admin uses the Web-specific login surface. |
| UC-05 | Sign Out | Traveler / Tour Operator / Administrator | SHARED_WEB_MOBILE | Yes | Account action plus confirmation dialog | R3 §3.2.5 explicitly places the action in Mobile and Web account menus; no dedicated route is implied. |
| UC-06 | Reset Password | Guest | SHARED_WEB_MOBILE | Yes | Multi-step recovery flow | R3 §§2.1 and 3.2.6 explicitly provide Mobile and Web recovery screens, including Admin Web variants in Table 4.1. |
| UC-07 | Change Password | Traveler / Tour Operator / Administrator | SHARED_WEB_MOBILE | Yes | Account-settings form | R3 §3.2.7 explicitly provides Mobile and Web interfaces; Admin uses Web. |
| UC-08 | Update Traveler Profile | Traveler | SHARED_WEB_MOBILE | Yes | Profile/detail and edit form | R3 §§2.1 and 3.2.8 explicitly provide Flutter and responsive Next.js screens. |
| UC-09 | Update Travel Preferences | Traveler | SHARED_WEB_MOBILE | Yes | Settings form | R3 §§2.1 and 3.2.9 explicitly provide Flutter and responsive Next.js screens. |
| UC-10 | Create Scheduling Request | Traveler | SHARED_WEB_MOBILE | Yes | Planner form | R3 §§1, 2.1, 3.3.1 explicitly provide Flutter and responsive Next.js screens. |
| UC-11 | View Suggested Itinerary | Traveler | SHARED_WEB_MOBILE | Yes | Timeline/map result view | R3 §§1, 2.1, 3.3.2 explicitly provide Flutter and responsive Next.js screens. |
| UC-12 | Explore Points of Interest | Guest / Traveler | SHARED_WEB_MOBILE | Yes | Search/list/map plus detail | R3 §§1, 2.1, 3.3.3 explicitly provide Flutter and responsive Next.js screens; Guest ownership comes from Table 3 and §2.1. |
| UC-13 | Navigate Route | Traveler | MOBILE_ONLY | No | Mobile live-navigation screen | R3 §§1, 2.1, Table 3, and §3.3.4 explicitly say Mobile-only. |
| UC-14 | Receive Real-Time Alerts | Traveler | MOBILE_ONLY | No | Push/banner/alerts list | R3 §§1, 2.1, Table 3, and §3.3.5 explicitly say Mobile-only. Background alert ingestion does not create a Web route. |
| UC-15 | Confirm Re-routing | Traveler | MOBILE_ONLY | No | Mobile proposal/decision screen | R3 §§1, 2.1, Table 3, and §3.3.6 explicitly say Mobile-only. |
| UC-16 | Download Offline Map & Itinerary | Traveler | MOBILE_ONLY | No | Mobile download/offline screen | R3 §§1, 2.1, Table 3, and §3.3.7 explicitly say Mobile-only. |
| UC-17 | Create Travel Group | Traveler | MOBILE_ONLY | No | Mobile creation form | R3 §§1, 2.1, Table 3, and §3.4.1 explicitly say Mobile-only. |
| UC-18 | Invite Group Members | Traveler | MOBILE_ONLY | No | Mobile invite/code/QR screen | R3 §§1, 2.1, Table 3, and §3.4.2 explicitly say Mobile-only. |
| UC-19 | View Group Members | Traveler | MOBILE_ONLY | No | Mobile member list/detail | R3 §§1, 2.1, Table 3, and §3.4.3 explicitly say Mobile-only. |
| UC-20 | Remove Group Member | Traveler | MOBILE_ONLY | No | Action plus confirmation dialog | R3 Table 3 and §3.4.4 explicitly say Mobile-only; no standalone route is implied. |
| UC-21 | Leave Travel Group | Traveler | MOBILE_ONLY | No | Action plus confirmation | R3 Table 3 and §3.4.5 explicitly say Mobile-only. |
| UC-22 | Configure Group Location Sharing | Traveler | MOBILE_ONLY | No | Mobile privacy/settings screen | R3 §§1, 2.1, Table 3, and §3.4.6 explicitly say Mobile-only. |
| UC-23 | Join Shared Group Trip | Traveler | MOBILE_ONLY | No | Mobile code/QR join flow | R3 §§1, 2.1, Table 3, and §3.4.7 explicitly say Mobile-only. |
| UC-24 | Search Tours | Guest / Traveler | SHARED_WEB_MOBILE | Yes | Search/filter/list | R3 §§1, 2.1, 3.5.1 explicitly provide Mobile and Next.js Web. |
| UC-25 | Receive Tour Recommendations | Traveler | SHARED_WEB_MOBILE | Yes | Recommendation list | R3 §§1, 2.1, 3.5.2 explicitly provide Mobile and Next.js Web. |
| UC-26 | View Tour Details | Guest / Traveler | SHARED_WEB_MOBILE | Yes | Detail view | R3 §§1, 2.1, 3.5.3 explicitly provide Mobile and Next.js Web. |
| UC-27 | Book Tour | Traveler | SHARED_WEB_MOBILE | Yes | Booking form/confirmation flow | R3 §§1, 2.1, 3.5.4 explicitly provide Mobile and Next.js Web. |
| UC-28 | Make Electronic Payment | Traveler | SHARED_WEB_MOBILE | Yes | Payment handoff and return flow | R3 Table 3 and §3.5.5 explicitly define Mobile deep-link and Web redirect return paths. |
| UC-29 | View QR E-ticket | Traveler | SHARED_WEB_MOBILE | Yes | Booking detail and QR display | R3 §§1, 2.1, Table 3, and §3.5.6 say display on both platforms; scanning is UC-43. `MOCKUP_CONFLICT`: Screens incorrectly labels UC-29 Mobile-only. |
| UC-30 | View Commercial Service | Traveler | MOBILE_ONLY | No | Mobile service list/detail | `SRS_CONFLICT` and `BLOCKED_BY_SRS_CONFLICT`: R3 §§1, 2.1, and Table 3 explicitly say Mobile-only, while §3.6.1 mentions Next.js. The explicit UC platform statement controls; no Web screen is authorized. |
| UC-31 | Book Commercial Service | Traveler | MOBILE_ONLY | No | Mobile service-booking flow | `SRS_CONFLICT` and `BLOCKED_BY_SRS_CONFLICT`: R3 §§1, 2.1, and Table 3 explicitly say Mobile-only, while §3.6.2 mentions Next.js. The explicit UC platform statement controls; no Web screen is authorized. |
| UC-32 | View Trip History | Traveler | SHARED_WEB_MOBILE | Yes | History list/detail | R3 §§1, 2.1, and §3.7.1 explicitly provide Mobile and Next.js Web. |
| UC-33 | Submit Trip Review | Traveler | SHARED_WEB_MOBILE | Yes | Review/rating form | R3 §§1, 2.1, and §3.7.2 explicitly provide Mobile and Next.js Web. |
| UC-34 | Update Tour Operator Profile | Tour Operator | SHARED_WEB_MOBILE | Yes | Business profile/detail and edit | R3 §§1 and 2.1 explicitly say both platforms; §3.8.1 documents the Next.js management screen. |
| UC-35 | Create Tour Package | Tour Operator | SHARED_WEB_MOBILE | Yes | Multi-section creation form | R3 §§1 and 2.1 say both platforms; §3.8.2.1 documents the Next.js management screen. |
| UC-36 | Update Tour Package | Tour Operator | SHARED_WEB_MOBILE | Yes | Edit form | R3 §§1 and 2.1 say both platforms; §3.8.2.2 documents the Next.js management screen. |
| UC-37 | Submit Tour for Approval | Tour Operator | SHARED_WEB_MOBILE | Yes | Action plus confirmation dialog | R3 Table 3 provides the catalog name; §§1, 2.1, and 3.8.2.3 support both-platform ownership and the Web action. The detail heading says “Submit Tour Package for Approval” but does not define a new UC. |
| UC-38 | Create Coupon | Tour Operator | SHARED_WEB_MOBILE | Yes | Creation form | R3 §§1 and 2.1 say both platforms; §3.8.3.1 documents the Next.js management screen. |
| UC-39 | Update Coupon | Tour Operator | SHARED_WEB_MOBILE | Yes | Edit/deactivate form | R3 §§1 and 2.1 say both platforms; §3.8.3.2 documents the Next.js management screen. |
| UC-40 | View Customer Bookings | Tour Operator | SHARED_WEB_MOBILE | Yes | Booking list/detail | R3 §§1 and 2.1 say both platforms; §3.8.4.1 documents the Next.js management screen. |
| UC-41 | Cancel Customer Booking | Tour Operator | SHARED_WEB_MOBILE | Yes | Action plus confirmation dialog | R3 §§1 and 2.1 say both platforms; §3.8.4.2 documents the Next.js dialog. No dedicated route is implied. |
| UC-42 | Initiate Booking Refund | Tour Operator | SHARED_WEB_MOBILE | Yes | Action/dialog within booking detail | R3 §§1 and 2.1 say both platforms; §3.8.4.3 documents the Next.js refund action. |
| UC-43 | Check In Traveler by QR Code | Tour Operator | MOBILE_ONLY | No | Mobile camera/scanner screen | `SRS_CONFLICT` and `BLOCKED_BY_SRS_CONFLICT`: R3 §§1, 2.1, and Table 3 explicitly say Mobile-only, while §3.8.4.4 mentions Next.js. The explicit UC platform statement controls; no Web screen is authorized. |
| UC-44 | View Revenue Report | Tour Operator | SHARED_WEB_MOBILE | Yes | Report/dashboard view | R3 §§1 and 2.1 say both platforms; §3.8.5.1 documents the Next.js management screen. |
| UC-45 | Export Revenue Report | Tour Operator | SHARED_WEB_MOBILE | Yes | Export action/dialog | R3 §§1 and 2.1 say both platforms; §3.8.5.2 places the dialog on the Revenue Report screen. No dedicated route is implied. |
| UC-46 | Request Payout Settlement | Tour Operator | SHARED_WEB_MOBILE | Yes | Payout detail/request form | R3 §§1 and 2.1 say both platforms; §3.8.5.3 documents the Next.js management screen. |
| UC-47 | View User Accounts | Administrator | ADMIN_WEB_ONLY | Yes | Account list/detail | Register §3.3 OBJ6; R3 §§2.1 and 3.9.1.1; Table 4.1. |
| UC-48 | Lock User Account | Administrator | ADMIN_WEB_ONLY | Yes | Action plus confirmation dialog | R3 §§2.1 and 3.9.1.2; Table 4.1. No dedicated route is implied. |
| UC-49 | Unlock User Account | Administrator | ADMIN_WEB_ONLY | Yes | Action plus confirmation dialog | R3 §§2.1 and 3.9.1.3; Table 4.1. No dedicated route is implied. |
| UC-50 | Approve Tour Operator Application | Administrator | ADMIN_WEB_ONLY | Yes | Review-screen action | Register §3.3 OBJ6; R3 §§2.1 and 3.9.2.1; Table 4.1. |
| UC-51 | Reject Tour Operator Application | Administrator | ADMIN_WEB_ONLY | Yes | Review action with reason | R3 §§2.1 and 3.9.2.2; Table 4.1. R2's Create POI reference to UC-51 is stale. |
| UC-52 | Create POI | Administrator | ADMIN_WEB_ONLY | Yes | Creation form/map input | Register §3.3 OBJ6; R3 §§2.1 and 3.9.3.1; Table 4.1. |
| UC-53 | Update POI | Administrator | ADMIN_WEB_ONLY | Yes | Edit form/map input | R3 §§2.1 and 3.9.3.2; Table 4.1. |
| UC-54 | Remove POI | Administrator | ADMIN_WEB_ONLY | Yes | Action plus confirmation dialog | R3 §§2.1 and 3.9.3.3; Table 4.1. No dedicated route is implied. |
| UC-55 | Create Route | Administrator | ADMIN_WEB_ONLY | Yes | Route creation form/map input | Register §3.3 OBJ6; R3 §§2.1 and 3.9.4.1; Table 4.1. |
| UC-56 | Update Route | Administrator | ADMIN_WEB_ONLY | Yes | Route edit form/map input | R3 §§2.1 and 3.9.4.2; Table 4.1. |
| UC-57 | Configure Algorithm Parameters | Administrator | ADMIN_WEB_ONLY | Yes | Configuration form | Register §3.3 OBJ6; R3 §§2.1 and 3.9.5; Table 4.1. |
| UC-58 | View Active Trips | Administrator | ADMIN_WEB_ONLY | Yes | Monitoring list/dashboard | Register §3.3 OBJ6; R3 §§2.1 and 3.9.6.1; Table 4.1. |
| UC-59 | View Active Trip Details | Administrator | ADMIN_WEB_ONLY | Yes | Monitoring detail | R3 §§2.1 and 3.9.6.2; Table 4.1. It is read-only unless a separate intervention UC is approved. |
| UC-60 | Approve Tour Post | Administrator | ADMIN_WEB_ONLY | Yes | Review-screen action | Register §3.3 OBJ6; R3 §§2.1 and 3.9.7.1; Table 4.1. |
| UC-61 | Reject Tour Post | Administrator | ADMIN_WEB_ONLY | Yes | Review action with reason | R3 §§2.1 and 3.9.7.2; Table 4.1. |
| UC-62 | View Platform Bookings | Administrator | ADMIN_WEB_ONLY | Yes | Booking list/detail | Register §3.3 OBJ6; R3 §§2.1 and 3.9.8; Table 4.1. It is read-only unless another UC is approved. |
| UC-63 | View Payout Records | Administrator | ADMIN_WEB_ONLY | Yes | Payout list | R3 §§2.1 and 3.9.9.1; Table 4.1. Amounts are backend-calculated. |
| UC-64 | View Payout Details | Administrator | ADMIN_WEB_ONLY | Yes | Payout detail | R3 §§2.1 and 3.9.9.2; Table 4.1. |
| UC-65 | Confirm Payout Settlement | Administrator | ADMIN_WEB_ONLY | Yes | Detail-screen action plus dialog | Register §3.3 OBJ6; R3 §§2.1 and 3.9.9.3; Table 4.1. No dedicated route is implied. |
| UC-66 | Update Landing Page Content | Administrator | ADMIN_WEB_ONLY | Yes | Content-management screen | Register §3.3 OBJ6; R3 §§2.1 and 3.9.10; Table 4.1. The published Landing Page remains an unnumbered `PUBLIC_WEB` surface. |
| UC-67 | Export Statistical Reports | Administrator | ADMIN_WEB_ONLY | Yes | Report filters plus export action | Register §3.3 OBJ6; R3 §§2.1 and 3.9.11; Table 4.1. No separate export route is implied. |
| UC-68 | View Audit Logs | Administrator | ADMIN_WEB_ONLY | Yes | Audit list/filter | R3 §§2.1 and 3.9.12.1; Table 4.1. |
| UC-69 | View Audit Log Details | Administrator | ADMIN_WEB_ONLY | Yes | Audit detail | R3 §§2.1 and 3.9.12.2; Table 4.1. |
| UC-70 | Handle Emergency Tour Cancellation | Traveler / Tour Operator | NON_SCREEN | No standalone route | Automated cancellation cascade with embedded status; declaration UI is conflicted | `SRS_CONFLICT` and `BLOCKED_BY_SRS_CONFLICT`: R3 Table 3 and §3.1.4 say automatic/weather-triggered; §3.10.1 instead adds System/Admin roles and Operator/Admin declaration screens. Do not create a new Web route until R3 is corrected or split. |
| UC-71 | Process Automatic Refund | Traveler | NON_SCREEN | No standalone route | Background refund with progress embedded in approved screens | `SRS_CONFLICT` on actor listing: Table 3 names Traveler, while §3.10.2 also names System, Tour Operator, and Administrator as execution/notified/escalation roles. Processing is automatic; embedded status does not create a route. |
| UC-72 | Synchronize Offline Trip Data | Traveler | MOBILE_ONLY | No | NON_SCREEN / background synchronization with Mobile-visible banner/result | R3 Table 3 explicitly limits the capability to Mobile; §§3.1.4 and 3.10.3 establish system-triggered processing. Platform ownership and interaction shape are separate axes; no Web route is authorized. |

## E. Matrix Totals

| Classification | Numbered UCs |
|---|---:|
| `SHARED_WEB_MOBILE` | 32 |
| `MOBILE_ONLY` | 15 |
| `ADMIN_WEB_ONLY` | 23 |
| `NON_SCREEN` | 2 |
| **Total** | **72** |

The unnumbered Landing Page is an additional `PUBLIC_WEB` product surface.

## F. Current Web Repository Coverage

This coverage was verified against the current route and feature files in this repository on the audit date. “Prototype” means UI and local interactions exist; it does not mean authentication, authorization, API integration, persistence, maps, payment, or operational services are connected.

| Product Area | Required by Project Scope | Currently Implemented | Status |
|---|---|---|---|
| Public Landing Page | Unnumbered `PUBLIC_WEB` surface | `/` composes the current Landing Page feature | PROTOTYPE |
| Shared Guest/account access | UC-01 through UC-07 where applicable, plus public handoffs | Prototype routes exist for `/sign-in`, `/register`, `/verify-account`, `/forgot-password`, `/partner/register`, `/partner/application`, `/partner/application/resubmit`, `/admin/login`, and `/admin/forgot-password` | PARTIAL_PROTOTYPE |
| Traveler Web | UC-08 through UC-12, UC-24 through UC-29, UC-32, UC-33, plus shared account UCs | Traveler registration and verification prototypes exist; no production Traveler workspace, planning, discovery, booking, payment, ticket, history, or review integration is present | PARTIAL_PROTOTYPE |
| Tour Operator Web | UC-34 through UC-42 and UC-44 through UC-46, plus shared onboarding/account UCs | Registration, application status, and resubmission prototypes exist; no operational Operator dashboard or management integration is present | PARTIAL_PROTOTYPE |
| Administrator Web | UC-47 through UC-69 plus shared sign-in/password actions | Admin login/recovery prototypes, dashboard, mock tour-review queue, and mock review detail/decision UI exist | PARTIAL_PROTOTYPE |
| Mobile-only | UC-13 through UC-23, UC-30, UC-31, UC-43, and UC-72 | Outside the production scope of this Web repository; UC-72 is background Mobile synchronization rather than a Web route | OUT_OF_SCOPE |
| System-triggered/non-screen | UC-70 and UC-71 | No standalone Web route is required. Any future status display must belong to an approved existing screen and contract | NOT_APPLICABLE_AS_ROUTE |
| Production integration | Required eventually for implemented Web scope | No verified production authentication, authorization, backend API, persistence, map, payment, or notification integration was found | NOT_IMPLEMENTED |

## G. Web Implementation Batches

The screen names below come from R3 §§3.1.2 and 3.2-3.9. They are expected interaction surfaces, not a declaration that each item needs its own route. `Report3_Screens_All.html` contains visual mockups, but the provided files do not independently prove review/approval status.

| Batch | Related UCs / Functions | Expected Screens | Dependencies | Readiness |
|---|---|---|---|---|
| 1 — Web foundation, Public, and shared access | Landing Page; UC-01 through UC-07 where Web-supported; public portions of UC-12, UC-24, UC-26 | Landing Page; shared sign-in; Traveler registration/verification; Operator registration/status/resubmission; password recovery/change; POI explore/detail; tour search/detail; sign-out action | Approved Web Screen Specifications; authentication and public catalog API contracts; role/session design | PARTIAL_PROTOTYPE — several routes exist, but production integration is absent |
| 2 — Traveler Web core | UC-08 through UC-12; UC-25; UC-27 through UC-29; UC-32; UC-33 | Profile/edit; preferences; planner; suggested itinerary; recommendations; tour booking; payment handoff/return; booking detail/QR display; trip history; review | Approved Traveler Web Screen Specifications; CSP, catalog, booking, payment, ticket, and review API contracts | NOT_READY — registration UI exists, operational Traveler Web does not |
| 3 — Tour Operator Web | UC-34 through UC-42; UC-44 through UC-46 | Operator profile; tour package management; coupon management; customer bookings; cancellation/refund actions; revenue/report export; payout request | Approved Operator Web Screen Specifications; operator authorization; tour, booking, refund, reporting, and payout contracts | PARTIAL_PROTOTYPE — onboarding exists; operational workspace does not |
| 4 — Admin access, master data, moderation, and content | UC-47 through UC-57; UC-60; UC-61; UC-66, plus Admin variants of UC-04, UC-06, UC-07 | Admin access; accounts; operator review; POI/route management; configuration; tour review; landing content management | Approved Admin Web Screen Specifications; Admin RBAC; account, catalog, moderation, configuration, and content APIs | PARTIAL_PROTOTYPE — Admin access/dashboard and mock tour moderation exist |
| 5 — Admin monitoring, finance, reports, and audit | UC-58; UC-59; UC-62 through UC-65; UC-67 through UC-69 | Active-trip monitor/detail; platform bookings; payout list/detail/confirmation; statistics/export; audit list/detail | Approved Admin Web Screen Specifications; monitoring, booking, settlement, reporting, audit, and authorization contracts | NOT_READY |

No implementation batch contains Mobile-only UC-13 through UC-23, UC-30, UC-31, UC-43, and UC-72, or route-ineligible UC-70 and UC-71. Conflict-marked functions require corrected and approved requirements before any new Web surface is scheduled.

## H. Change Log

“Existing Matrix” below means the pre-audit matrix supplied for correction, not Current R3.

| Item | Existing Matrix | Corrected Matrix | Reason |
|---|---|---|---|
| Output structure | Summary plus sections A-G | Required sections A-H: verification, conflicts, model, full matrix, totals, coverage, batches, and change log | Matches the final correction request exactly |
| Scope verification | Implied that the latest SRS was fully consistent | Identifies the exact Current R3 file/hash and verifies architecture, actors, technology, and 72 unique UCs | Prevents accidental use of an obsolete Report 3 |
| Source precedence | Not documented | Current R3 explicitly controls, followed by R2, R1, Register, repository, and existing matrix | Applies the user-specified authority order rather than inferring one |
| Platform model | Defined classifications only | Defines route-governance meaning and conservative conflict handling | Prevents a contradictory interface sentence from silently creating Web scope |
| Technology | Next.js mentioned only in implementation notes | Adds Next.js with React/TypeScript, Flutter/Bloc, ASP.NET Core 8, and documented services as the report baseline | Resolves Register React.js wording through the later R3 change history |
| UC catalog | UC-01 through UC-72 | Retained all 72 IDs, names, and catalog actors | Automated comparison found no missing, extra, duplicate, renamed, split, or merged catalog row |
| UC-30/31 | `MOBILE_ONLY` without conflict record | `MOBILE_ONLY` with a blocking SRS contradiction note | R3 catalog says Mobile-only while detailed interface lines mention Next.js |
| UC-43 | `MOBILE_ONLY` without conflict record | `MOBILE_ONLY` with a blocking SRS contradiction note | R3 catalog says Mobile-only while §3.8.4.4 mentions Next.js |
| UC-70 | `NON_SCREEN` with only an automatic-workflow note | `NON_SCREEN`, explicitly blocked for new Web UI | R3 §3.10.1 contradicts the catalog by defining manual Operator/Admin declaration screens |
| UC-70/71 catalog actors | Mixed catalog and detailed-section roles in the Actor column | Exact Table 3 actors in the Actor column; extra System/Admin/notified roles remain in Evidence/Notes | Preserves exact Current R3 catalog ownership while exposing internal actor discrepancies |
| UC-71 | `NON_SCREEN` | Retained with `SRS_CONFLICT` actor note and embedded-status guidance | Automatic execution may be visible in Booking Detail or monitoring UI but is not a route |
| UC-72 | `MOBILE_ONLY` without a separate interaction label | `MOBILE_ONLY` with `NON_SCREEN / background synchronization` interaction | R3's explicit Mobile-only statement and background-service description belong to separate axes; neither creates Web scope |
| Screen interpretation | Notes did not systematically distinguish pages, dialogs, actions, and services | Adds `Interaction Type` for every UC | A UC does not equal a route; export/approve/reject/lock/unlock actions must not become fake pages |
| Public coverage | Landing Page only; authentication/discovery absent | Records existing public/account and Operator onboarding prototype routes | Verified from the current App Router source tree; production integration is still absent |
| Traveler coverage | No Traveler routes/features | Registration and verification prototypes exist; operational Traveler Web remains absent | Verified from `app/register`, `app/verify-account`, and Traveler feature files |
| Tour Operator coverage | No Operator routes/features | Registration, status, and resubmission prototypes exist; operational workspace remains absent | Verified from current `/partner/*` routes and Operator feature files |
| Admin coverage | Dashboard and tour-review prototypes | Adds verified Admin login/recovery routes; retains dashboard and mock tour moderation | Verified from the current route and feature files |
| Implementation batches | Batches were based on the old unqualified matrix | Batches include only confirmed Web scope and identify conflict gates | Prevents Mobile-only and system-triggered behavior from becoming Web routes |

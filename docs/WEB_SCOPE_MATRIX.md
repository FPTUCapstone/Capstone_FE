# TripMate Web Scope Matrix

This document translates the latest approved Report 3 Software Requirement Specification (SRS) into Frontend platform ownership. The approved SRS remains the product-scope authority; this matrix is the repository-facing implementation guide.

## Platform classifications

- `PUBLIC_WEB` — a public Web-only surface. The Public Landing Page uses this classification but is not a numbered use case.
- `SHARED_WEB_MOBILE` — the use case is supported by both the responsive Next.js Web application and the Flutter mobile application.
- `MOBILE_ONLY` — the use case is intentionally limited to the mobile application.
- `ADMIN_WEB_ONLY` — the use case belongs to the Administrator Web workspace.
- `NON_SCREEN` — a system-triggered workflow that must not be turned into a standalone route without an approved screen specification.

`Web Required` means the SRS requires Web support. It does not authorize implementation by itself. A Web feature also requires an approved Web Screen Specification and an approved implementation task.

## UC-01 through UC-72

| UC | Use Case | Actor | Platform Classification | Web Required | Notes |
|---|---|---|---|---|---|
| UC-01 | Register Traveler Account | Guest | SHARED_WEB_MOBILE | Yes | Shared registration entry point. |
| UC-02 | Register Tour Operator Account | Guest | SHARED_WEB_MOBILE | Yes | Shared business-registration and verification entry point. |
| UC-03 | Resubmit Tour Operator Application | Tour Operator | SHARED_WEB_MOBILE | Yes | Part of the shared operator onboarding flow. |
| UC-04 | Sign In | Guest | SHARED_WEB_MOBILE | Yes | Shared authentication entry point; role-aware destination is specification-dependent. |
| UC-05 | Sign Out | Traveler / Tour Operator / Administrator | SHARED_WEB_MOBILE | Yes | Shared account action; Administrator access remains Web-only. No dedicated route is implied. |
| UC-06 | Reset Password | Guest | SHARED_WEB_MOBILE | Yes | Shared password-recovery flow. |
| UC-07 | Change Password | Traveler / Tour Operator / Administrator | SHARED_WEB_MOBILE | Yes | Shared account-security flow; Administrator access remains Web-only. |
| UC-08 | Update Traveler Profile | Traveler | SHARED_WEB_MOBILE | Yes | Traveler Web workspace scope. |
| UC-09 | Update Travel Preferences | Traveler | SHARED_WEB_MOBILE | Yes | Traveler Web workspace scope. |
| UC-10 | Create Scheduling Request | Traveler | SHARED_WEB_MOBILE | Yes | Web may submit itinerary-planning constraints. |
| UC-11 | View Suggested Itinerary | Traveler | SHARED_WEB_MOBILE | Yes | Web may display generated itinerary results. |
| UC-12 | Explore Points of Interest | Guest / Traveler | SHARED_WEB_MOBILE | Yes | Public and authenticated Traveler Web scope. |
| UC-13 | Navigate Route | Traveler | MOBILE_ONLY | No | Depends on active-trip, location, and mobile navigation capabilities. |
| UC-14 | Receive Real-Time Alerts | Traveler | MOBILE_ONLY | No | Active-trip mobile alert experience. |
| UC-15 | Confirm Re-routing | Traveler | MOBILE_ONLY | No | Active-trip mobile rerouting flow. |
| UC-16 | Download Offline Map & Itinerary | Traveler | MOBILE_ONLY | No | Offline device storage and mobile trip execution. |
| UC-17 | Create Travel Group | Traveler | MOBILE_ONLY | No | Mobile travel-group experience. |
| UC-18 | Invite Group Members | Traveler | MOBILE_ONLY | No | Mobile invitation experience. |
| UC-19 | View Group Members | Traveler | MOBILE_ONLY | No | Mobile travel-group experience. |
| UC-20 | Remove Group Member | Traveler | MOBILE_ONLY | No | Mobile travel-group management. |
| UC-21 | Leave Travel Group | Traveler | MOBILE_ONLY | No | Mobile travel-group management. |
| UC-22 | Configure Group Location Sharing | Traveler | MOBILE_ONLY | No | Depends on mobile location-sharing behavior. |
| UC-23 | Join Shared Group Trip | Traveler | MOBILE_ONLY | No | Mobile invitation and shared-trip flow. |
| UC-24 | Search Tours | Guest / Traveler | SHARED_WEB_MOBILE | Yes | Public and authenticated Traveler Web scope. |
| UC-25 | Receive Tour Recommendations | Traveler | SHARED_WEB_MOBILE | Yes | Traveler Web workspace scope. |
| UC-26 | View Tour Details | Guest / Traveler | SHARED_WEB_MOBILE | Yes | Public and authenticated Traveler Web scope. |
| UC-27 | Book Tour | Traveler | SHARED_WEB_MOBILE | Yes | Traveler Web booking flow. |
| UC-28 | Make Electronic Payment | Traveler | SHARED_WEB_MOBILE | Yes | Traveler Web payment flow; integration remains backend-contract dependent. |
| UC-29 | View QR E-ticket | Traveler | SHARED_WEB_MOBILE | Yes | Web may display the ticket; camera-based validation is UC-43. |
| UC-30 | View Commercial Service | Traveler | MOBILE_ONLY | No | Commercial-service experience is Mobile-only in the approved scope. |
| UC-31 | Book Commercial Service | Traveler | MOBILE_ONLY | No | Commercial-service booking is Mobile-only in the approved scope. |
| UC-32 | View Trip History | Traveler | SHARED_WEB_MOBILE | Yes | Traveler Web workspace scope. |
| UC-33 | Submit Trip Review | Traveler | SHARED_WEB_MOBILE | Yes | Traveler Web workspace scope. |
| UC-34 | Update Tour Operator Profile | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-35 | Create Tour Package | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-36 | Update Tour Package | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-37 | Submit Tour for Approval | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-38 | Create Coupon | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-39 | Update Coupon | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-40 | View Customer Bookings | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-41 | Cancel Customer Booking | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-42 | Initiate Booking Refund | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope; integration remains backend-contract dependent. |
| UC-43 | Check In Traveler by QR Code | Tour Operator | MOBILE_ONLY | No | Requires the device camera at the meeting point. |
| UC-44 | View Revenue Report | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-45 | Export Revenue Report | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope. |
| UC-46 | Request Payout Settlement | Tour Operator | SHARED_WEB_MOBILE | Yes | Tour Operator Web workspace scope; integration remains backend-contract dependent. |
| UC-47 | View User Accounts | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-48 | Lock User Account | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-49 | Unlock User Account | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-50 | Approve Tour Operator Application | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-51 | Reject Tour Operator Application | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-52 | Create POI | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-53 | Update POI | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-54 | Remove POI | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-55 | Create Route | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-56 | Update Route | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-57 | Configure Algorithm Parameters | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-58 | View Active Trips | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-59 | View Active Trip Details | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-60 | Approve Tour Post | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-61 | Reject Tour Post | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-62 | View Platform Bookings | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-63 | View Payout Records | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-64 | View Payout Details | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-65 | Confirm Payout Settlement | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-66 | Update Landing Page Content | Administrator | ADMIN_WEB_ONLY | Yes | Administrator manages the `PUBLIC_WEB` landing content. |
| UC-67 | Export Statistical Reports | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-68 | View Audit Logs | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-69 | View Audit Log Details | Administrator | ADMIN_WEB_ONLY | Yes | Administrator Web workspace. |
| UC-70 | Handle Emergency Tour Cancellation | Traveler / Tour Operator | NON_SCREEN | No | System-triggered workflow; results may surface in approved existing screens or notifications. |
| UC-71 | Process Automatic Refund | Traveler | NON_SCREEN | No | System-triggered workflow; status may surface in approved booking or payment screens. |
| UC-72 | Synchronize Offline Trip Data | Traveler | MOBILE_ONLY | No | Runs when the mobile device reconnects; no Web route is required. |

## Current Frontend coverage

| Product Area | Required by SRS | Currently Implemented | Status |
|---|---|---|---|
| Public | Landing Page plus UC-01, UC-02, UC-04, UC-06, UC-12, UC-24, and UC-26 | Landing Page only; no production authentication, POI, or tour-discovery flows | PARTIAL |
| Traveler Web | Shared Traveler UCs identified above | No production Traveler routes or feature modules | NOT_IMPLEMENTED |
| Tour Operator Web | Shared Tour Operator UCs identified above | No production Tour Operator routes or feature modules | NOT_IMPLEMENTED |
| Admin Web | UC-47 through UC-69, plus Administrator account-security access | Dashboard and tour-review prototype screens only; no verified production integration | PARTIAL |
| Mobile-only | UC-13 through UC-23, UC-30, UC-31, UC-43, and UC-72 | Outside this repository's production Web scope | MOBILE_ONLY |
| System-triggered | UC-70 and UC-71 | No standalone screen required | NOT_APPLICABLE |

## Recommended implementation batches

Every visual screen below requires an approved Web Screen Specification before implementation. API, authentication, payment, and authorization work also depends on approved backend contracts.

| Batch | Related UCs | Expected Web Screens | Specification Dependency | Readiness |
|---|---|---|---|---|
| 1 — Public + Authentication | UC-01 through UC-07 where Web-supported, UC-12, UC-24, UC-26 | Shared sign-in; Traveler registration; Tour Operator registration, application status, and resubmission; reset/change password; POI browse/detail; tour search/detail; sign-out action | Approved Web Screen Specifications and auth/API contracts | NOT_READY |
| 2 — Traveler Web core | UC-08 through UC-11, UC-25, UC-27 through UC-29, UC-32, UC-33 | Profile, preferences, planner, itinerary, recommendations, booking/payment/ticket, trip history, review | Approved Traveler Web Screen Specifications and domain/API contracts | NOT_READY |
| 3 — Tour Operator Web | UC-34 through UC-42 and UC-44 through UC-46 | Operator profile, tour/coupon management, customer bookings/refunds, revenue/export/payout | Approved Operator Web Screen Specifications and domain/API contracts | NOT_READY |
| 4 — Admin management | UC-47 through UC-57, UC-60, UC-61, UC-66 | Accounts, operator approval, POI/route/configuration, tour approval, landing content | Approved Admin Web Screen Specifications and authorization/API contracts | PARTIAL |
| 5 — Admin monitoring, finance, and reporting | UC-58, UC-59, UC-62 through UC-65, UC-67 through UC-69 | Active-trip monitoring, platform bookings, payouts, reports, audit logs | Approved Admin Web Screen Specifications and operational/finance/API contracts | NOT_READY |

`PARTIAL` for Batch 4 means a mock tour-review prototype exists; it is not evidence of production API, authentication, authorization, or persistence.

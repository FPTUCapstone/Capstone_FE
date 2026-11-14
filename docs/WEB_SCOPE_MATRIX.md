# TripMate Web Scope Matrix

## A. Document overview and source baseline

Version 2.1 · Updated 13 November 2026 (Asia/Ho_Chi_Minh). This document records the original SRS requirements, FE source evidence and unresolved approval gates. It authorizes no new feature, permission, financial operation or requirement change.

Canonical filename: **Report3_Software-Requirement-Specification.docx**, original non-V2. [Official working copy](https://docs.google.com/document/d/1VwPkqRyC6ZlbXBQC0ztdektt0vAyE3qt/edit). Fresh text and DOCX exports from that exact document ID were successfully accessed (HTTP 200) on 13 November 2026. DOCX export SHA-256: `093D69D721831608F462DE0AC450E4BBF3A8A96477B991622FDEAD1EFA3D25BA`. This identifies the inspected export bytes. The refreshed official text export matched the original audit export byte for byte (SHA-256 `02F1839D5D6476676C773633F157433825DC125B470033F9089D07808F58619A`). The review covered §§1, 2.1, 2.2.2, 3.1.2–3.1.5, 3.2–3.10, 5.1 and the application message list.

FE baseline: latest fetched `origin/develop` **`1f2ed13f9a40def98709736199d81e4afd23b52b`**. Local `develop` was `bbaa047ed385577df0a27c1f9c6dd1c260c84e46` and was not used as the audit baseline. The original checkout and its five modified itinerary files were preserved; this work uses an isolated worktree.

Revision evidence: Record of Changes includes rev10 entries dated 10 November and additions through 12 November 2026 (Provider/commission model). No immutable online revision ID or separately signed approval artifact was available. The 9 November decision cites an approver but written evidence pending; many 10–12 November entries explicitly say Approver/Evidence PENDING. Presence in the official working copy is separate from approval.

| Inventory | Direct SRS check | Result |
| --- | --- | --- |
| Use cases | §2.2.2, source caption Table 2 – Use Case Description | 83, UC-01–UC-83 |
| Actors | §2.1 Table 1 | Six distinct roles; original indices 1, 2, 3, 4, 5, 7 |
| Screens | §§3.1.2.1–3.1.2.2 | 37 + 69 = 106, IDs 1–106 |
| Authorization | §3.1.3 Table 5 | 106 named rows, six role columns |
| Non-screen functions | §3.1.4 Table 6 | 19, IDs 1–19 |

Authority order: (1) traceably approved newer changes, (2) original Report 3, (3) Reports 1/2 as context, (4) approved supporting specifications consistent with Report 3, (5) implementation/Jira/diagrams/docs, (6) historical conversations, assumptions and obsolete V2. **V2 is not an authority and was not used to fill requirements.** Internal SRS contradictions remain open; no invented precedence rule resolves them.

Platform scope: `WEB_ONLY`, `WEB_AND_MOBILE`, `ADMIN_WEB_ONLY`, `MOBILE_ONLY`, `NON_SCREEN`, `NOT_SPECIFIED`, `CONFLICT_REQUIRES_APPROVAL`. Implementation: `COMPLIANT`, `MISMATCH`, `MISSING_IMPLEMENTATION`, `AMBIGUOUS_REQUIREMENT`, `NOT_VERIFIED`. Approval: `APPROVED`, `PENDING_APPROVAL`, `NOT_REQUIRED`, `NOT_EVIDENCED`. A proposal is not approved; unknown provenance is NOT_EVIDENCED. NOT_REQUIRED means no new requirement decision applies, not automatic approval of a rule.

Limits: FE source/tests only. Backend, gateways, Mobile, deployment, job execution and persisted ownership are NOT_VERIFIED. No UC is COMPLIANT: route existence and tests do not prove all SRS/backend behavior. Mobile-only functions are not missing FE features. Canonical records use explicit anchors; repeated cross-references are not duplicate inventory rows.

## B. Actor and platform ownership

| Actor | Public/authenticated Web | Mobile | Admin Web | Workspace constraint |
| --- | --- | --- | --- | --- |
| Guest | Public entry/discovery | Public entry/discovery | No protected access | No authenticated actions |
| Traveler | Shared capabilities | Shared + explicit Mobile-only exceptions | No | Own authenticated Traveler data |
| Tour Operator | Approved partner; UC41 Web-only | Shared; UC43 scanner only | No | Own business/tours; UC44/45 conflict |
| Service Provider | Dedicated Web-only workspace | No | No | Own linked POIs/statements; GAP-01 |
| Staff | No public/partner operations | No | Assigned operational UCs only | No Admin privilege inheritance |
| Administrator | No public/partner operations | No | Assigned governance UCs only | No Staff privilege inheritance |

### Guest

An unauthenticated visitor. Searches and views published tour packages and points of interest, registers a Traveler or Tour Operator account, signs in and resets a password. Available on both platforms; the public landing page is part of the web application. All other actions require authentication.

- **Ownership / accessible workspace:** Public Web and Android entry points; no protected actions. Web landing #1; mobile home #38.
- **UC references:** UC-01/02; pre-auth UC-04/06; discovery UC-12/24/26.
- **Authorization:** §1, §2.1, Table 5 and detailed action/ownership rules. BR-168 separates Staff operational targets from Administrator Staff-account governance; Provider list/unlock inconsistency remains GAP-07. Account status and ownership still apply.

### Traveler

A registered end user who plans and takes trips. On both platforms: manages profile and travel preferences, requests auto-generated itineraries, explores points of interest, searches and books tours, pays online, holds QR e-tickets, cancels bookings, submits post-trip complaints and responds to partial refund proposals, and reviews and rates past trips. On mobile only: real-time navigation, trip alerts and rerouting confirmation, offline maps and itineraries with later synchronization, travel group location sharing, and commercial service booking.

- **Ownership / accessible workspace:** Authenticated Web and Android; live navigation/alerts/rerouting/offline/group and commercial-service booking remain Mobile-only.
- **UC references:** UC-08–33, UC-41/68/75; shared authentication.
- **Authorization:** §1, §2.1, Table 5 and detailed action/ownership rules. BR-168 separates Staff operational targets from Administrator Staff-account governance; Provider list/unlock inconsistency remains GAP-07. Account status and ownership still apply.

### Tour Operator

A verified travel business partner selling tours on TripMate. On both platforms: maintains the business profile and resubmits a rejected application, creates and updates tour packages for Staff approval, issues discount coupons, manages customer bookings including cancellation, refund confirmation (UC-42) and post-trip complaint responses (UC-69), views and exports revenue reports, and receives automatic per-booking payout settlements. On web only: cancelling a customer booking (UC-41). On mobile only: QR code check-in, which needs the device camera.

- **Ownership / accessible workspace:** Approved partner Web and Android workspace; UC-41 cancellation Web-only for this role; UC-43 QR scan Mobile-only; revenue/export conflict GAP-06.
- **UC references:** UC-03, UC-34–45/66/69; shared authentication.
- **Authorization:** §1, §2.1, Table 5 and detailed action/ownership rules. BR-168 separates Staff operational targets from Administrator Staff-account governance; Provider list/unlock inconsistency remains GAP-07. Account status and ownership still apply.

### Service Provider

A commercial partner (hotel, vehicle rental or restaurant) whose service is a commercial point of interest on TripMate. Uses the Service Provider workspace on the web application only, with an account created by Staff and linked to its own commercial points of interest: signs in, views the service booking requests of its own services, and confirms or rejects them. Cannot access the Tour Operator workspace or the web administration workspace.

- **Ownership / accessible workspace:** Dedicated Web workspace only; no Mobile, Tour Operator or Administration workspace. Linked commercial POIs; authentication gap GAP-01.
- **UC references:** UC-04–07/78–80/82; System UC-81 results.
- **Authorization:** §1, §2.1, Table 5 and detailed action/ownership rules. BR-168 separates Staff operational targets from Administrator Staff-account governance; Provider list/unlock inconsistency remains GAP-07. Account status and ownership still apply.

### Staff

Staff is an internal operational employee who works through the web administration workspace. Staff manages permitted Traveler and Tour Operator account operations, reviews Tour Operator applications and tour submissions, maintains supported POI and route data, monitors active trips and platform bookings, manages supported landing-page content, views settlement records, and records the receipt of refund shares returned by Tour Operators (UC-42). Staff cannot handle failed payout settlements, modify critical system configuration, or access audit functions.

- **Ownership / accessible workspace:** Web Administration only. Operational grants per UC; no failed-payout resolution, algorithm configuration or audit access.
- **UC references:** UC-42/46–52/54/55/57–62/72/77/83, as assigned.
- **Authorization:** §1, §2.1, Table 5 and detailed action/ownership rules. BR-168 separates Staff operational targets from Administrator Staff-account governance; Provider list/unlock inconsistency remains GAP-07. Account status and ownership still apply.

### Administrator

Administrator is a privileged internal role responsible for high-level system governance, financial oversight, security, and Staff supervision. The Administrator manages Staff accounts, performs privileged master-data operations, configures algorithm parameters, reviews platform-wide financial and statistical reports, handles failed payout settlements (UC-73) and escalated refunds, and reviews system audit logs.

- **Ownership / accessible workspace:** Web Administration only. Governance and Staff supervision; no blanket inheritance of Staff operations.
- **UC references:** UC-46–48/52/53/56/63–65/72/73/76; escalated UC-67.
- **Authorization:** §1, §2.1, Table 5 and detailed action/ownership rules. BR-168 separates Staff operational targets from Administrator Staff-account governance; Provider list/unlock inconsistency remains GAP-07. Account status and ownership still apply.

## C. Complete UC Web scope matrix

Each anchored record is one catalog UC. Catalog actors and initiating actors are separate; system-triggered records remain system-triggered. BR/MSG lists are references in complete detailed sections, including alternative/error flows; no implementation claim follows. Screen mappings follow named interfaces and inventory descriptions, with observer surfaces distinguished.

<a id="uc-01"></a>

### UC-01 — Register Traveler Account

- **Source:** §2.2.2 UC-01; **§3.2.1 Register Traveler Account**.
- **Primary actor:** Guest. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Guest. **Catalog actors:** Guest.
- **Purpose:** Allows a Guest to create a TripMate Traveler account so that the protected Traveler functions of the system become accessible. **Trigger:** The function is triggered when a Guest selects the Register action on the Sign In screen of the mobile application, or the Register action on the public landing page of the web application, and submits the Traveler registration form.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.2.1 Interface: Traveler Registration screen, provided on both the Flutter mobile application and the responsive Next.js web application, with the required account fields and an alternative Continue with Google action.; §2.2.2 UC-01; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#41](#screen-41), [#42](#screen-42). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: Full Name, Email Address, Password, Confirm Password. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-01, BR-02, BR-03, BR-04, BR-05, BR-06 **MSG:** MSG01, MSG02, MSG03, MSG04, MSG05, MSG06, MSG07, MSG08, MSG127
- **FE evidence:** [FE-01](#fe-01). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-02"></a>

### UC-02 — Register Tour Operator Account

- **Source:** §2.2.2 UC-02; **§3.2.2 Register Tour Operator Account**.
- **Primary actor:** Guest. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Guest. **Catalog actors:** Guest.
- **Purpose:** Allows a business Guest to create a TripMate Tour Operator account from either the mobile application or the web application so that, after Staff approval, the Tour Operator Workspace functions become accessible. **Trigger:** The function is triggered when a Guest selects Register as Tour Operator on the Sign In screen of the Flutter mobile application, or the corresponding registration option on the public landing page of the Next.js web application, and submits the Tour Operator registration form together with the required business documents.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.2.2 Interface: Tour Operator Registration screen provided on both the Flutter mobile application and the responsive Next.js web application, containing the account fields, company information fields, and the business document upload area.; §2.2.2 UC-02; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#43](#screen-43), [#44](#screen-44). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: Email Address, Password, Confirm Password. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-01, BR-02, BR-03, BR-07, BR-08 **MSG:** MSG01, MSG02, MSG03, MSG04, MSG05, MSG19, MSG21, MSG22, MSG23, MSG26, MSG127
- **FE evidence:** [FE-02](#fe-02). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-03"></a>

### UC-03 — Resubmit Tour Operator Application

- **Source:** §2.2.2 UC-03; **§3.2.3 Resubmit Tour Operator Application**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator with a rejected application. **Catalog actors:** Tour Operator.
- **Purpose:** Allows an applicant whose Tour Operator application was rejected to correct the reported deficiencies and submit the application for review again from either platform, without creating a duplicate account. **Trigger:** The function is triggered when a Tour Operator whose application has been rejected signs in on either the Flutter mobile application or the Next.js web application, opens the Application Status screen, and selects Resubmit Application.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.2.3 Interface: Application Status and Resubmit Application screens provided on both the Flutter mobile application and the responsive Next.js web application, displaying the recorded rejection reason and allowing company information and business documents to be corrected.; §2.2.2 UC-03; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#43](#screen-43), [#44](#screen-44). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.2.3; Tour Operator with a rejected application. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-07, BR-08, BR-09, BR-181 **MSG:** MSG01, MSG19, MSG22, MSG24, MSG25, MSG26, MSG127
- **FE evidence:** [FE-02](#fe-02). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-04"></a>

### UC-04 — Sign In

- **Source:** §2.2.2 UC-04; **§3.2.4 Sign In**.
- **Primary actor:** Traveler / Tour Operator / Service Provider / Staff / Administrator (not yet authenticated). **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler, Tour Operator, Staff, Administrator. **Catalog actors:** Traveler / Tour Operator / Service Provider / Staff / Administrator (not yet authenticated).
- **Purpose:** Allows a registered user to authenticate and obtain an authenticated session, so that the functions permitted for the assigned role become accessible. **Trigger:** The function is triggered when a registered user opens the Sign In screen of the mobile application or the web application, enters the account credentials and submits the form, or selects Continue with Google.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Traveler / Tour Operator shared; Provider Web workspace with GAP-01. **Mobile:** Traveler / Tour Operator only. **Admin Web:** Staff / Administrator internal workspace only. **Basis:** §3.2.4 Interface: Sign In screen on the Flutter mobile application and the responsive Next.js web application, with the credential fields, a Continue with Google action and a Forgot Password link.; §2.2.2 UC-04; §1 / §2.1 actor workspace restrictions. Staff/Administrator ADMIN_WEB_ONLY; Service Provider WEB_ONLY as actor workspace, detailed auth unresolved GAP-01.
- **Screens:** [#2](#screen-2), [#39](#screen-39), [#40](#screen-40). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: Email Address, Password, or a verified Google identity. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-03, BR-05, BR-07, BR-10, BR-11, BR-12, BR-168, BR-183 **MSG:** MSG01, MSG02, MSG09, MSG10, MSG11, MSG12, MSG127, MSG182
- **FE evidence:** [FE-03](#fe-03). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-01: catalog includes Service Provider; detailed Actors / Roles omits it; authentication screen authorization omits Service Provider. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-05"></a>

### UC-05 — Sign Out

- **Source:** §2.2.2 UC-05; **§3.2.5 Sign Out**.
- **Primary actor:** Traveler / Tour Operator / Service Provider / Staff / Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler, Tour Operator, Staff, Administrator. **Catalog actors:** Traveler / Tour Operator / Service Provider / Staff / Administrator.
- **Purpose:** Allows an authenticated user to terminate the current session so that the issued tokens can no longer be used to access protected functions. **Trigger:** The function is triggered when an authenticated user selects Sign Out from the account menu of the mobile application or the web application.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Traveler / Tour Operator shared; Provider Web workspace with GAP-01. **Mobile:** Traveler / Tour Operator only. **Admin Web:** Staff / Administrator internal workspace only. **Basis:** §3.2.5 Interface: Sign Out action in the account menu of the Flutter mobile application and the responsive Next.js web application, with a confirmation dialog.; §2.2.2 UC-05; §1 / §2.1 actor workspace restrictions. Staff/Administrator ADMIN_WEB_ONLY; Service Provider WEB_ONLY as actor workspace, detailed auth unresolved GAP-01.
- **Screens:** No numbered screen explicitly assigned.. Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: Access token, Refresh token. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-12, BR-13 **MSG:** MSG13
- **FE evidence:** [FE-03](#fe-03). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-01: catalog includes Service Provider; detailed Actors / Roles omits it. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-06"></a>

### UC-06 — Reset Password

- **Source:** §2.2.2 UC-06; **§3.2.6 Reset Password**.
- **Primary actor:** Traveler / Tour Operator / Service Provider / Staff / Administrator (not yet authenticated). **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler, Tour Operator, Staff, Administrator. **Catalog actors:** Traveler / Tour Operator / Service Provider / Staff / Administrator (not yet authenticated).
- **Purpose:** Allows a registered user who cannot recall the account password to set a new password through a single-use reset code delivered to the registered email address. **Trigger:** The function is triggered when a registered user selects Forgot Password on the Sign In screen, submits the registered email address and then submits the received reset code together with a new password.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Traveler / Tour Operator shared; Provider Web workspace with GAP-01. **Mobile:** Traveler / Tour Operator only. **Admin Web:** Staff / Administrator internal workspace only. **Basis:** §3.2.6 Interface: Forgot Password, Enter Reset Code and Set New Password screens on the Flutter mobile application and the responsive Next.js web application; §2.2.2 UC-06; §1 / §2.1 actor workspace restrictions. Staff/Administrator ADMIN_WEB_ONLY; Service Provider WEB_ONLY as actor workspace, detailed auth unresolved GAP-01.
- **Screens:** [#3](#screen-3), [#45](#screen-45). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.2.6; Traveler, Tour Operator, Staff, Administrator. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-02, BR-03, BR-14, BR-15 **MSG:** MSG01, MSG02, MSG03, MSG04, MSG14, MSG15, MSG16, MSG127
- **FE evidence:** [FE-03](#fe-03). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-01: catalog includes Service Provider; detailed Actors / Roles and password-reset screen authorization omit it. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-07"></a>

### UC-07 — Change Password

- **Source:** §2.2.2 UC-07; **§3.2.7 Change Password**.
- **Primary actor:** Traveler / Tour Operator / Service Provider / Staff / Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler, Tour Operator, Staff, Administrator. **Catalog actors:** Traveler / Tour Operator / Service Provider / Staff / Administrator.
- **Purpose:** Allows an authenticated user to replace the account password while proving ownership of the account through the current password. **Trigger:** The function is triggered when an authenticated user opens the Change Password screen, enters the current password and a new password, and submits the form.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Traveler / Tour Operator shared; Provider Web workspace with GAP-01. **Mobile:** Traveler / Tour Operator only. **Admin Web:** Staff / Administrator internal workspace only. **Basis:** §3.2.7 Interface: Change Password screen in the account settings area of the Flutter mobile application and the responsive Next.js web application; §2.2.2 UC-07; §1 / §2.1 actor workspace restrictions. Staff/Administrator ADMIN_WEB_ONLY; Service Provider WEB_ONLY as actor workspace, detailed auth unresolved GAP-01.
- **Screens:** [#4](#screen-4), [#46](#screen-46). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.2.7; Traveler, Tour Operator, Staff, Administrator. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-02, BR-03, BR-15 **MSG:** MSG01, MSG03, MSG04, MSG17, MSG18, MSG127, MSG181
- **FE evidence:** [FE-03](#fe-03). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-01: catalog includes Service Provider; detailed Actors / Roles and change-password screen authorization omit it. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-08"></a>

### UC-08 — Update Traveler Profile

- **Source:** §2.2.2 UC-08; **§3.2.8 Update Traveler Profile**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to view and maintain the personal profile information used by the booking, group and review functions of the system. **Trigger:** The function is triggered when an authenticated Traveler opens the Profile screen, selects Edit Profile, modifies the profile information and submits the form.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.2.8 Interface: Profile and Edit Profile screens on the Flutter mobile application and the responsive Next.js web application; §2.2.2 UC-08; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#48](#screen-48). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.2.8; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-01, BR-16, BR-17, BR-18 **MSG:** MSG01, MSG19, MSG20, MSG127, MSG179, MSG180
- **FE evidence:** [FE-04](#fe-04). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-09"></a>

### UC-09 — Update Travel Preferences

- **Source:** §2.2.2 UC-09; **§3.2.9 Update Travel Preferences**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to declare the travel preferences that the itinerary generation function and the tour recommendation function use as matching input. **Trigger:** The function is triggered when an authenticated Traveler opens the Travel Preferences screen, selects the preferred interests, travel style and budget level, and saves the selection.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.2.9 Interface: Travel Preferences screen on the Flutter mobile application and the responsive Next.js web application, presenting the selectable interest tags, the travel style options and the budget level options.; §2.2.2 UC-09; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#49](#screen-49). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.2.9; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-19, BR-20 **MSG:** MSG27, MSG127, MSG143
- **FE evidence:** [FE-04](#fe-04). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-10"></a>

### UC-10 — Create Scheduling Request

- **Source:** §2.2.2 UC-10; **§3.3.1 Create Scheduling Request**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to declare the destination, the travel dates, the budget and the interests of a planned trip, so that the Smart Scheduling Algorithm can generate a suggested itinerary. **Trigger:** The function is triggered when an authenticated Traveler selects Plan a Trip, enters the travel criteria and submits the scheduling request.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.3.1 Interface: Create Scheduling Request screen on the Flutter mobile application and the responsive Next.js web application, with the destination selector, the date range selector, the budget field and the interest tag selector.; §2.2.2 UC-10; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#50](#screen-50). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.3.1; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-21, BR-22, BR-23, BR-24, BR-25, BR-26 **MSG:** MSG28, MSG29, MSG30, MSG31, MSG127, MSG143
- **FE evidence:** [FE-05](#fe-05). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-11"></a>

### UC-11 — View Suggested Itinerary

- **Source:** §2.2.2 UC-11; **§3.3.2 View Suggested Itinerary**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to inspect the day-by-day schedule of a generated itinerary, including the scheduled points of interest, the planned timing, the connecting routes and the estimated cost, and to accept, regenerate or adjust the itinerary. **Trigger:** The function is triggered when a Traveler opens a generated itinerary from the scheduling result, from My Trips, or from a shared travel group.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.3.2 Interface: Suggested Itinerary screen on the Flutter mobile application and the responsive Next.js web application, presenting the itinerary as a day-by-day timeline together with a map overview.; §2.2.2 UC-11; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#51](#screen-51). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.3.2; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-24, BR-25, BR-26, BR-27, BR-51 **MSG:** MSG32, MSG49, MSG126, MSG127
- **FE evidence:** [FE-05](#fe-05). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-12"></a>

### UC-12 — Explore Points of Interest

- **Source:** §2.2.2 UC-12; **§3.3.3 Explore Points of Interest**.
- **Primary actor:** Guest / Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Guest, Traveler. **Catalog actors:** Guest / Traveler.
- **Purpose:** Allows a Traveler to browse, search and inspect the points of interest of the centralized catalogue, so that a destination can be explored before or during a trip. **Trigger:** The function is triggered when a Traveler opens the Explore section, submits supported point of interest search or filter criteria, or selects a point of interest from a list, a map or an itinerary item.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.3.3 Interface: Explore Points of Interest list and map screens and the Point of Interest Details screen on the Flutter mobile application and the responsive Next.js web application; §2.2.2 UC-12; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#53](#screen-53), [#54](#screen-54). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.3.3; Guest, Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-24, BR-34, BR-180 **MSG:** MSG33, MSG34, MSG46, MSG126, MSG127
- **FE evidence:** [FE-06](#fe-06). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-13"></a>

### UC-13 — Navigate Route

- **Source:** §2.2.2 UC-13; **§3.3.4 Navigate Route**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to follow the planned route of an Active itinerary with turn-by-turn guidance, so that the scheduled points of interest can be reached in the planned order. **Trigger:** The function is triggered when a Traveler selects Start Navigation for an Active itinerary or for a selected itinerary item on the mobile application.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.3.4 Interface: Navigation screen on the Flutter mobile application, presenting the map, the current position, the active route segment and the turn-by-turn instructions.; §2.2.2 UC-13; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#55](#screen-55). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.3.4; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-28, BR-31, BR-35, BR-40 **MSG:** MSG32, MSG35, MSG36, MSG37, MSG45, MSG46, MSG47, MSG48, MSG126
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-14"></a>

### UC-14 — Receive Real-Time Alerts

- **Source:** §2.2.2 UC-14; **§3.3.5 Receive Real-Time Alerts**.
- **Primary actor:** System. **Supporting/context:** Traveler (alert recipient); weather/location/event inputs. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to be informed about weather conditions, traffic conditions, point of interest closures and safety notices that affect the current itinerary, so that the trip can be adjusted in time. **Trigger:** The function is triggered when the system detects a condition relevant to an Active itinerary or to the current position of a Traveler, and delivers the corresponding alert to the mobile application.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.3.5 Interface: Push notification, in-application alert banner on the Navigation screen and the Alerts list on the Flutter mobile application; §2.2.2 UC-14; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#56](#screen-56). System result/observation surfaces only; not a standalone screen grant. **Interaction:** System event/background processing; embedded result surfaces.
- **Authorization:** Role and data restrictions in 3.3.5; Traveler, System. System processing has no independent human page grant. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-29, BR-30, BR-31, BR-32 **MSG:** MSG38, MSG39, MSG40, MSG41, MSG128
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-15"></a>

### UC-15 — Confirm Re-routing

- **Source:** §2.2.2 UC-15; **§3.3.6 Confirm Re-routing**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to inspect a proposed alternative route or a proposed itinerary adjustment and to decide explicitly whether it replaces the current plan, so that the itinerary is never changed without the consent of the Traveler. **Trigger:** The function is triggered when the system offers a re-routing suggestion following a route deviation or a real-time alert, and the Traveler opens the suggestion to accept or decline it.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.3.6 Interface: Re-routing Suggestion screen on the Flutter mobile application, presenting the current plan and the proposed plan side by side on the map.; §2.2.2 UC-15; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#57](#screen-57). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.3.6; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-25, BR-26, BR-27, BR-31, BR-33 **MSG:** MSG41, MSG42, MSG43, MSG44, MSG127
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-16"></a>

### UC-16 — Download Offline Map & Itinerary

- **Source:** §2.2.2 UC-16; **§3.3.7 Download Offline Map & Itinerary**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to download the essential itinerary, point of interest, route and map information to the mobile device, so that the supported trip information remains accessible when the network connectivity is weak or unavailable. **Trigger:** The function is triggered when a Traveler opens an accessible itinerary and selects Download for Offline Use before or during a trip.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.3.7 Interface: Offline Map & Itinerary screen on the Flutter mobile application, with the download action, the download progress indicator and the offline availability state of the itinerary.; §2.2.2 UC-16; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#52](#screen-52). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.3.7; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-36, BR-37, BR-38, BR-39, BR-40 **MSG:** MSG32, MSG104, MSG105, MSG106, MSG107, MSG126
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-17"></a>

### UC-17 — Create Travel Group

- **Source:** §2.2.2 UC-17; **§3.4.1 Create Travel Group**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows an authenticated Traveler to create a shared travel group associated with one existing and accessible TripMate itinerary. The creating Traveler becomes the sole Group Host. **Trigger:** The function is triggered when an authenticated Traveler with the Traveler role selects Create Travel Group for an eligible TripMate itinerary.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.4.1 Interface: Create a Travel Group screen on the Flutter mobile application; §2.2.2 UC-17; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#58](#screen-58), [#59](#screen-59). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.4.1; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-41, BR-42, BR-48 **MSG:** MSG01, MSG54, MSG126, MSG127
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-18"></a>

### UC-18 — Invite Group Members

- **Source:** §2.2.2 UC-18; **§3.4.2 Invite Group Members**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler acting as Group Host. **Catalog actors:** Traveler.
- **Purpose:** Allows the Group Host to generate and share an invitation code or a QR invitation that eligible Travelers can use to join the travel group. **Trigger:** The function is triggered when the Group Host selects Invite Members from an existing travel group.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.4.2 Interface: Invite Group Members screen on the Flutter mobile application; §2.2.2 UC-18; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#60](#screen-60), [#61](#screen-61). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.4.2; Traveler acting as Group Host. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-43, BR-44, BR-46 **MSG:** MSG55, MSG126, MSG127
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-19"></a>

### UC-19 — View Group Members

- **Source:** §2.2.2 UC-19; **§3.4.3 View Group Members**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows an active group member to view the permitted membership information of the selected travel group. **Trigger:** The function is triggered when an active group member opens the Members section of a travel group.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.4.3 Interface: Travel Group Details & Members screen on the Flutter mobile application; §2.2.2 UC-19; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#60](#screen-60). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.4.3; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-48, BR-49, BR-51 **MSG:** MSG126, MSG127, MSG128
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-20"></a>

### UC-20 — Remove Group Member

- **Source:** §2.2.2 UC-20; **§3.4.4 Remove Group Member**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler acting as Group Host. **Catalog actors:** Traveler.
- **Purpose:** Allows the Group Host to remove an active member from the group. **Trigger:** The function is triggered when the Group Host selects an active member and chooses Remove Member.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.4.4 Interface: Travel Group Details & Members screen and the Remove Group Member confirmation dialog on the Flutter mobile application; §2.2.2 UC-20; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#60](#screen-60), [#62](#screen-62). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Role and data restrictions in 3.4.4; Traveler acting as Group Host. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-45, BR-48, BR-51 **MSG:** MSG59, MSG60, MSG126, MSG127
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-21"></a>

### UC-21 — Leave Travel Group

- **Source:** §2.2.2 UC-21; **§3.4.5 Leave Travel Group**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows an active Traveler to voluntarily leave a travel group while preserving a valid Group Host state. **Trigger:** The function is triggered when an active group member selects Leave Group.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.4.5 Interface: Leave Travel Group confirmation screen on the Flutter mobile application; §2.2.2 UC-21; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#60](#screen-60), [#63](#screen-63). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Role and data restrictions in 3.4.5; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-48, BR-49, BR-51 **MSG:** MSG61, MSG127, MSG129, MSG130
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-22"></a>

### UC-22 — Configure Group Location Sharing

- **Source:** §2.2.2 UC-22; **§3.4.6 Configure Group Location Sharing**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows an active group member to explicitly enable or disable the sharing of the personal GPS location with the permitted members of the same group. **Trigger:** The function is triggered when an active group member changes the Location Sharing setting.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.4.6 Interface: Group Location Sharing Settings screen on the Flutter mobile application; §2.2.2 UC-22; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#64](#screen-64). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.4.6; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-50, BR-51 **MSG:** MSG46, MSG62, MSG63, MSG127
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-23"></a>

### UC-23 — Join Shared Group Trip

- **Source:** §2.2.2 UC-23; **§3.4.7 Join Shared Group Trip**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to join an existing travel group using a valid and currently usable invitation. **Trigger:** The function is triggered when a Traveler enters an invitation code or scans a group QR invitation.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.4.7 Interface: Join Shared Group Trip screen on the Flutter mobile application, with the invitation code field and the QR scanner.; §2.2.2 UC-23; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#65](#screen-65). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-46, BR-47, BR-48, BR-51 **MSG:** MSG01, MSG46, MSG56, MSG57, MSG58, MSG127
- **FE evidence:** [FE-07](#fe-07). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-24"></a>

### UC-24 — Search Tours

- **Source:** §2.2.2 UC-24; **§3.5.1 Search Tours**.
- **Primary actor:** Guest / Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler, Guest. **Catalog actors:** Guest / Traveler.
- **Purpose:** Allows a user to find published tour packages by keyword and by filter criteria before deciding to view the details or to book. **Trigger:** The function is triggered when a Traveler or a Guest submits a search keyword or applies a filter on the Tour Search screen.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.5.1 Interface: Tour Search screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-24; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#66](#screen-66). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: None. The function is available to a Guest; the authentication is required only to book. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-52, BR-53, BR-54, BR-55, BR-56 **MSG:** MSG29, MSG64, MSG127
- **FE evidence:** [FE-08](#fe-08). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-25"></a>

### UC-25 — Receive Tour Recommendations

- **Source:** §2.2.2 UC-25; **§3.5.2 Receive Tour Recommendations**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Presents the tour packages that the matching algorithm of TripMate evaluates as highly relevant to the travel preferences, the planning criteria and the trip history of the Traveler. **Trigger:** The function is triggered when a Traveler opens the Tour Recommendations screen, or when the recommendation list is refreshed after the travel preferences or the planning criteria have been changed.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.5.2 Interface: Tour Recommendations screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-25; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#67](#screen-67). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-20, BR-56, BR-57, BR-58, BR-60 **MSG:** MSG64, MSG68, MSG127, MSG183
- **FE evidence:** [FE-08](#fe-08). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-26"></a>

### UC-26 — View Tour Details

- **Source:** §2.2.2 UC-26; **§3.5.3 View Tour Details**.
- **Primary actor:** Guest / Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler, Guest. **Catalog actors:** Guest / Traveler.
- **Purpose:** Presents the complete information of a tour package, including its itinerary, its inclusions, its cancellation policy, its available departure schedules and its reviews, so that the user can decide whether to book it. **Trigger:** The function is triggered when a Traveler or a Guest selects a tour package from the search result list, from the recommendation list or from a shared tour link.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.5.3 Interface: Tour Detail screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-26; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#68](#screen-68). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: None for viewing. The authentication is required when [Book Now] is selected. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-54, BR-56, BR-59, BR-60, BR-96 **MSG:** MSG65, MSG127, MSG128
- **FE evidence:** [FE-08](#fe-08). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-27"></a>

### UC-27 — Book Tour

- **Source:** §2.2.2 UC-27; **§3.5.4 Book Tour**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to create a booking for a selected departure schedule of a tour package by entering the participant information, optionally applying a voucher, and confirming the total amount computed by TripMate. **Trigger:** The function is triggered when a signed-in Traveler selects [Book Now] for a departure schedule of an available tour package.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.5.4 Interface: Tour Booking screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-27; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#69](#screen-69). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-61, BR-62, BR-63, BR-64, BR-65, BR-66, BR-67, BR-68, BR-97, BR-98, BR-99, BR-100, BR-135, BR-154, BR-156 **MSG:** MSG01, MSG65, MSG77, MSG78, MSG79, MSG100, MSG101, MSG102, MSG103, MSG126, MSG127, MSG169, MSG196
- **FE evidence:** [FE-09](#fe-09). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-28"></a>

### UC-28 — Make Electronic Payment

- **Source:** §2.2.2 UC-28; **§3.5.5 Make Electronic Payment**.
- **Primary actor:** Traveler. **Supporting/context:** Payment Gateway (external). **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to pay the total amount of a booking through an integrated electronic payment gateway, and confirms the booking only after the payment result has been verified by TripMate. **Trigger:** The function is triggered when a Traveler starts the payment of a booking that has the status Pending Payment and has not expired.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.5.5 Interface: Payment screen on the Flutter mobile application and on the Next.js responsive web application, followed by the hosted page of the selected payment gateway.; §2.2.2 UC-28; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#70](#screen-70). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account and must be the owner of the booking. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-68, BR-69, BR-70, BR-71, BR-72, BR-73, BR-74, BR-75, BR-79, BR-80, BR-81, BR-154, BR-159, BR-179 **MSG:** MSG80, MSG81, MSG82, MSG85, MSG86, MSG87, MSG88, MSG89, MSG91, MSG92, MSG126, MSG169, MSG187
- **FE evidence:** [FE-09](#fe-09). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-29"></a>

### UC-29 — View QR E-ticket

- **Source:** §2.2.2 UC-29; **§3.5.6 View QR E-ticket**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Presents the QR e-ticket of a confirmed booking so that the Traveler can be checked in by the owning Tour Operator on the departure date. **Trigger:** The function is triggered when a Traveler opens the e-ticket of a confirmed booking from the Booking Confirmation screen or from the Trip History screen.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.5.6 Interface: QR E-ticket screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-29; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#71](#screen-71), [#72](#screen-72). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account and must be the owner of the booking. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-82, BR-83, BR-84, BR-85, BR-86, BR-90 **MSG:** MSG74, MSG93, MSG95, MSG98, MSG99, MSG126, MSG127, MSG187
- **FE evidence:** [FE-09](#fe-09). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-30"></a>

### UC-30 — View Commercial Service

- **Source:** §2.2.2 UC-30; **§3.6.1 View Commercial Service**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Presents the detailed information of a commercial service so that the Traveler can decide whether to submit a booking request for it. **Trigger:** The function is triggered when a Traveler selects a point of interest that belongs to one of the three commercial service categories, from the itinerary or from the Explore Points of Interest screen.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.6.1 Interface: Commercial Service Detail / Booking screen provided on the Flutter mobile application only.; §2.2.2 UC-30; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#74](#screen-74), [#75](#screen-75). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account to submit a booking request; the information itself is visible to any signed-in Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-34, BR-55, BR-87, BR-88 **MSG:** MSG34, MSG75, MSG127
- **FE evidence:** [FE-10](#fe-10). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-31"></a>

### UC-31 — Book Commercial Service

- **Source:** §2.2.2 UC-31; **§3.6.2 Book Commercial Service**.
- **Primary actor:** Traveler. **Supporting/context:** Service Provider (confirms under UC-79). **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to submit a booking request for a Hotel, a Vehicle Rental or a Restaurant service for a chosen date, time and quantity, and records the request until it is confirmed or rejected. **Trigger:** The function is triggered when a Traveler selects [Book Service] on the Commercial Service Detail screen of a bookable commercial service.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.6.2 Interface: Commercial Service Booking screen on the Flutter mobile application only (UC-31).; §2.2.2 UC-31; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#75](#screen-75). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-63, BR-87, BR-88, BR-89, BR-194, BR-196 **MSG:** MSG01, MSG69, MSG70, MSG71, MSG72, MSG73, MSG75, MSG76, MSG127, MSG186, MSG205
- **FE evidence:** [FE-10](#fe-10). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-32"></a>

### UC-32 — View Trip History

- **Source:** §2.2.2 UC-32; **§3.7.1 View Trip History**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Presents the past and the upcoming trips of the Traveler, including the tour bookings, the commercial service bookings and the self-planned itineraries, together with the actions that remain available for each of them. **Trigger:** The function is triggered when a Traveler opens the Trip History screen from the main navigation or from the profile.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.7.1 Interface: Trip History screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-32; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#76](#screen-76). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-52, BR-90, BR-91, BR-92 **MSG:** MSG29, MSG52, MSG127, MSG128
- **FE evidence:** [FE-11](#fe-11). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-33"></a>

### UC-33 — Submit Trip Review

- **Source:** §2.2.2 UC-33; **§3.7.2 Submit Trip Review**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows a Traveler to submit a rating and a written review for a completed trip, and updates the aggregate rating of the reviewed tour package or point of interest. **Trigger:** The function is triggered when a Traveler selects [Write Review] for a completed trip that has not been reviewed yet.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.7.2 Interface: Submit Trip Review screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-33; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#77](#screen-77). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The Traveler must be signed in with an Active account and must be the owner of the reviewed booking. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-16, BR-91, BR-92, BR-93, BR-94, BR-95, BR-96 **MSG:** MSG01, MSG19, MSG50, MSG51, MSG52, MSG53, MSG66, MSG67, MSG126, MSG127
- **FE evidence:** [FE-11](#fe-11). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-34"></a>

### UC-34 — Update Tour Operator Profile

- **Source:** §2.2.2 UC-34; **§3.8.1 Update Tour Operator Profile**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Allows an approved Tour Operator to maintain the business information that is presented to the Travelers on the tour detail pages. **Trigger:** The function is triggered when a Tour Operator opens the Operator Profile screen and saves a change.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.1 Interface: Operator Profile screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-34; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#79](#screen-79). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and an approved application. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-07, BR-08, BR-16, BR-17 **MSG:** MSG01, MSG02, MSG19, MSG121, MSG126, MSG127
- **FE evidence:** [FE-12](#fe-12). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-35"></a>

### UC-35 — Create Tour Package

- **Source:** §2.2.2 UC-35; **§3.8.2.1 Create Tour Package**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Allows a Tour Operator to create a new tour package as a draft, including its itinerary, its departure schedules, its pricing and its cancellation policy. **Trigger:** The function is triggered when a Tour Operator selects [Create Tour Package] in the Tour Package Management screen.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.2.1 Interface: Create Tour Package screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-35; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#80](#screen-80), [#81](#screen-81). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and an approved application. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-22, BR-56, BR-79, BR-101, BR-102 **MSG:** MSG01, MSG19, MSG29, MSG108, MSG126, MSG127, MSG143
- **FE evidence:** [FE-13](#fe-13). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-36"></a>

### UC-36 — Update Tour Package

- **Source:** §2.2.2 UC-36; **§3.8.2.2 Update Tour Package**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Allows a Tour Operator to modify an owned tour package, either directly while it is a draft or a rejected package, or through a new draft version when it is already approved and published. **Trigger:** The function is triggered when a Tour Operator opens one of the owned tour packages for editing and saves a change.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.2.2 Interface: Update Tour Package screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-36; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#80](#screen-80), [#82](#screen-82). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and must be the owner of the tour package. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-22, BR-61, BR-101, BR-102, BR-103 **MSG:** MSG01, MSG29, MSG109, MSG110, MSG122, MSG126, MSG127, MSG143
- **FE evidence:** [FE-13](#fe-13). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-37"></a>

### UC-37 — Submit Tour for Approval

- **Source:** §2.2.2 UC-37; **§3.8.2.3 Submit Tour Package for Approval**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Submits a completed tour package to the Administrator for the moderation that decides whether the tour package may be published to the Travelers. **Trigger:** The function is triggered when a Tour Operator selects [Submit for Approval] on an owned tour package whose status is Draft or Rejected.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.2.3 Interface: Tour Package Management screen and the submission confirmation dialog on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-37; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#80](#screen-80), [#83](#screen-83). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and must be the owner of the tour package. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-56, BR-101, BR-102, BR-103, BR-185 **MSG:** MSG01, MSG110, MSG111, MSG122, MSG126, MSG127
- **FE evidence:** [FE-13](#fe-13). **Implementation:** `AMBIGUOUS_REQUIREMENT`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** Catalog and normal flow submit to Staff; detailed postcondition PC-02 retains Administrator and UC-60/UC-61 references (current approval UCs are UC-59/UC-60). **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-38"></a>

### UC-38 — Create Coupon

- **Source:** §2.2.2 UC-38; **§3.8.3.1 Create Coupon**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Allows a Tour Operator to issue a discount coupon that the Travelers may apply to the bookings of the owned tour packages. **Trigger:** The function is triggered when a Tour Operator selects [Create Coupon] in the Coupon Management screen.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.3.1 Interface: Create Coupon screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-38; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#84](#screen-84), [#85](#screen-85). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and an approved application. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-97, BR-98, BR-100, BR-102, BR-184 **MSG:** MSG01, MSG29, MSG112, MSG113, MSG126, MSG127, MSG143
- **FE evidence:** [FE-14](#fe-14). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-39"></a>

### UC-39 — Update Coupon

- **Source:** §2.2.2 UC-39; **§3.8.3.2 Update Coupon**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Allows a Tour Operator to change the conditions of an owned coupon or to deactivate it, without affecting the bookings on which the coupon has already been applied. **Trigger:** The function is triggered when a Tour Operator opens an owned coupon for editing and saves a change, or deactivates it.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.3.2 Interface: Update Coupon screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-39; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#84](#screen-84), [#86](#screen-86). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and must be the owner of the coupon. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-97, BR-98, BR-100, BR-102, BR-178 **MSG:** MSG01, MSG29, MSG114, MSG126, MSG127, MSG143
- **FE evidence:** [FE-14](#fe-14). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-40"></a>

### UC-40 — View Customer Bookings

- **Source:** §2.2.2 UC-40; **§3.8.4.1 View Customer Bookings**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Presents the bookings placed on the tour packages owned by the signed-in Tour Operator, so that the operator can prepare the departures and handle the customer requests. **Trigger:** The function is triggered when a Tour Operator opens the Customer Bookings screen or applies a filter on it.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.4.1 Interface: Customer Bookings screen on the Flutter mobile application and on the Next.js responsive web application; §2.2.2 UC-40; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#87](#screen-87), [#88](#screen-88). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and an approved application. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-52, BR-77, BR-105 **MSG:** MSG29, MSG126, MSG127, MSG128
- **FE evidence:** [FE-15](#fe-15). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-41"></a>

### UC-41 — Cancel Tour Booking

- **Source:** §2.2.2 UC-41; **§3.8.4.2 Cancel Tour Booking**.
- **Primary actor:** Traveler / Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator, Traveler. **Catalog actors:** Traveler / Tour Operator.
- **Purpose:** Allows a Traveler to cancel an eligible booking they own, or a Tour Operator to cancel an eligible booking on one of the operator’s tour packages. The function records the cancellation, releases capacity, invalidates unused QR e-tickets, records an audit trail, and creates a Pending refund request when applicable. The refund is then paid under UC-67 after the Tour Operator has confirmed the refund and returned its share under UC-42 (BR-143). **Trigger:** The function is triggered when a Traveler selects Cancel Booking for a booking they own from My Bookings or Booking Detail, or when a Tour Operator selects Cancel Booking for a booking placed on a tour package owned by that Tour Operator from Customer Bookings.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Traveler + owning Tour Operator (Operator WEB_ONLY). **Mobile:** Traveler only. **Admin Web:** No cancellation right. **Basis:** §3.8.4.2 Interface: Traveler: My Bookings or Booking Detail → Cancel Booking → Cancel Confirmation. Tour Operator (Next.js responsive web application only): Customer Bookings → Cancel Booking → Cancel Confirmation. A Tour Operator cannot access or cancel a booking belonging to another operator’s tour.; §2.2.2 UC-41; §1 / §2.1 actor workspace restrictions. Traveler shared; Tour Operator WEB_ONLY explicitly in catalog and §3.8.4.2.
- **Screens:** [#73](#screen-73), [#89](#screen-89). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active Traveler or Tour Operator account. A Traveler must own the booking; a Tour Operator must own the related tour package. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-66, BR-76, BR-86, BR-105, BR-106, BR-107, BR-135, BR-136, BR-137, BR-138, BR-143, BR-155, BR-164 **MSG:** MSG82, MSG126, MSG127, MSG131, MSG132, MSG133, MSG134, MSG135, MSG136, MSG170
- **FE evidence:** [FE-16](#fe-16). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-42"></a>

### UC-42 — Confirm Booking Refund

- **Source:** §2.2.2 UC-42; **§3.8.4.3 Confirm Booking Refund**.
- **Primary actor:** Tour Operator. **Supporting/context:** Staff (records returned share receipt after bank reconciliation); System. **Catalog actors:** Tour Operator / Staff.
- **Purpose:** Allows the Tour Operator to confirm a refund and to return its share of that refund to TripMate, so that TripMate can refund the Traveler under UC-67. **Trigger:** The function is triggered when a Tour Operator opens a refund confirmation request for a booking in Pending Operator Confirmation status. The request is created when: 1. a booking has been cancelled under UC-41 with a refund amount greater than zero (BR-143); or 2. a post-trip complaint has been accepted under UC-69 or UC-75 (BR-143); or 3. a departure has been cancelled under UC-66 and a settlement of the booking has already been transferred. The Traveler has already been refunded (BR-186), so the request starts in Awaiting Partner Return, steps 3 and 4 are skipped, and step 8 does not trigger UC-67 again.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Owning Operator confirmation / bank-return reporting. **Mobile:** Operator confirmation as specified. **Admin Web:** Staff bank reconciliation only (#100). **Basis:** §3.8.4.3 Interface: Confirm Booking Refund screen (screen 90) in the Tour Operator workspace on the Flutter mobile application and on the Next.js web application; Refund Return Reconciliation screen (screen 100) in the web administration workspace for Staff.; §2.2.2 UC-42; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#90](#screen-90), [#100](#screen-100). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: Active Tour Operator account that owns the tour of the booking; Active Staff account for recording the receipt. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-130, BR-139, BR-143, BR-144, BR-158, BR-168, BR-175, BR-186, BR-187, BR-188, BR-189 **MSG:** MSG126, MSG127, MSG136, MSG171, MSG172, MSG173, MSG197, MSG198
- **FE evidence:** [FE-17](#fe-17). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** Screen #90 describes only already-transferred settlements; detailed §3.8.4.3 also handles zero returned share when no settlement transferred. Staff reconciliation #100 is distinct. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-43"></a>

### UC-43 — Check In Traveler by QR Code

- **Source:** §2.2.2 UC-43; **§3.8.4.4 Check In Traveler by QR Code**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Verifies the QR e-ticket of a booking and records the check-in of its participants, so that only the valid and not yet used tickets are accepted at the departure. **Trigger:** The function is triggered when a Tour Operator scans the QR e-ticket presented by a Traveler on the departure date of an owned tour.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.8.4.4 Interface: Check-in screen with the QR scanner provided on the Flutter mobile application only, because it requires the device camera at the meeting point.; §2.2.2 UC-43; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#91](#screen-91). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and must own the tour package of the departure. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-82, BR-83, BR-84, BR-85, BR-86, BR-108 **MSG:** MSG46, MSG74, MSG94, MSG95, MSG96, MSG97, MSG98, MSG99, MSG126, MSG127
- **FE evidence:** [FE-18](#fe-18). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-44"></a>

### UC-44 — View Revenue Report

- **Source:** §2.2.2 UC-44; **§3.8.5.1 View Revenue Report**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Presents the revenue earned by the signed-in Tour Operator over a selected period, broken down by the tour package and by the period, together with the commission and the net amount. **Trigger:** The function is triggered when a Tour Operator opens the Revenue Report screen or applies a filter on it.
- **Platform:** `CONFLICT_REQUIRES_APPROVAL`. **Web:** Next.js interface described. **Mobile:** Conflicting ownership; Owner decision required. **Admin Web:** No. **Basis:** §3.8.5.1 Interface: Revenue Report screen on the Next.js responsive web application; §2.2.2 UC-44; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#92](#screen-92). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and an approved application. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-105, BR-109, BR-140, BR-173 **MSG:** MSG29, MSG115, MSG126, MSG127, MSG128
- **FE evidence:** [FE-19](#fe-19). **Implementation:** `AMBIGUOUS_REQUIREMENT`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-06: §1 / §2.1 broad shared Tour Operator ownership versus 09/11 change record web-only decision; detailed interface names only Next.js. Written decision evidence pending. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-45"></a>

### UC-45 — Export Revenue Report

- **Source:** §2.2.2 UC-45; **§3.8.5.2 Export Revenue Report**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Produces a downloadable file of the revenue report that reflects exactly the filters applied on the screen, for the accounting and the reconciliation of the Tour Operator. **Trigger:** The function is triggered when a Tour Operator selects [Export Report] on the Revenue Report screen.
- **Platform:** `CONFLICT_REQUIRES_APPROVAL`. **Web:** Next.js interface described. **Mobile:** Conflicting ownership; Owner decision required. **Admin Web:** No. **Basis:** §3.8.5.2 Interface: Export Report dialog on the Next.js responsive web application; §2.2.2 UC-45; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#93](#screen-93). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Export action/dialog.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Tour Operator role and an approved application. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-105, BR-109, BR-110 **MSG:** MSG01, MSG106, MSG116, MSG117, MSG128
- **FE evidence:** [FE-19](#fe-19). **Implementation:** `AMBIGUOUS_REQUIREMENT`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-06: §1 / §2.1 broad shared Tour Operator ownership versus 09/11 change record web-only decision; detailed interface names only Next.js. Written decision evidence pending. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-46"></a>

### UC-46 — View User Accounts

- **Source:** §2.2.2 UC-46; **§3.9.1.1 View User Accounts**.
- **Primary actor:** Staff/ Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff or Administrator role. **Catalog actors:** Staff/ Administrator.
- **Purpose:** Presents the accounts registered on the platform with their role and their status, so that Staff or Administrator can review them and take the moderation actions. **Trigger:** The function is triggered when a Staff member or an Administrator opens the User Account Management screen or applies a filter on it.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.1.1 Interface: User Account Management screen on the Next.js web administration application; §2.2.2 UC-46; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#6](#screen-6), [#7](#screen-7). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff or Administrator role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-03, BR-52, BR-115, BR-168, BR-182 **MSG:** MSG29, MSG126, MSG127, MSG128
- **FE evidence:** [FE-20](#fe-20). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** Screen #6 lists Traveler and Tour Operator accounts for Staff. BR-168 also includes Service Provider accounts. See [GAP-07](#gap-07). **Approval:** `PENDING_APPROVAL` for the conflicting target scope.

<a id="uc-47"></a>

### UC-47 — Lock User Account

- **Source:** §2.2.2 UC-47; **§3.9.1.2 Lock User Account**.
- **Primary actor:** Staff/ Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff (Traveler and Tour Operator accounts only); Administrator (Staff accounts only), as set out in BR-168. **Catalog actors:** Staff/ Administrator.
- **Purpose:** Allows a Staff or Administrator account to lock, within the scope of BR-168, an account that violates the platform policy, which prevents any further sign in and terminates the active sessions of that account. **Trigger:** The function is triggered when a Staff member or an Administrator selects [Lock Account] on an account in the User Account Management screen.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.1.2 Interface: Lock Account dialog on the Next.js web administration application; §2.2.2 UC-47; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#7](#screen-7), [#8](#screen-8). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff or Administrator role. BR-168: A Staff account may view, lock and unlock Traveler, Tour Operator and Service Provider accounts only. An Administrator account may view, lock and unlock Staff accounts only. Locking changes only the access status, not the role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-168, BR-169, BR-175, BR-176, BR-189 **MSG:** MSG123, MSG126, MSG127, MSG133, MSG189
- **FE evidence:** [FE-20](#fe-20). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** The §3.9.1.2 actor line limits Staff to Traveler and Tour Operator accounts. BR-168 also includes Service Provider accounts. See [GAP-07](#gap-07). **Approval:** `PENDING_APPROVAL` for the conflicting target scope.

<a id="uc-48"></a>

### UC-48 — Unlock User Account

- **Source:** §2.2.2 UC-48; **§3.9.1.3 Unlock User Account**.
- **Primary actor:** Staff/ Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff (Traveler and Tour Operator accounts only); Administrator (Staff accounts only), as set out in BR-168. **Catalog actors:** Staff/ Administrator.
- **Purpose:** Allows Staff or Administrator to restore the access of a locked account after the reason of the lock has been resolved. **Trigger:** The function is triggered when an Administrator selects [Unlock Account] on a locked account.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.1.3 Interface: Unlock Account dialog on the Next.js web administration application; §2.2.2 UC-48; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#7](#screen-7), [#9](#screen-9). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff or Administrator role. BR-168: A Staff account may view, lock and unlock Traveler, Tour Operator and Service Provider accounts only. An Administrator account may view, lock and unlock Staff accounts only. Locking changes only the access status, not the role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-168, BR-170, BR-171, BR-176, BR-189, BR-200 **MSG:** MSG123, MSG126, MSG127, MSG133, MSG190, MSG199
- **FE evidence:** [FE-20](#fe-20). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** The §3.9.1.3 trigger names Administrator and the actor line also includes Staff. Its actor line excludes Service Provider targets, while BR-168 includes them and BR-200 describes unlocking after overdue statements are paid. See [GAP-07](#gap-07). **Approval:** `PENDING_APPROVAL` for the conflicting target scope.

<a id="uc-49"></a>

### UC-49 — Approve Tour Operator Application

- **Source:** §2.2.2 UC-49; **§3.9.2.1 Approve Tour Operator Application**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Grants the Tour Operator role to an applicant whose business documents have been verified, which opens the operator workspace for that account. **Trigger:** The function is triggered when a Staff selects [Approve] on a Tour Operator application whose status is Pending Approval.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.2.1 Interface: Tour Operator Application Review screen on the Next.js web administration application; §2.2.2 UC-49; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#10](#screen-10), [#11](#screen-11). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-07, BR-08, BR-115, BR-118, BR-130 **MSG:** MSG22, MSG26, MSG124, MSG126, MSG127, MSG133
- **FE evidence:** [FE-21](#fe-21). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-50"></a>

### UC-50 — Reject Tour Operator Application

- **Source:** §2.2.2 UC-50; **§3.9.2.2 Reject Tour Operator Application**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Rejects a Tour Operator application with a reason that is communicated to the applicant, so that the applicant may correct the submission and resubmit it. **Trigger:** The function is triggered when a Staff member selects [Reject] on a Tour Operator application whose status is Pending Approval.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.2.2 Interface: Tour Operator Application Review screen on the Next.js web administration application; §2.2.2 UC-50; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#10](#screen-10), [#11](#screen-11), [#12](#screen-12). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-09, BR-115, BR-118, BR-119, BR-130 **MSG:** MSG123, MSG126, MSG127, MSG133, MSG188
- **FE evidence:** [FE-21](#fe-21). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-51"></a>

### UC-51 — Create POI

- **Source:** §2.2.2 UC-51; **§3.9.3.1 Create Point of Interest**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff member to add a point of interest to the master data, so that it becomes available to the itinerary planning, to the exploration and, for the commercial categories, to the service booking. **Trigger:** The function is triggered when a Staff member selects [Create Point of Interest] in the Point of Interest Management screen.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.3.1 Interface: Create Point of Interest screen on the Next.js web administration application; §2.2.2 UC-51; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#16](#screen-16), [#17](#screen-17). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-24, BR-87, BR-115, BR-120, BR-130 **MSG:** MSG01, MSG19, MSG126, MSG127, MSG138, MSG143, MSG191
- **FE evidence:** [FE-22](#fe-22). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-52"></a>

### UC-52 — Update POI

- **Source:** §2.2.2 UC-52; **§3.9.3.2 Update Point of Interest**.
- **Primary actor:** Staff/ Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator/ Staff. **Catalog actors:** Staff/ Administrator.
- **Purpose:** Allows an Administrator or a Staff to correct or to enrich the master data of a point of interest, including its coordinates, its opening hours and its commercial information. **Trigger:** The function is triggered when an Administrator or a Staff opens an existing point of interest for editing and saves a change.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.3.2 Interface: Update Point of Interest screen on the Next.js web administration application; §2.2.2 UC-52; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#16](#screen-16), [#18](#screen-18). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Administrator or Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-87, BR-115, BR-120, BR-121, BR-130 **MSG:** MSG01, MSG126, MSG127, MSG143, MSG192, MSG194
- **FE evidence:** [FE-23](#fe-23). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-53"></a>

### UC-53 — Remove POI

- **Source:** §2.2.2 UC-53; **§3.9.3.3 Remove Point of Interest**.
- **Primary actor:** Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator. **Catalog actors:** Administrator.
- **Purpose:** Withdraws a point of interest from new use on the platform by setting it to the status Inactive, so that the existing itineraries, routes, bookings and the audit trail remain consistent. **Trigger:** The function is triggered when an Administrator selects the removal action on a point of interest in the Point of Interest Management screen.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.3.3 Interface: Remove Point of Interest dialog on the Next.js web administration application; §2.2.2 UC-53; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#16](#screen-16), [#19](#screen-19). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Administrator role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-24, BR-115, BR-121, BR-122, BR-130 **MSG:** MSG123, MSG126, MSG127, MSG193, MSG194
- **FE evidence:** [FE-23](#fe-23). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-54"></a>

### UC-54 — Create Route

- **Source:** §2.2.2 UC-54; **§3.9.4.1 Create Route**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff to define a route between two points of interest with its distance, its estimated travel time and its transport mode, so that the itinerary planning can use it. **Trigger:** The function is triggered when a Staff selects [Create Route] in the Route Management screen.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.4.1 Interface: Create Route screen on the Next.js web administration application; §2.2.2 UC-54; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#20](#screen-20), [#21](#screen-21). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-24, BR-35, BR-115, BR-122, BR-130 **MSG:** MSG01, MSG126, MSG127, MSG139, MSG141, MSG143
- **FE evidence:** [FE-24](#fe-24). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-55"></a>

### UC-55 — Update Route

- **Source:** §2.2.2 UC-55; **§3.9.4.2 Update Route**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff to correct the attributes of a route or to deactivate a route that is no longer usable, including a route flagged for the review because one of its endpoints has been deactivated. **Trigger:** The function is triggered when a Staff opens an existing route for editing and saves a change, or deactivates it.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.4.2 Interface: Update Route screen on the Next.js web administration application; §2.2.2 UC-55; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#20](#screen-20), [#22](#screen-22). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-24, BR-27, BR-115, BR-122, BR-130 **MSG:** MSG01, MSG126, MSG127, MSG140, MSG141, MSG143
- **FE evidence:** [FE-24](#fe-24). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-56"></a>

### UC-56 — Configure Algorithm Parameters

- **Source:** §2.2.2 UC-56; **§3.9.5 Configure Algorithm Parameters**.
- **Primary actor:** Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator. **Catalog actors:** Administrator.
- **Purpose:** Allows an Administrator to tune the parameters of the itinerary scheduling algorithm and of the tour matching algorithm within the allowed ranges, without a deployment. **Trigger:** The function is triggered when an Administrator saves a change on the Algorithm Parameter Configuration screen.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.5 Interface: Algorithm Parameter Configuration screen on the Next.js web administration application; §2.2.2 UC-56; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#23](#screen-23). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Administrator role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-26, BR-58, BR-115, BR-123, BR-130 **MSG:** MSG01, MSG126, MSG127, MSG142, MSG143
- **FE evidence:** [FE-25](#fe-25). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-57"></a>

### UC-57 — View Active Trips

- **Source:** §2.2.2 UC-57; **§3.9.6.1 View Active Trips**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff member to monitor ongoing trips across the platform, tracking active trip sessions, current traveler locations, and real-time FSM states. **Trigger:** The function is triggered when a Staff member opens the Active Trips Monitor screen from the web administration workspace.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.6.1 Interface: Active Trips Monitor screen on the Next.js responsive web application, displaying a list or map of active trips with summary operational indicators.; §2.2.2 UC-57; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#24](#screen-24). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-32, BR-51, BR-52, BR-115, BR-124 **MSG:** MSG126, MSG127, MSG128
- **FE evidence:** [FE-26](#fe-26). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-58"></a>

### UC-58 — View Active Trip Details

- **Source:** §2.2.2 UC-58; **§3.9.6.2 View Active Trip Details**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff to inspect the progress, the itinerary and the raised alerts of one trip that is in progress, so that a support decision can be taken with the complete context. **Trigger:** The function is triggered when a Staff selects a trip from the Active Trip Monitoring list.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.6.2 Interface: Active Trip Details screen on the Next.js web administration application; §2.2.2 UC-58; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#25](#screen-25). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-26, BR-32, BR-50, BR-51, BR-115, BR-124, BR-130 **MSG:** MSG32, MSG116, MSG117, MSG126, MSG127, MSG128
- **FE evidence:** [FE-26](#fe-26). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-59"></a>

### UC-59 — Approve Tour Post

- **Source:** §2.2.2 UC-59; **§3.9.7.1 Approve Tour Post**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff to publish a tour package submitted by a Tour Operator after the mandatory review checklist has been verified, so that only reviewed tours become discoverable by Travelers. **Trigger:** The function is triggered when a Staff confirms the approval of a tour package that is in the Pending Approval status.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.7.1 Interface: Tour Post Moderation screen and Tour Package Review screen on the Next.js web administration application; §2.2.2 UC-59; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#13](#screen-13), [#14](#screen-14). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-56, BR-103, BR-104, BR-115, BR-118, BR-125, BR-130 **MSG:** MSG01, MSG126, MSG127, MSG128, MSG133, MSG144
- **FE evidence:** [FE-27](#fe-27). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-60"></a>

### UC-60 — Reject Tour Post

- **Source:** §2.2.2 UC-60; **§3.9.7.2 Reject Tour Post**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff to reject a submitted tour package that does not pass the review, with a reason that the owning Tour Operator can act upon. **Trigger:** The function is triggered when a Staff confirms the rejection of a tour package that is in the Pending Approval status.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.7.2 Interface: Tour Package Review screen on the Next.js web administration application; §2.2.2 UC-60; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#13](#screen-13), [#14](#screen-14), [#15](#screen-15). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-56, BR-104, BR-115, BR-118, BR-119, BR-130 **MSG:** MSG123, MSG126, MSG127, MSG133, MSG195
- **FE evidence:** [FE-27](#fe-27). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-61"></a>

### UC-61 — View Platform Bookings

- **Source:** §2.2.2 UC-61; **§3.9.8 View Platform Bookings**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff to monitor every booking created on the platform across all Tour Operators, so that a payment anomaly, a refund backlog or an abusive booking pattern can be detected. **Trigger:** The function is triggered when a Staff opens the Platform Booking Monitoring screen in the web administration application.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.8 Interface: Platform Booking Monitoring screen on the Next.js web administration application; §2.2.2 UC-61; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#26](#screen-26), [#27](#screen-27). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-52, BR-71, BR-77, BR-79, BR-115, BR-126, BR-130 **MSG:** MSG29, MSG126, MSG127, MSG128
- **FE evidence:** [FE-28](#fe-28). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-62"></a>

### UC-62 — Update Landing Page Content

- **Source:** §2.2.2 UC-62; **§3.9.10 Update Landing Page Content**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows an Staff to maintain the content of the public landing page of the web application, including the featured destinations and the promotional banners, without a deployment. **Trigger:** The function is triggered when a Staff publishes a change of the public landing page content.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.10 Interface: Landing Page Content Management screen on the Next.js web administration application; §2.2.2 UC-62; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#1](#screen-1), [#30](#screen-30). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-16, BR-27, BR-56, BR-115, BR-128, BR-130 **MSG:** MSG01, MSG19, MSG29, MSG65, MSG126, MSG127, MSG129, MSG148
- **FE evidence:** [FE-29](#fe-29). **Implementation:** `MISMATCH`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-63"></a>

### UC-63 — Export Statistical Reports

- **Source:** §2.2.2 UC-63; **§3.9.11 Export Statistical Reports**.
- **Primary actor:** Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator. **Catalog actors:** Administrator.
- **Purpose:** Allows an Administrator to generate and download the aggregated platform statistics of a closed period, so that the business performance can be reported outside the application. **Trigger:** The function is triggered when an Administrator requests the export of a platform statistical report.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.11 Interface: Platform Statistics screen on the Next.js web administration application; §2.2.2 UC-63; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#31](#screen-31), [#36](#screen-36), [#37](#screen-37). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Export action/dialog.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Administrator role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-79, BR-109, BR-110, BR-115, BR-129, BR-130 **MSG:** MSG01, MSG117, MSG126, MSG127, MSG128, MSG149, MSG184
- **FE evidence:** [FE-30](#fe-30). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-64"></a>

### UC-64 — View Audit Logs

- **Source:** §2.2.2 UC-64; **§3.9.12.1 View Audit Logs**.
- **Primary actor:** Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator. **Catalog actors:** Administrator.
- **Purpose:** Allows an Administrator to search the recorded administrative and financial events of the platform, so that an action can be traced back to the account that performed it. **Trigger:** The function is triggered when an Administrator opens the Audit Log screen in the web administration application.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.12.1 Interface: Audit Log screen on the Next.js web administration application; §2.2.2 UC-64; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#32](#screen-32). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Administrator role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-03, BR-52, BR-110, BR-115, BR-130 **MSG:** MSG29, MSG116, MSG117, MSG126, MSG127, MSG128
- **FE evidence:** [FE-31](#fe-31). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-65"></a>

### UC-65 — View Audit Log Details

- **Source:** §2.2.2 UC-65; **§3.9.12.2 View Audit Log Details**.
- **Primary actor:** Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator. **Catalog actors:** Administrator.
- **Purpose:** Allows an Administrator to inspect the complete recorded content of one audit log entry, including the previous and the new values of the affected entity. **Trigger:** The function is triggered when an Administrator selects an entry from the Audit Log list.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.12.2 Interface: Audit Log Details screen on the Next.js web administration application; §2.2.2 UC-65; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#33](#screen-33). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Administrator role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-03, BR-115, BR-130, BR-190 **MSG:** MSG126, MSG127, MSG128, MSG150
- **FE evidence:** [FE-31](#fe-31). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-66"></a>

### UC-66 — Handle Weather Warning and Operator Cancellation

- **Source:** §2.2.2 UC-66; **§3.10.1 Handle Weather Warning and Operator Cancellation**.
- **Primary actor:** System. **Supporting/context:** Tour Operator (cancellation decision); Traveler (recipient); external Weather Service. **Catalog actors:** System / Tour Operator / Traveler.
- **Purpose:** Warns the responsible Tour Operator and the affected Travelers about the weather event, and handles the Tour Operator’s decision to continue or cancel the departure. TripMate never cancels a departure automatically. **Trigger:** The function is triggered automatically by the system when incoming weather data meets the configured thresholds for a tour.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.10.1 Interface: Weather Warning and Cancellation screen in the operator workspace on the Flutter mobile application and on the Next.js responsive web application; Booking Detail screen and notification centre on the Flutter mobile application and on the Next.js web application for the affected Traveler.; §2.2.2 UC-66; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#98](#screen-98). System result/observation surfaces only; not a standalone screen grant. **Interaction:** System event/background processing; embedded result surfaces.
- **Authorization:** Credentials required: The declaring user must be signed in as the Tour Operator that owns the departure; the notified Traveler must be signed in to read the affected booking. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-136, BR-143, BR-144, BR-186, BR-187, BR-189 **MSG:** MSG123, MSG126, MSG127, MSG133, MSG151, MSG153, MSG185
- **FE evidence:** [FE-32](#fe-32). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-06: system weather warning initiates the UC, Operator alone decides cancellation; no automated cancellation/Admin override. Immediate weather refund BR-186 has pending approval evidence in change log. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-67"></a>

### UC-67 — Process Refund to Traveler

- **Source:** §2.2.2 UC-67; **§3.10.2 Process Refund to Traveler**.
- **Primary actor:** System. **Supporting/context:** Payment Gateway; Traveler (recipient); Administrator (exhausted-retry escalation). **Catalog actors:** System.
- **Purpose:** Refunds the Traveler through the original payment channel and records the refund result. **Trigger:** The function is triggered automatically by the system in one of two cases: 1. UC-42 has completed and the full returned share has been received (BR-143); or 2. the Tour Operator return share of a refund confirmed under UC-42 is zero because no settlement has been transferred yet (BR-139); or 3. a departure was cancelled by the Tour Operator under UC-66, whatever the settlement state (BR-186); or 4. a verified payment was received after the payment window of the booking had expired (BR-159).
- **Platform:** `NON_SCREEN`. **Web:** Observable results only; no user execution route. **Mobile:** Observable results where specified. **Admin Web:** Results only for assigned internal roles. **Basis:** §3.10.2 Interface: Refund progress area of the Booking Detail screen and notification centre on the Flutter mobile application and on the Next.js web application; refund monitoring area of the web administration application for the escalated items.; §2.2.2 UC-67; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#99](#screen-99), [#101](#screen-101). System result/observation surfaces only; not a standalone screen grant. **Interaction:** System event/background processing; embedded result surfaces.
- **Authorization:** Credentials required: The function is executed by the system and requires no user credential; the Traveler must be signed in to read the refund progress of the own booking and the escalated items are visible to the Administrator role only. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-74, BR-76, BR-77, BR-78, BR-134, BR-139, BR-143, BR-158, BR-159, BR-161, BR-186 **MSG:** MSG89, MSG90, MSG91, MSG136, MSG137, MSG152, MSG153, MSG174
- **FE evidence:** [FE-33](#fe-33). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-68"></a>

### UC-68 — Submit Post-Trip Complaint

- **Source:** §2.2.2 UC-68; **§3.8.6.1 Submit Post-Trip Complaint**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows the Traveler to submit a complaint about a booking, with supporting evidence. **Trigger:** The function is triggered when a Traveler selects [Submit Complaint] on the booking detail of a tour booking whose tour has ended.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.6.1 Interface: Complaint Form in the Next.js responsive web application and in the Flutter mobile application; §2.2.2 UC-68; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#95](#screen-95). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.8.6.1; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-147, BR-148, BR-149, BR-151 **MSG:** MSG127, MSG157, MSG158, MSG159, MSG160, MSG161
- **FE evidence:** [FE-34](#fe-34). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-69"></a>

### UC-69 — Respond to Post-Trip Complaint

- **Source:** §2.2.2 UC-69; **§3.8.6.2 Respond to Post-Trip Complaint**.
- **Primary actor:** Tour Operator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Tour Operator. **Catalog actors:** Tour Operator.
- **Purpose:** Allows the Tour Operator to respond to a complaint on one of its tours. **Trigger:** The function is triggered when a Tour Operator opens a complaint with the status Awaiting Operator Response.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.6.2 Interface: Complaint Response screen in the Tour Operator console.; §2.2.2 UC-69; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#96](#screen-96). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.8.6.2; Tour Operator. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-143, BR-150, BR-151, BR-152 **MSG:** MSG126, MSG127, MSG162, MSG163, MSG164, MSG165
- **FE evidence:** [FE-34](#fe-34). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-70"></a>

### UC-70 — Synchronize Offline Trip Data

- **Source:** §2.2.2 UC-70; **§3.10.3 Synchronize Offline Trip Data**.
- **Primary actor:** System. **Supporting/context:** Traveler (device owner); backend sync service. **Catalog actors:** Traveler.
- **Purpose:** Uploads the trip data captured offline, namely the activity completion states, the visited points of interest, the recorded notes and the captured photographs, and resolves every conflict against the server record so that the trip history remains consistent. **Trigger:** The function is triggered when the mobile application regains network connectivity and detects local trip data that was captured while the device was offline.
- **Platform:** `MOBILE_ONLY`. **Web:** No Web equivalent. **Mobile:** Required Android capability. **Admin Web:** No equivalent execution action. **Basis:** §3.10.3 Interface: Synchronisation banner and Synchronisation Result screen on the Flutter mobile application; §2.2.2 UC-70; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#52](#screen-52). System result/observation surfaces only; not a standalone screen grant. **Interaction:** System event/background processing; embedded result surfaces.
- **Authorization:** Credentials required: The Traveler must be signed in on the device with a valid session; an expired session is refreshed before the upload and the local data is retained until the refresh succeeds. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-26, BR-37, BR-38, BR-39, BR-40, BR-165, BR-166 **MSG:** MSG32, MSG106, MSG127, MSG128, MSG154, MSG155, MSG156
- **FE evidence:** [FE-33](#fe-33). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-71"></a>

### UC-71 — Schedule Payout Settlement

- **Source:** §2.2.2 UC-71; **§3.10.4 Schedule Payout Settlement**.
- **Primary actor:** System. **Supporting/context:** Tour Operator / Staff / Administrator (settlement observers). **Catalog actors:** System.
- **Purpose:** Creates the advance settlement (70%) and the final settlement (20%) of each eligible booking in the daily run. **Trigger:** The function is triggered automatically by the system once a day at 10:00 (BR-141).
- **Platform:** `NON_SCREEN`. **Web:** Observable results only; no user execution route. **Mobile:** Observable results where specified. **Admin Web:** Results only for assigned internal roles. **Basis:** §3.10.4 Interface: No user interface; the result is visible in the Settlement Records List (screen 28) and in the Tour Operator’s Payout Settlement History (screen 94).; §2.2.2 UC-71; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#28](#screen-28), [#94](#screen-94). System result/observation surfaces only; not a standalone screen grant. **Interaction:** System event/background processing; embedded result surfaces.
- **Authorization:** Role and data restrictions in 3.10.4; System. System processing has no independent human page grant. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-139, BR-140, BR-141, BR-142, BR-144, BR-146, BR-177, BR-188 **MSG:** None explicitly listed at this traceability level; see linked UC rules.
- **FE evidence:** [FE-33](#fe-33). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-03: #94 is Tour Operator settlement history observable output; UC-72 only covers Staff/Administrator #28. No standalone Tour Operator history UC is explicitly assigned. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-72"></a>

### UC-72 — View Payout Records

- **Source:** §2.2.2 UC-72; **§3.9.9.1 View Payout Records**.
- **Primary actor:** Staff/ Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff; Administrator. **Catalog actors:** Staff/ Administrator.
- **Purpose:** Displays each booking’s settlement with its scheduled transfer time, amount, status and transfer reference. Read-only. **Trigger:** The function is triggered when a Staff member or an Administrator opens the Settlement Records List or applies a filter on it.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.9.1 Interface: Settlement Records List on the Next.js web administration application; §2.2.2 UC-72; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#28](#screen-28). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Credentials required: The user must be signed in with an Active account holding the Staff role or the Administrator role. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-52, BR-79, BR-115, BR-146 **MSG:** MSG126, MSG127, MSG128
- **FE evidence:** [FE-35](#fe-35). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-03: Staff/Administrator read-only #28; does not authorize Tour Operator #94 access or failed-settlement actions. **Approval:** `NOT_EVIDENCED`. Owner gates in §H remain unresolved.

<a id="uc-73"></a>

### UC-73 — Review Failed Payout Settlement

- **Source:** §2.2.2 UC-73; **§3.10.6 Review Failed Payout Settlement**.
- **Primary actor:** Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator. **Catalog actors:** Administrator.
- **Purpose:** Allows the Administrator to review a failed settlement and decide how to handle it. The amount is not recalculated. **Trigger:** The function is triggered when an Administrator opens a settlement in SettlementFailed status.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.10.6 Interface: Failed Payout Settlement Details (screen 29) on the Next.js web administration application; §2.2.2 UC-73; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#29](#screen-29). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.10.6; Administrator. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-145, BR-146, BR-172 **MSG:** MSG126, MSG176, MSG177, MSG178
- **FE evidence:** [FE-36](#fe-36). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-74"></a>

### UC-74 — Process Payout Settlement

- **Source:** §2.2.2 UC-74; **§3.10.5 Process Payout Settlement**.
- **Primary actor:** System. **Supporting/context:** Banking gateway; Tour Operator (recipient); Administrator (failure escalation). **Catalog actors:** System.
- **Purpose:** Transfers the scheduled amount to the Tour Operator and records the result. **Trigger:** The function is triggered automatically by the system at 10:00 each day, for the settlements created by UC-71 in the same run.
- **Platform:** `NON_SCREEN`. **Web:** Observable results only; no user execution route. **Mobile:** Observable results where specified. **Admin Web:** Results only for assigned internal roles. **Basis:** §3.10.5 Interface: No user interface; results appear in screens 28, 29 and 94 and in notifications.; §2.2.2 UC-74; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#28](#screen-28), [#29](#screen-29), [#94](#screen-94). System result/observation surfaces only; not a standalone screen grant. **Interaction:** System event/background processing; embedded result surfaces.
- **Authorization:** Role and data restrictions in 3.10.5; System; banking gateway that executes the bank transfer to the Tour Operator (external system). System processing has no independent human page grant. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-145, BR-146, BR-160, BR-172 **MSG:** MSG145, MSG146, MSG175, MSG176
- **FE evidence:** [FE-33](#fe-33). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-03: results visible in #28/#29/#94; processing remains System-initiated. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-75"></a>

### UC-75 — Respond to Partial Refund Proposal

- **Source:** §2.2.2 UC-75; **§3.8.6.3 Respond to Partial Refund Proposal**.
- **Primary actor:** Traveler. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Traveler. **Catalog actors:** Traveler.
- **Purpose:** Allows the Traveler to accept or decline a partial refund proposal. **Trigger:** The function is triggered when a Traveler opens a complaint with the status Awaiting Traveler Response.
- **Platform:** `WEB_AND_MOBILE`. **Web:** Shared public/authenticated role capability. **Mobile:** Shared Android capability. **Admin Web:** No, except explicitly assigned internal variants. **Basis:** §3.8.6.3 Interface: Partial Refund Proposal screen in the web application and in the mobile application; §2.2.2 UC-75; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#97](#screen-97). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.8.6.3; Traveler. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-143, BR-153 **MSG:** MSG126, MSG127, MSG165
- **FE evidence:** [FE-34](#fe-34). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** No additional conflict identified in this extraction; approval provenance is not established merely by SRS presence. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-76"></a>

### UC-76 — Create Staff Account

- **Source:** §2.2.2 UC-76; **§3.9.1.4 Create Staff Account**.
- **Primary actor:** Administrator. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Administrator. **Catalog actors:** Administrator.
- **Purpose:** Allows an Administrator to create a Staff account without self-registration. **Trigger:** The function is triggered when an Administrator selects [Create Staff Account] on the User Account Management screen.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.1.4 Interface: Create Staff Account screen (screen 35) on the Next.js web administration application; §2.2.2 UC-76; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#35](#screen-35). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.9.1.4; Administrator. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-03, BR-174, BR-191 **MSG:** MSG01, MSG05, MSG126, MSG127, MSG143, MSG200
- **FE evidence:** [FE-37](#fe-37). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** BR-191 / UC-76 is explicitly listed as an unapproved team proposal in 12/11 change log; screen #35 remains inventoried. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-77"></a>

### UC-77 — Create Service Provider Account

- **Source:** §2.2.2 UC-77; **§3.9.1.5 Create Service Provider Account**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Allows a Staff member to create a Service Provider account without self-registration. **Trigger:** The function is triggered when a Staff member selects [Create Service Provider Account] on the User Account Management screen.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.9.1.5 Interface: Create Service Provider Account screen (screen 102) on the Next.js web administration application; §2.2.2 UC-77; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#102](#screen-102). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.9.1.5; Staff. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-03, BR-174, BR-192 **MSG:** MSG01, MSG05, MSG34, MSG126, MSG127, MSG143, MSG201, MSG202
- **FE evidence:** [FE-37](#fe-37). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** BR-192 account-per-POI and Staff creation is explicitly unapproved in change log; exact cardinality wording requires confirmation. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-78"></a>

### UC-78 — View Service Booking Requests

- **Source:** §2.2.2 UC-78; **§3.6.3 View Service Booking Requests**.
- **Primary actor:** Service Provider. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Service Provider. **Catalog actors:** Service Provider.
- **Purpose:** Allows a Service Provider to follow the booking requests that Travelers submitted for its own services. **Trigger:** The function is triggered when a Service Provider opens the Service Booking Requests screen of the Service Provider workspace.
- **Platform:** `WEB_ONLY`. **Web:** Dedicated Service Provider workspace. **Mobile:** No. **Admin Web:** No. **Basis:** §3.6.3 Interface: Service Booking Requests screen (screen 103) on the Next.js web application only.; §2.2.2 UC-78; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#103](#screen-103), [#104](#screen-104). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** BR-193: A Service Provider may view and respond only to the booking requests of the commercial points of interest linked to its own account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-52, BR-193 **MSG:** MSG126, MSG127, MSG128
- **FE evidence:** [FE-37](#fe-37). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-02: Service Provider screens #103/#104 appear under §3.1.2.2 heading Guest, Traveler and Tour Operator. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-79"></a>

### UC-79 — Respond to Service Booking Request

- **Source:** §2.2.2 UC-79; **§3.6.4 Respond to Service Booking Request**.
- **Primary actor:** Service Provider. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Service Provider. **Catalog actors:** Service Provider.
- **Purpose:** Allows a Service Provider to confirm or reject a booking request of one of its own services. **Trigger:** The function is triggered when a Service Provider opens a request in Pending Confirmation status from the Service Booking Requests screen.
- **Platform:** `WEB_ONLY`. **Web:** Dedicated Service Provider workspace. **Mobile:** No. **Admin Web:** No. **Basis:** §3.6.4 Interface: Service Booking Request Details screen (screen 104) on the Next.js web application only.; §2.2.2 UC-79; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#104](#screen-104). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** BR-193: A Service Provider may view and respond only to the booking requests of the commercial points of interest linked to its own account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-89, BR-193, BR-194, BR-195 **MSG:** MSG72, MSG73, MSG123, MSG126, MSG127, MSG133, MSG203, MSG204
- **FE evidence:** [FE-37](#fe-37). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-02: table-heading mismatch; BR-194 24-hour response period is explicitly unapproved team proposal. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-80"></a>

### UC-80 — Record Service Outcome

- **Source:** §2.2.2 UC-80; **§3.6.5 Record Service Outcome**.
- **Primary actor:** Service Provider. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Service Provider. **Catalog actors:** Service Provider.
- **Purpose:** Records whether the Traveler used the service and the amount actually charged, which is the basis of the service commission. **Trigger:** The function is triggered when a Service Provider opens a Confirmed request whose requested service date has passed.
- **Platform:** `WEB_ONLY`. **Web:** Dedicated Service Provider workspace. **Mobile:** No. **Admin Web:** No. **Basis:** §3.6.5 Interface: Service Booking Request Details screen (screen 104) on the Next.js web application only.; §2.2.2 UC-80; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#104](#screen-104). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** BR-193: A Service Provider may view and respond only to the booking requests of the commercial points of interest linked to its own account. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-193, BR-196, BR-197, BR-198 **MSG:** MSG127, MSG133, MSG143, MSG206
- **FE evidence:** [FE-37](#fe-37). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-02: table-heading mismatch; BR-197 3-day automatic completion and BR-198 10% commission are unapproved team proposals. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-81"></a>

### UC-81 — Generate Commission Statement

- **Source:** §2.2.2 UC-81; **§3.10.7 Generate Commission Statement**.
- **Primary actor:** System. **Supporting/context:** Service Provider / Staff (statement observers). **Catalog actors:** System.
- **Purpose:** Issues the monthly commission statement of each Service Provider and applies the payment deadlines. **Trigger:** The function is triggered automatically by the system on the first day of each month, and daily for the deadline checks.
- **Platform:** `NON_SCREEN`. **Web:** Observable results only; no user execution route. **Mobile:** Observable results where specified. **Admin Web:** Results only for assigned internal roles. **Basis:** §3.10.7 Interface: No user interface; results appear in screens 105 and 106 and in notifications.; §2.2.2 UC-81; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#105](#screen-105), [#106](#screen-106). System result/observation surfaces only; not a standalone screen grant. **Interaction:** System event/background processing; embedded result surfaces.
- **Authorization:** Role and data restrictions in 3.10.7; System. System processing has no independent human page grant. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-197, BR-198, BR-199, BR-200 **MSG:** MSG207, MSG210
- **FE evidence:** [FE-33](#fe-33). **Implementation:** `NOT_VERIFIED`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-04: System generates statements; #105 is Service Provider access/reporting UC-82, #106 Staff receipt UC-83. BR-197 to BR-200 explicitly unapproved team proposals. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-82"></a>

### UC-82 — Pay Commission Statement

- **Source:** §2.2.2 UC-82; **§3.6.6 Pay Commission Statement**.
- **Primary actor:** Service Provider. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Service Provider. **Catalog actors:** Service Provider.
- **Purpose:** Allows a Service Provider to view its monthly commission statements and to report the bank transfer of the commission to TripMate. **Trigger:** The function is triggered when a Service Provider opens the Commission Statements screen.
- **Platform:** `WEB_ONLY`. **Web:** Dedicated Service Provider workspace. **Mobile:** No. **Admin Web:** No. **Basis:** §3.6.6 Interface: Commission Statements screen (screen 105) on the Next.js web application only.; §2.2.2 UC-82; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#105](#screen-105). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Screen/form or list/detail interaction.
- **Authorization:** Role and data restrictions in 3.6.6; Service Provider. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-198, BR-199, BR-200 **MSG:** MSG126, MSG127, MSG133, MSG172, MSG208
- **FE evidence:** [FE-38](#fe-38). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-05: Pay Commission Statement means external bank transfer and reporting reference; status Payment Reported is not Paid. BR-198 to BR-200 unapproved proposals. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

<a id="uc-83"></a>

### UC-83 — Confirm Commission Receipt

- **Source:** §2.2.2 UC-83; **§3.6.7 Confirm Commission Receipt**.
- **Primary actor:** Staff. **Supporting/context:** None explicitly assigned in catalog; detailed Actors / Roles: Staff. **Catalog actors:** Staff.
- **Purpose:** Records that the commission of a statement has been received by TripMate. **Trigger:** The function is triggered when a Staff member opens the Commission Reconciliation screen during bank reconciliation.
- **Platform:** `ADMIN_WEB_ONLY`. **Web:** No public/partner workspace. **Mobile:** No. **Admin Web:** Assigned Staff or Administrator only. **Basis:** §3.6.7 Interface: Commission Reconciliation screen (screen 106) on the Next.js web administration application; §2.2.2 UC-83; §1 / §2.1 actor workspace restrictions.
- **Screens:** [#106](#screen-106). Mapping by named detailed interface and matching screen inventory; adjacent list/detail/dialog surfaces are supporting mappings, not independent UCs. **Interaction:** Confirmation/action within existing screen.
- **Authorization:** Role and data restrictions in 3.6.7; Staff. Table 5 and CR-10/11/15 apply; page access does not grant every action.
- **BR:** BR-174, BR-199, BR-200 **MSG:** MSG126, MSG127, MSG133, MSG209
- **FE evidence:** [FE-38](#fe-38). **Implementation:** `MISSING_IMPLEMENTATION`; backend/Mobile outcomes NOT_VERIFIED.
- **Conflict / notes:** GAP-05: Staff alone records bank-reconciled full receipt in #106; Service Provider report #105 does not confirm funds. BR-199/BR-200 unapproved proposals. **Approval:** `PENDING_APPROVAL`. Owner gates in §H remain unresolved.

## D. Complete screen inventory

Original Screen IDs/names are preserved. UC links are traceability, not permission grants. #1 is published UC-62 output, not Guest editing permission; #94 observes UC-71/74 rather than UC-72. Dashboards without a dedicated UC stay unmapped. BR/MSG references inherit linked detailed sections and are candidate applicability, not proof every message appears on this screen.

<a id="screen-1"></a>

### Screen #1 — TripMate Landing Page

- **Module / description:** Public Website. Public landing page introducing TripMate, presenting supported platform information and providing entry points to relevant TripMate services.
- **Source / platform:** §3.1.2.1, original #1; `WEB_ONLY`. §3.1.2.1 Screen #1; §3.1.3 Table 5 name-based authorization; §3.9.10 UC-62.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-62](#uc-62).
- **BR / MSG trace:** BR-16, BR-27, BR-56, BR-115, BR-128, BR-130 / MSG01, MSG19, MSG29, MSG65, MSG126, MSG127, MSG129, MSG148
- **FE route/page candidates:** `/` ([`app/page.tsx`](../app/page.tsx)) **Main component candidates:** [`src/features/public/landing/LandingPage.tsx`](../src/features/public/landing/LandingPage.tsx)
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above; [FE-29](#fe-29). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Public route app/page.tsx composes LandingPage. UC62 is Staff editing upstream content, not this public screen; its action mismatch must not propagate to public landing status. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-2"></a>

### Screen #2 — Administration Login

- **Module / description:** Authentication. Allows an Administrator or Staff member to authenticate and access the protected TripMate web administration workspace. After successful authentication, the system grants access according to the user’s assigned role and permissions.
- **Source / platform:** §3.1.2.1, original #2; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #2; §3.1.3 Table 5 name-based authorization; §3.2.4 UC-04.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-04](#uc-04).
- **BR / MSG trace:** BR-03, BR-05, BR-07, BR-10, BR-11, BR-12, BR-168, BR-183 / MSG01, MSG02, MSG09, MSG10, MSG11, MSG12, MSG127, MSG182
- **FE route/page candidates:** `/admin/login` ([`app/admin/login/page.tsx`](../app/admin/login/page.tsx)) **Main component candidates:** [`src/features/admin/auth/AdminLoginPage.tsx`](../src/features/admin/auth/AdminLoginPage.tsx), [`src/features/admin/auth/AdminSignInForm.tsx`](../src/features/admin/auth/AdminSignInForm.tsx)
- **Guard / evidence:** [`src/lib/server/adminSession.ts`](../src/lib/server/adminSession.ts) Evidence: Screen-specific paths above; [FE-03](#fe-03). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/admin/auth/AdminSignInForm.test.tsx`](../src/features/admin/auth/AdminSignInForm.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Internal Staff/Administrator sign-in form exists; Provider not granted by this screen, so missing Provider role does not establish this screen mismatch. Session trust and backend access remain NOT_VERIFIED. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-3"></a>

### Screen #3 — Administration Reset Password

- **Module / description:** Authentication. Allows an Administrator or Staff member who cannot access the current password to complete the supported password-reset process.
- **Source / platform:** §3.1.2.1, original #3; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #3; §3.1.3 Table 5 name-based authorization; §3.2.6 UC-06.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-06](#uc-06).
- **BR / MSG trace:** BR-02, BR-03, BR-14, BR-15 / MSG01, MSG02, MSG03, MSG04, MSG14, MSG15, MSG16, MSG127
- **FE route/page candidates:** `/admin/forgot-password` ([`app/admin/forgot-password/page.tsx`](../app/admin/forgot-password/page.tsx)) **Main component candidates:** [`src/features/admin/auth/AdminPasswordRecoveryPage.tsx`](../src/features/admin/auth/AdminPasswordRecoveryPage.tsx), [`src/features/public/auth/PublicPasswordRecoveryPage.tsx`](../src/features/public/auth/PublicPasswordRecoveryPage.tsx)
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above; [FE-03](#fe-03). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/public/auth/PublicPasswordRecoveryPage.test.tsx`](../src/features/public/auth/PublicPasswordRecoveryPage.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Administration recovery wraps shared recovery page; Staff/Admin-only screen. Provider gap applies to aggregate auth UCs, not this screen. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-4"></a>

### Screen #4 — Administration Change Password

- **Module / description:** Account Security. Allows an authenticated Administrator or Staff member to change the current account password after required credential validation.
- **Source / platform:** §3.1.2.1, original #4; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #4; §3.1.3 Table 5 name-based authorization; §3.2.7 UC-07.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-07](#uc-07).
- **BR / MSG trace:** BR-02, BR-03, BR-15 / MSG01, MSG03, MSG04, MSG17, MSG18, MSG127, MSG181
- **FE route/page candidates:** `/admin/account/security` ([`app/admin/(console)/account/security/page.tsx`](../app/admin/%28console%29/account/security/page.tsx)) **Main component candidates:** [`src/features/admin/account/AdminChangePasswordView.tsx`](../src/features/admin/account/AdminChangePasswordView.tsx), [`src/features/admin/account/changePasswordProxy.ts`](../src/features/admin/account/changePasswordProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/account/security/page.tsx`](../app/admin/%28console%29/account/security/page.tsx), [`src/lib/server/adminSession.ts`](../src/lib/server/adminSession.ts) Evidence: Screen-specific paths above; [FE-03](#fe-03). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/admin/account/changePasswordProxy.test.ts`](../src/features/admin/account/changePasswordProxy.test.ts)
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Staff/Admin self-password form and server proxy exist; Provider gap not a mismatch of this internal screen. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-5"></a>

### Screen #5 — Admin Dashboard

- **Module / description:** Administration Dashboard. Provides an overview of administrative information, operational indicators, pending tasks, and navigation to Web Administration modules.
- **Source / platform:** §3.1.2.1, original #5; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #5; §3.1.3 Table 5 name-based authorization; §1 / §2.1 workspace ownership.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** No dedicated numbered UC; workspace/navigation surface only..
- **BR / MSG trace:** None explicitly listed at this traceability level; see linked UC rules. / None explicitly listed at this traceability level; see linked UC rules.
- **FE route/page candidates:** `/admin` ([`app/admin/(console)/page.tsx`](../app/admin/%28console%29/page.tsx)) **Main component candidates:** [`src/features/admin/dashboard/AdminDashboard.tsx`](../src/features/admin/dashboard/AdminDashboard.tsx), [`src/features/admin/shared/components/analytics/AdminAnalyticsTabView.tsx`](../src/features/admin/shared/components/analytics/AdminAnalyticsTabView.tsx)
- **Guard / evidence:** [`app/admin/(console)/page.tsx`](../app/admin/%28console%29/page.tsx), [`app/admin/(console)/layout.tsx`](../app/admin/%28console%29/layout.tsx) Evidence: Screen-specific paths above.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. Workspace dashboard/navigation screen, no single explicit dedicated UC; actions retain individual UC platform/role restrictions. Admin dashboard route exists; Staff redirected to /admin/staff. Analytics defaults DATA_SOURCE_NOT_CONNECTED and no production dataset supplied, so operational numbers not verified. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-6"></a>

### Screen #6 — User Accounts List

- **Module / description:** User Management. Displays the accounts within the signed-in role’s scope (BR-168): Traveler and Tour Operator accounts for Staff, Staff accounts for an Administrator, with role, account status, and basic account details.
- **Source / platform:** §3.1.2.1, original #6; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #6; §3.1.3 Table 5 name-based authorization; §3.9.1.1 UC-46.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-46](#uc-46).
- **BR / MSG trace:** BR-03, BR-52, BR-115, BR-168, BR-182 / MSG29, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/admin/users` ([`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx)), `/admin/users/[userId]` ([`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx)) **Main component candidates:** [`src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx), [`src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx)
- **Guard / evidence:** [`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx), [`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx) Evidence: [FE-20](#fe-20). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-7"></a>

### Screen #7 — User Account Details

- **Module / description:** User Management. Displays detailed information about a selected account and provides available administrative account actions.
- **Source / platform:** §3.1.2.1, original #7; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #7; §3.1.3 Table 5 name-based authorization; §3.9.1.1 UC-46; §3.9.1.2 UC-47; §3.9.1.3 UC-48.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-46](#uc-46), [UC-47](#uc-47), [UC-48](#uc-48).
- **BR / MSG trace:** BR-03, BR-52, BR-115, BR-168, BR-169, BR-170, BR-171, BR-175, BR-176, BR-182, BR-189, BR-200 / MSG29, MSG123, MSG126, MSG127, MSG128, MSG133, MSG189, MSG190, MSG199
- **FE route/page candidates:** `/admin/users` ([`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx)), `/admin/users/[userId]` ([`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx)) **Main component candidates:** [`src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx), [`src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx)
- **Guard / evidence:** [`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx), [`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx) Evidence: [FE-20](#fe-20). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-8"></a>

### Screen #8 — Lock Account Confirmation

- **Module / description:** User Management. Confirms an authorized internal user’s request to lock an eligible account within the scope permitted by their role. Staff can lock Traveler and Tour Operator accounts, Administrators can lock Staff accounts only.
- **Source / platform:** §3.1.2.1, original #8; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #8; §3.1.3 Table 5 name-based authorization; §3.9.1.2 UC-47.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-47](#uc-47).
- **BR / MSG trace:** BR-168, BR-169, BR-175, BR-176, BR-189 / MSG123, MSG126, MSG127, MSG133, MSG189
- **FE route/page candidates:** `/admin/users` ([`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx)), `/admin/users/[userId]` ([`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx)) **Main component candidates:** [`src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx), [`src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx)
- **Guard / evidence:** [`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx), [`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx) Evidence: [FE-20](#fe-20). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-9"></a>

### Screen #9 — Unlock Account Confirmation

- **Module / description:** User Management. Confirms an authorized internal user’s request to restore access to a previously locked account within the scope permitted by their role. Staff can unlock Traveler and Tour Operator accounts, Administrators can unlock Staff accounts only.
- **Source / platform:** §3.1.2.1, original #9; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #9; §3.1.3 Table 5 name-based authorization; §3.9.1.3 UC-48.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-48](#uc-48).
- **BR / MSG trace:** BR-168, BR-170, BR-171, BR-176, BR-189, BR-200 / MSG123, MSG126, MSG127, MSG133, MSG190, MSG199
- **FE route/page candidates:** `/admin/users` ([`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx)), `/admin/users/[userId]` ([`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx)) **Main component candidates:** [`src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx), [`src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx)
- **Guard / evidence:** [`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx), [`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx) Evidence: [FE-20](#fe-20). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-10"></a>

### Screen #10 — Pending Operator Applications List

- **Module / description:** Tour Operator Approval. Displays Tour Operator applications currently awaiting verification and approval by Staff.
- **Source / platform:** §3.1.2.1, original #10; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #10; §3.1.3 Table 5 name-based authorization; §3.9.2.1 UC-49; §3.9.2.2 UC-50.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-49](#uc-49), [UC-50](#uc-50).
- **BR / MSG trace:** BR-07, BR-08, BR-09, BR-115, BR-118, BR-119, BR-130 / MSG22, MSG26, MSG123, MSG124, MSG126, MSG127, MSG133, MSG188
- **FE route/page candidates:** `/admin/tour-operator-applications` ([`app/admin/(console)/tour-operator-applications/page.tsx`](../app/admin/%28console%29/tour-operator-applications/page.tsx)), `/admin/tour-operator-applications/[userId]` ([`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx)) **Main component candidates:** [`src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx`](../src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx), [`src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts`](../src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx) Evidence: [FE-21](#fe-21). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-11"></a>

### Screen #11 — Operator Application Details

- **Module / description:** Tour Operator Approval. Displays the submitted business information and legal documents required for Staff to review and verify a Tour Operator application.
- **Source / platform:** §3.1.2.1, original #11; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #11; §3.1.3 Table 5 name-based authorization; §3.9.2.1 UC-49; §3.9.2.2 UC-50.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-49](#uc-49), [UC-50](#uc-50).
- **BR / MSG trace:** BR-07, BR-08, BR-09, BR-115, BR-118, BR-119, BR-130 / MSG22, MSG26, MSG123, MSG124, MSG126, MSG127, MSG133, MSG188
- **FE route/page candidates:** `/admin/tour-operator-applications` ([`app/admin/(console)/tour-operator-applications/page.tsx`](../app/admin/%28console%29/tour-operator-applications/page.tsx)), `/admin/tour-operator-applications/[userId]` ([`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx)) **Main component candidates:** [`src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx`](../src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx), [`src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts`](../src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx) Evidence: [FE-21](#fe-21). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-12"></a>

### Screen #12 — Operator Rejection Reason

- **Module / description:** Tour Operator Approval. Allows a Staff member to provide the reason for rejecting a Tour Operator application that does not satisfy the required verification criteria.
- **Source / platform:** §3.1.2.1, original #12; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #12; §3.1.3 Table 5 name-based authorization; §3.9.2.2 UC-50.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-50](#uc-50).
- **BR / MSG trace:** BR-09, BR-115, BR-118, BR-119, BR-130 / MSG123, MSG126, MSG127, MSG133, MSG188
- **FE route/page candidates:** `/admin/tour-operator-applications` ([`app/admin/(console)/tour-operator-applications/page.tsx`](../app/admin/%28console%29/tour-operator-applications/page.tsx)), `/admin/tour-operator-applications/[userId]` ([`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx)) **Main component candidates:** [`src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx`](../src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx), [`src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts`](../src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx) Evidence: [FE-21](#fe-21). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-13"></a>

### Screen #13 — Pending Tour Posts List

- **Module / description:** Tour Approval. Displays tour packages submitted by Tour Operators and currently awaiting review and approval by Staff.
- **Source / platform:** §3.1.2.1, original #13; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #13; §3.1.3 Table 5 name-based authorization; §3.9.7.1 UC-59; §3.9.7.2 UC-60.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-59](#uc-59), [UC-60](#uc-60).
- **BR / MSG trace:** BR-56, BR-103, BR-104, BR-115, BR-118, BR-119, BR-125, BR-130 / MSG01, MSG123, MSG126, MSG127, MSG128, MSG133, MSG144, MSG195
- **FE route/page candidates:** `/admin/tours/reviews` ([`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx)), `/admin/tours/reviews/[id]` ([`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx)) **Main component candidates:** [`src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx`](../src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx), [`src/features/admin/tour-reviews/services/tourModerationService.ts`](../src/features/admin/tour-reviews/services/tourModerationService.ts)
- **Guard / evidence:** [`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx), [`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx) Evidence: [FE-27](#fe-27). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-14"></a>

### Screen #14 — Tour Content & Pricing Details

- **Module / description:** Tour Approval. Displays the selected tour’s itinerary, POIs, pricing, capacity, content, and Tour Operator information for Staff review before an approval or rejection decision is made.
- **Source / platform:** §3.1.2.1, original #14; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #14; §3.1.3 Table 5 name-based authorization; §3.9.7.1 UC-59; §3.9.7.2 UC-60.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-59](#uc-59), [UC-60](#uc-60).
- **BR / MSG trace:** BR-56, BR-103, BR-104, BR-115, BR-118, BR-119, BR-125, BR-130 / MSG01, MSG123, MSG126, MSG127, MSG128, MSG133, MSG144, MSG195
- **FE route/page candidates:** `/admin/tours/reviews` ([`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx)), `/admin/tours/reviews/[id]` ([`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx)) **Main component candidates:** [`src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx`](../src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx), [`src/features/admin/tour-reviews/services/tourModerationService.ts`](../src/features/admin/tour-reviews/services/tourModerationService.ts)
- **Guard / evidence:** [`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx), [`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx) Evidence: [FE-27](#fe-27). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-15"></a>

### Screen #15 — Tour Rejection / Revision Reason

- **Module / description:** Tour Approval. Allows a Staff member to provide a rejection or revision reason for a tour submission that does not satisfy the defined publication requirements.
- **Source / platform:** §3.1.2.1, original #15; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #15; §3.1.3 Table 5 name-based authorization; §3.9.7.2 UC-60.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-60](#uc-60).
- **BR / MSG trace:** BR-56, BR-104, BR-115, BR-118, BR-119, BR-130 / MSG123, MSG126, MSG127, MSG133, MSG195
- **FE route/page candidates:** `/admin/tours/reviews` ([`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx)), `/admin/tours/reviews/[id]` ([`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx)) **Main component candidates:** [`src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx`](../src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx), [`src/features/admin/tour-reviews/services/tourModerationService.ts`](../src/features/admin/tour-reviews/services/tourModerationService.ts)
- **Guard / evidence:** [`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx), [`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx) Evidence: [FE-27](#fe-27). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-16"></a>

### Screen #16 — POIs & Master Data List

- **Module / description:** POI Management. Displays master Points of Interest list and provides access to POI management operations.
- **Source / platform:** §3.1.2.1, original #16; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #16; §3.1.3 Table 5 name-based authorization; §3.9.3.1 UC-51; §3.9.3.2 UC-52; §3.9.3.3 UC-53.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-51](#uc-51), [UC-52](#uc-52), [UC-53](#uc-53).
- **BR / MSG trace:** BR-24, BR-87, BR-115, BR-120, BR-121, BR-122, BR-130 / MSG01, MSG19, MSG123, MSG126, MSG127, MSG138, MSG143, MSG191, MSG192, MSG193, MSG194
- **FE route/page candidates:** `/admin/catalogue/points-of-interest/new` ([`app/admin/catalogue/points-of-interest/new/page.tsx`](../app/admin/catalogue/points-of-interest/new/page.tsx)), `/admin/catalogue/points-of-interest` ([`app/admin/catalogue/points-of-interest/page.tsx`](../app/admin/catalogue/points-of-interest/page.tsx)) **Main component candidates:** [`src/features/admin/create-poi/CreatePoiPage.tsx`](../src/features/admin/create-poi/CreatePoiPage.tsx), [`src/features/admin/create-poi/services/poi-proxy.ts`](../src/features/admin/create-poi/services/poi-proxy.ts), [`src/features/admin/catalogue/components/PoiCatalogListView.tsx`](../src/features/admin/catalogue/components/PoiCatalogListView.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`app/admin/catalogue/points-of-interest/new/page.tsx`](../app/admin/catalogue/points-of-interest/new/page.tsx), [`app/admin/catalogue/points-of-interest/page.tsx`](../app/admin/catalogue/points-of-interest/page.tsx) Evidence: [FE-22](#fe-22), [FE-23](#fe-23). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-17"></a>

### Screen #17 — Create POI

- **Module / description:** POI Management. Allows a Staff member to add a new Point of Interest to TripMate’s master catalog by providing required geographical, category, and operating information.
- **Source / platform:** §3.1.2.1, original #17; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #17; §3.1.3 Table 5 name-based authorization; §3.9.3.1 UC-51.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-51](#uc-51).
- **BR / MSG trace:** BR-24, BR-87, BR-115, BR-120, BR-130 / MSG01, MSG19, MSG126, MSG127, MSG138, MSG143, MSG191
- **FE route/page candidates:** `/admin/catalogue/points-of-interest/new` ([`app/admin/catalogue/points-of-interest/new/page.tsx`](../app/admin/catalogue/points-of-interest/new/page.tsx)) **Main component candidates:** [`src/features/admin/create-poi/CreatePoiPage.tsx`](../src/features/admin/create-poi/CreatePoiPage.tsx), [`src/features/admin/create-poi/services/poi-proxy.ts`](../src/features/admin/create-poi/services/poi-proxy.ts)
- **Guard / evidence:** [`app/admin/catalogue/points-of-interest/new/page.tsx`](../app/admin/catalogue/points-of-interest/new/page.tsx) Evidence: [FE-22](#fe-22). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-18"></a>

### Screen #18 — Update POI

- **Module / description:** POI Management. Allows an Administrator or Staff member to load an existing Point of Interest and modify its geographical, operational, and descriptive attributes.
- **Source / platform:** §3.1.2.1, original #18; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #18; §3.1.3 Table 5 name-based authorization; §3.9.3.2 UC-52.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-52](#uc-52).
- **BR / MSG trace:** BR-87, BR-115, BR-120, BR-121, BR-130 / MSG01, MSG126, MSG127, MSG143, MSG192, MSG194
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-23](#fe-23). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-19"></a>

### Screen #19 — Deactivate POI Confirmation

- **Module / description:** POI Management. Allows an Administrator to confirm the deactivation of a POI with a mandatory reason; the POI is set to Inactive and never deleted (BR-121).
- **Source / platform:** §3.1.2.1, original #19; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #19; §3.1.3 Table 5 name-based authorization; §3.9.3.3 UC-53.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-53](#uc-53).
- **BR / MSG trace:** BR-24, BR-115, BR-121, BR-122, BR-130 / MSG123, MSG126, MSG127, MSG193, MSG194
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-23](#fe-23). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. Deactivation only, not deletion; Administrator action BR-121. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-20"></a>

### Screen #20 — Routes List

- **Module / description:** Route Management. Displays routes or route segments maintained by TripMate and provides access to route management operations.
- **Source / platform:** §3.1.2.1, original #20; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #20; §3.1.3 Table 5 name-based authorization; §3.9.4.1 UC-54; §3.9.4.2 UC-55.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-54](#uc-54), [UC-55](#uc-55).
- **BR / MSG trace:** BR-24, BR-27, BR-35, BR-115, BR-122, BR-130 / MSG01, MSG126, MSG127, MSG139, MSG140, MSG141, MSG143
- **FE route/page candidates:** `/admin/routes` ([`app/admin/(console)/routes/page.tsx`](../app/admin/%28console%29/routes/page.tsx)), `/admin/routes/create` ([`app/admin/(console)/routes/create/page.tsx`](../app/admin/%28console%29/routes/create/page.tsx)) **Main component candidates:** [`src/features/admin/routes/components/CreateRouteUnavailableView.tsx`](../src/features/admin/routes/components/CreateRouteUnavailableView.tsx), [`src/features/admin/routes/resources/en.ts`](../src/features/admin/routes/resources/en.ts)
- **Guard / evidence:** [`app/admin/(console)/routes/page.tsx`](../app/admin/%28console%29/routes/page.tsx), [`app/admin/(console)/routes/create/page.tsx`](../app/admin/%28console%29/routes/create/page.tsx) Evidence: [FE-24](#fe-24). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-21"></a>

### Screen #21 — Create Route

- **Module / description:** Route Management. Allows a Staff member to create a new route or route segment by providing the required routing information and supported route attributes.
- **Source / platform:** §3.1.2.1, original #21; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #21; §3.1.3 Table 5 name-based authorization; §3.9.4.1 UC-54.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-54](#uc-54).
- **BR / MSG trace:** BR-24, BR-35, BR-115, BR-122, BR-130 / MSG01, MSG126, MSG127, MSG139, MSG141, MSG143
- **FE route/page candidates:** `/admin/routes` ([`app/admin/(console)/routes/page.tsx`](../app/admin/%28console%29/routes/page.tsx)), `/admin/routes/create` ([`app/admin/(console)/routes/create/page.tsx`](../app/admin/%28console%29/routes/create/page.tsx)) **Main component candidates:** [`src/features/admin/routes/components/CreateRouteUnavailableView.tsx`](../src/features/admin/routes/components/CreateRouteUnavailableView.tsx), [`src/features/admin/routes/resources/en.ts`](../src/features/admin/routes/resources/en.ts)
- **Guard / evidence:** [`app/admin/(console)/routes/page.tsx`](../app/admin/%28console%29/routes/page.tsx), [`app/admin/(console)/routes/create/page.tsx`](../app/admin/%28console%29/routes/create/page.tsx) Evidence: [FE-24](#fe-24). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-22"></a>

### Screen #22 — Update Route

- **Module / description:** Route Management. Allows a Staff member to load an existing route or route segment and modify supported routing information and attributes.
- **Source / platform:** §3.1.2.1, original #22; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #22; §3.1.3 Table 5 name-based authorization; §3.9.4.2 UC-55.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-55](#uc-55).
- **BR / MSG trace:** BR-24, BR-27, BR-115, BR-122, BR-130 / MSG01, MSG126, MSG127, MSG140, MSG141, MSG143
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-24](#fe-24). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-23"></a>

### Screen #23 — Algorithm Parameters Configuration

- **Module / description:** System Configuration. Allows an Administrator to configure exposed parameters used by TripMate algorithms, such as buffer time, default travel speed, rerouting radius, and weather thresholds.
- **Source / platform:** §3.1.2.1, original #23; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #23; §3.1.3 Table 5 name-based authorization; §3.9.5 UC-56.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-56](#uc-56).
- **BR / MSG trace:** BR-26, BR-58, BR-115, BR-123, BR-130 / MSG01, MSG126, MSG127, MSG142, MSG143
- **FE route/page candidates:** `/admin/settings/algorithm-parameters` ([`app/admin/(console)/settings/algorithm-parameters/page.tsx`](../app/admin/%28console%29/settings/algorithm-parameters/page.tsx)) **Main component candidates:** [`src/features/admin/algorithm-config/AlgorithmConfigForm.tsx`](../src/features/admin/algorithm-config/AlgorithmConfigForm.tsx), [`src/features/admin/algorithm-config/algorithmConfigProxy.ts`](../src/features/admin/algorithm-config/algorithmConfigProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/settings/algorithm-parameters/page.tsx`](../app/admin/%28console%29/settings/algorithm-parameters/page.tsx) Evidence: [FE-25](#fe-25). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-24"></a>

### Screen #24 — Active Trips Monitor

- **Module / description:** Active Trip Monitoring. Displays currently active TripMate trips and high-level operational information that allows Staff to monitor ongoing trips and identify trips requiring further inspection.
- **Source / platform:** §3.1.2.1, original #24; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #24; §3.1.3 Table 5 name-based authorization; §3.9.6.1 UC-57.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-57](#uc-57).
- **BR / MSG trace:** BR-32, BR-51, BR-52, BR-115, BR-124 / MSG126, MSG127, MSG128
- **FE route/page candidates:** `/admin/trips/active` ([`app/admin/(console)/trips/active/page.tsx`](../app/admin/%28console%29/trips/active/page.tsx)), `/admin/trips/active/[id]` ([`app/admin/(console)/trips/active/[id]/page.tsx`](../app/admin/%28console%29/trips/active/[id]/page.tsx)) **Main component candidates:** [`src/features/admin/active-trips/ActiveTripsScreen.tsx`](../src/features/admin/active-trips/ActiveTripsScreen.tsx), [`src/features/admin/active-trips/activeTripsProxy.ts`](../src/features/admin/active-trips/activeTripsProxy.ts), [`src/features/admin/active-trip-details/activeTripDetailsProxy.ts`](../src/features/admin/active-trip-details/activeTripDetailsProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/layout.tsx`](../app/admin/%28console%29/layout.tsx) Evidence: [FE-26](#fe-26). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-25"></a>

### Screen #25 — Active Trip Details

- **Module / description:** Active Trip Monitoring. Displays detailed operational information for a selected active trip, including available location information, itinerary progress, FSM state, detected incidents, weather disruptions, route deviations, and rerouting events for Staff monitoring.
- **Source / platform:** §3.1.2.1, original #25; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #25; §3.1.3 Table 5 name-based authorization; §3.9.6.2 UC-58.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-58](#uc-58).
- **BR / MSG trace:** BR-26, BR-32, BR-50, BR-51, BR-115, BR-124, BR-130 / MSG32, MSG116, MSG117, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/admin/trips/active` ([`app/admin/(console)/trips/active/page.tsx`](../app/admin/%28console%29/trips/active/page.tsx)), `/admin/trips/active/[id]` ([`app/admin/(console)/trips/active/[id]/page.tsx`](../app/admin/%28console%29/trips/active/[id]/page.tsx)) **Main component candidates:** [`src/features/admin/active-trips/ActiveTripsScreen.tsx`](../src/features/admin/active-trips/ActiveTripsScreen.tsx), [`src/features/admin/active-trips/activeTripsProxy.ts`](../src/features/admin/active-trips/activeTripsProxy.ts), [`src/features/admin/active-trip-details/activeTripDetailsProxy.ts`](../src/features/admin/active-trip-details/activeTripDetailsProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/layout.tsx`](../app/admin/%28console%29/layout.tsx) Evidence: [FE-26](#fe-26). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-26"></a>

### Screen #26 — Platform Bookings List

- **Module / description:** Platform Booking Management. Displays booking records across the TripMate platform for Staff monitoring, with supported search and filtering by booking, Traveler, Tour Operator, status, and other available criteria.
- **Source / platform:** §3.1.2.1, original #26; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #26; §3.1.3 Table 5 name-based authorization; §3.9.8 UC-61.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-61](#uc-61).
- **BR / MSG trace:** BR-52, BR-71, BR-77, BR-79, BR-115, BR-126, BR-130 / MSG29, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/admin/bookings` ([`app/admin/(console)/bookings/page.tsx`](../app/admin/%28console%29/bookings/page.tsx)) **Main component candidates:** [`src/features/admin/platform-bookings/platformBookingsProxy.ts`](../src/features/admin/platform-bookings/platformBookingsProxy.ts), [`src/features/admin/platform-bookings/platformBookingsService.ts`](../src/features/admin/platform-bookings/platformBookingsService.ts)
- **Guard / evidence:** [`app/admin/(console)/bookings/page.tsx`](../app/admin/%28console%29/bookings/page.tsx) Evidence: [FE-28](#fe-28). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-27"></a>

### Screen #27 — Platform Booking Details

- **Module / description:** Platform Booking Management. Displays read-only detailed information about a selected platform booking, including the associated Traveler, Tour Operator, tour or service, booking status, payment status, and available transaction information.
- **Source / platform:** §3.1.2.1, original #27; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #27; §3.1.3 Table 5 name-based authorization; §3.9.8 UC-61.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-61](#uc-61).
- **BR / MSG trace:** BR-52, BR-71, BR-77, BR-79, BR-115, BR-126, BR-130 / MSG29, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/admin/bookings` ([`app/admin/(console)/bookings/page.tsx`](../app/admin/%28console%29/bookings/page.tsx)) **Main component candidates:** [`src/features/admin/platform-bookings/platformBookingsProxy.ts`](../src/features/admin/platform-bookings/platformBookingsProxy.ts), [`src/features/admin/platform-bookings/platformBookingsService.ts`](../src/features/admin/platform-bookings/platformBookingsService.ts)
- **Guard / evidence:** [`app/admin/(console)/bookings/page.tsx`](../app/admin/%28console%29/bookings/page.tsx) Evidence: [FE-28](#fe-28). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-28"></a>

### Screen #28 — Settlement Records List

- **Module / description:** Payout Management. Displays the read-only list of settlement records per booking, including the tour departure, transfer time, amount, status and transfer reference. Available to Staff and Administrator (UC-72).
- **Source / platform:** §3.1.2.1, original #28; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #28; §3.1.3 Table 5 name-based authorization; §3.10.4 UC-71; §3.9.9.1 UC-72; §3.10.5 UC-74.
- **Authorized actors:** Administrator, Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-71](#uc-71), [UC-72](#uc-72), [UC-74](#uc-74).
- **BR / MSG trace:** BR-52, BR-79, BR-115, BR-139, BR-140, BR-141, BR-142, BR-144, BR-145, BR-146, BR-160, BR-172, BR-177, BR-188 / MSG126, MSG127, MSG128, MSG145, MSG146, MSG175, MSG176
- **FE route/page candidates:** `/admin/payout-settlements` ([`app/admin/(console)/payout-settlements/page.tsx`](../app/admin/%28console%29/payout-settlements/page.tsx)) **Main component candidates:** [`src/features/admin/payout-settlements/payoutSettlementsProxy.ts`](../src/features/admin/payout-settlements/payoutSettlementsProxy.ts), [`src/features/admin/payout-settlements/PayoutSettlementsScreen.tsx`](../src/features/admin/payout-settlements/PayoutSettlementsScreen.tsx)
- **Guard / evidence:** [`app/admin/(console)/payout-settlements/page.tsx`](../app/admin/%28console%29/payout-settlements/page.tsx) Evidence: [FE-33](#fe-33), [FE-35](#fe-35). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-29"></a>

### Screen #29 — Failed Payout Settlement Details

- **Module / description:** Payout Management. Displays the details of a SettlementFailed settlement for Administrator review, including the failure information and the attempt count. The Administrator actions are defined in UC-73.
- **Source / platform:** §3.1.2.1, original #29; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #29; §3.1.3 Table 5 name-based authorization; §3.10.6 UC-73; §3.10.5 UC-74.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-73](#uc-73), [UC-74](#uc-74).
- **BR / MSG trace:** BR-145, BR-146, BR-160, BR-172 / MSG126, MSG145, MSG146, MSG175, MSG176, MSG177, MSG178
- **FE route/page candidates:** `/admin/payout-settlements/[batchId]` ([`app/admin/(console)/payout-settlements/[batchId]/page.tsx`](../app/admin/%28console%29/payout-settlements/[batchId]/page.tsx)) **Main component candidates:** [`src/features/admin/payout-settlements/payoutSettlementsProxy.ts`](../src/features/admin/payout-settlements/payoutSettlementsProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/payout-settlements/[batchId]/page.tsx`](../app/admin/%28console%29/payout-settlements/[batchId]/page.tsx) Evidence: [FE-33](#fe-33), [FE-36](#fe-36). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-30"></a>

### Screen #30 — Landing Page Content Management

- **Module / description:** Content Management. Allows a Staff member to modify and maintain supported content displayed on the TripMate public landing page through the web administration workspace.
- **Source / platform:** §3.1.2.1, original #30; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #30; §3.1.3 Table 5 name-based authorization; §3.9.10 UC-62.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-62](#uc-62).
- **BR / MSG trace:** BR-16, BR-27, BR-56, BR-115, BR-128, BR-130 / MSG01, MSG19, MSG29, MSG65, MSG126, MSG127, MSG129, MSG148
- **FE route/page candidates:** `/admin/landing-content` ([`app/admin/(console)/landing-content/page.tsx`](../app/admin/%28console%29/landing-content/page.tsx)) **Main component candidates:** [`src/features/admin/landing-content/landingContentService.ts`](../src/features/admin/landing-content/landingContentService.ts), [`src/features/admin/landing-content/landingContentProxy.ts`](../src/features/admin/landing-content/landingContentProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/landing-content/page.tsx`](../app/admin/%28console%29/landing-content/page.tsx) Evidence: [FE-29](#fe-29). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-31"></a>

### Screen #31 — Statistical Reports

- **Module / description:** Reporting. Displays available platform-level statistical information and provides supported report export functions.
- **Source / platform:** §3.1.2.1, original #31; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #31; §3.1.3 Table 5 name-based authorization; §3.9.11 UC-63.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-63](#uc-63).
- **BR / MSG trace:** BR-79, BR-109, BR-110, BR-115, BR-129, BR-130 / MSG01, MSG117, MSG126, MSG127, MSG128, MSG149, MSG184
- **FE route/page candidates:** `/admin/reports` ([`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx)) **Main component candidates:** [`src/features/admin/reports/components/StatisticalReportsView.tsx`](../src/features/admin/reports/components/StatisticalReportsView.tsx), [`src/features/admin/reports/services/statisticalReportsProxy.ts`](../src/features/admin/reports/services/statisticalReportsProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx) Evidence: [FE-30](#fe-30). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-32"></a>

### Screen #32 — System Audit Logs List

- **Module / description:** Audit. Displays recorded system and administrative activities available for operational, security, and administrative monitoring.
- **Source / platform:** §3.1.2.1, original #32; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #32; §3.1.3 Table 5 name-based authorization; §3.9.12.1 UC-64.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-64](#uc-64).
- **BR / MSG trace:** BR-03, BR-52, BR-110, BR-115, BR-130 / MSG29, MSG116, MSG117, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/admin/audit-logs` ([`app/admin/(console)/audit-logs/page.tsx`](../app/admin/%28console%29/audit-logs/page.tsx)) **Main component candidates:** [`src/features/admin/audit-logs/api/auditLogProxy.ts`](../src/features/admin/audit-logs/api/auditLogProxy.ts), [`src/features/admin/audit-logs/services/auditLogAdminService.ts`](../src/features/admin/audit-logs/services/auditLogAdminService.ts)
- **Guard / evidence:** [`app/admin/(console)/audit-logs/page.tsx`](../app/admin/%28console%29/audit-logs/page.tsx) Evidence: [FE-31](#fe-31). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-33"></a>

### Screen #33 — Audit Log Details

- **Module / description:** Audit. Displays technical and contextual information associated with a selected audit record.
- **Source / platform:** §3.1.2.1, original #33; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #33; §3.1.3 Table 5 name-based authorization; §3.9.12.2 UC-65.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-65](#uc-65).
- **BR / MSG trace:** BR-03, BR-115, BR-130, BR-190 / MSG126, MSG127, MSG128, MSG150
- **FE route/page candidates:** `/admin/audit-logs` ([`app/admin/(console)/audit-logs/page.tsx`](../app/admin/%28console%29/audit-logs/page.tsx)) **Main component candidates:** [`src/features/admin/audit-logs/api/auditLogProxy.ts`](../src/features/admin/audit-logs/api/auditLogProxy.ts), [`src/features/admin/audit-logs/services/auditLogAdminService.ts`](../src/features/admin/audit-logs/services/auditLogAdminService.ts)
- **Guard / evidence:** [`app/admin/(console)/audit-logs/page.tsx`](../app/admin/%28console%29/audit-logs/page.tsx) Evidence: [FE-31](#fe-31). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-34"></a>

### Screen #34 — Staff Dashboard

- **Module / description:** Staff Dashboard. Provides an overview of operational information, pending tasks, monitoring indicators, and navigation to administration modules available to Staff.
- **Source / platform:** §3.1.2.1, original #34; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #34; §3.1.3 Table 5 name-based authorization; §1 / §2.1 workspace ownership.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** No dedicated numbered UC; workspace/navigation surface only..
- **BR / MSG trace:** None explicitly listed at this traceability level; see linked UC rules. / None explicitly listed at this traceability level; see linked UC rules.
- **FE route/page candidates:** `/admin/staff` ([`app/admin/(console)/staff/page.tsx`](../app/admin/%28console%29/staff/page.tsx)) **Main component candidates:** [`src/features/admin/staff/components/StaffDashboardView.tsx`](../src/features/admin/staff/components/StaffDashboardView.tsx), [`src/features/admin/staff/components/StaffAnalyticsTabView.tsx`](../src/features/admin/staff/components/StaffAnalyticsTabView.tsx)
- **Guard / evidence:** [`app/admin/(console)/staff/page.tsx`](../app/admin/%28console%29/staff/page.tsx), [`app/admin/(console)/layout.tsx`](../app/admin/%28console%29/layout.tsx) Evidence: Screen-specific paths above.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISMATCH`. Workspace dashboard/navigation screen, no single explicit dedicated UC; actions retain individual UC platform/role restrictions. Staff dashboard exists; page verifies internal session but does not require Staff, so Administrator can also render it although Table5 only grants Staff. Analytics defaults DATA_SOURCE_NOT_CONNECTED. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-35"></a>

### Screen #35 — Create Staff Account

- **Module / description:** User Management. (UC-76) Allows an Administrator to create a new internal Staff account by providing the required account information. TripMate assigns the Staff role and enables access according to the internal account policy.
- **Source / platform:** §3.1.2.1, original #35; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #35; §3.1.3 Table 5 name-based authorization; §3.9.1.4 UC-76.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-76](#uc-76).
- **BR / MSG trace:** BR-03, BR-174, BR-191 / MSG01, MSG05, MSG126, MSG127, MSG143, MSG200
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-37](#fe-37). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. UC-76/BR-191 proposal approval pending. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-36"></a>

### Screen #36 — Platform Revenue Report

- **Module / description:** Financial Reporting. (UC-63) Displays platform-wide financial information for an Administrator, including booking revenue, refunds, platform commissions, payout amounts, and other supported financial summaries.
- **Source / platform:** §3.1.2.1, original #36; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #36; §3.1.3 Table 5 name-based authorization; §3.9.11 UC-63.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-63](#uc-63).
- **BR / MSG trace:** BR-79, BR-109, BR-110, BR-115, BR-129, BR-130 / MSG01, MSG117, MSG126, MSG127, MSG128, MSG149, MSG184
- **FE route/page candidates:** `/admin/reports` ([`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx)) **Main component candidates:** [`src/features/admin/reports/components/StatisticalReportsView.tsx`](../src/features/admin/reports/components/StatisticalReportsView.tsx), [`src/features/admin/reports/services/statisticalReportsProxy.ts`](../src/features/admin/reports/services/statisticalReportsProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx) Evidence: [FE-30](#fe-30). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-37"></a>

### Screen #37 — Export Platform Revenue Report

- **Module / description:** Financial Reporting. (UC-63) Allows an Administrator to configure and export the currently displayed platform-wide revenue report using the selected filters and a supported output format.
- **Source / platform:** §3.1.2.1, original #37; `ADMIN_WEB_ONLY`. §3.1.2.1 Screen #37; §3.1.3 Table 5 name-based authorization; §3.9.11 UC-63.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-63](#uc-63).
- **BR / MSG trace:** BR-79, BR-109, BR-110, BR-115, BR-129, BR-130 / MSG01, MSG117, MSG126, MSG127, MSG128, MSG149, MSG184
- **FE route/page candidates:** `/admin/reports` ([`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx)) **Main component candidates:** [`src/features/admin/reports/components/StatisticalReportsView.tsx`](../src/features/admin/reports/components/StatisticalReportsView.tsx), [`src/features/admin/reports/services/statisticalReportsProxy.ts`](../src/features/admin/reports/services/statisticalReportsProxy.ts)
- **Guard / evidence:** [`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx) Evidence: [FE-30](#fe-30). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-38"></a>

### Screen #38 — Home Page

- **Module / description:** Public & Guest Exploration. Mobile landing screen for unauthenticated guests, displaying trending tours, featured POIs, itinerary planning shortcuts, and sign-in prompts.
- **Source / platform:** §3.1.2.2, original #38; `MOBILE_ONLY`. §3.1.2.2 Screen #38; §3.1.3 Table 5 name-based authorization; §1 / §2.1 workspace ownership.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** No dedicated numbered UC; workspace/navigation surface only..
- **BR / MSG trace:** None explicitly listed at this traceability level; see linked UC rules. / None explicitly listed at this traceability level; see linked UC rules.
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. Table5 name alias Home Page (Guest); inventory name Home Page. Mobile-only description; do not conflate with web #1. Numbered Home Page row explicitly Mobile-only. Public Web landing is Screen1, not proof of this Mobile screen. Mobile implementation not audited. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-39"></a>

### Screen #39 — Sign In

- **Module / description:** Authentication. Allows a Traveler or Tour Operator to authenticate to the TripMate mobile application using a supported authentication method.
- **Source / platform:** §3.1.2.2, original #39; `MOBILE_ONLY`. §3.1.2.2 Screen #39; §3.1.3 Table 5 name-based authorization; §3.2.4 UC-04.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-04](#uc-04).
- **BR / MSG trace:** BR-03, BR-05, BR-07, BR-10, BR-11, BR-12, BR-168, BR-183 / MSG01, MSG02, MSG09, MSG10, MSG11, MSG12, MSG127, MSG182
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. GAP-01: Service Provider is absent from authentication screen grants despite UC-04 to UC-07 catalog inclusion; screen #39 specifically says mobile, while §3.2.4 also has web sign-in. Table5 name alias Mobile Sign In; inventory name Sign In. Exact numbered row describes mobile only; web sign-in exists in §3.2.4 without a separately numbered public-web screen. Numbered Sign In row explicitly describes mobile only; no FE route assigned to this numbered mobile row. Shared public Web sign-in exists at /sign-in under UC04 without renumbering Screen39; Provider auth discrepancy remains GAP01. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-40"></a>

### Screen #40 — Sign In with Google

- **Module / description:** Authentication. OAuth2 third-party authentication screen enabling instant sign-in and profile synchronization via Google Authentication Services.
- **Source / platform:** §3.1.2.2, original #40; `WEB_AND_MOBILE`. §3.1.2.2 Screen #40; §3.1.3 Table 5 name-based authorization; §3.2.4 UC-04.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-04](#uc-04).
- **BR / MSG trace:** BR-03, BR-05, BR-07, BR-10, BR-11, BR-12, BR-168, BR-183 / MSG01, MSG02, MSG09, MSG10, MSG11, MSG12, MSG127, MSG182
- **FE route/page candidates:** `/sign-in` ([`app/sign-in/page.tsx`](../app/sign-in/page.tsx)) **Main component candidates:** [`src/features/public/auth/PublicSignInForm.tsx`](../src/features/public/auth/PublicSignInForm.tsx), [`src/features/auth/sign-in/useSignInEngine.ts`](../src/features/auth/sign-in/useSignInEngine.ts)
- **Guard / evidence:** [`src/features/auth/session/WebSessionProvider.tsx`](../src/features/auth/session/WebSessionProvider.tsx) Evidence: Screen-specific paths above; [FE-03](#fe-03). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/public/auth/PublicSignInForm.test.tsx`](../src/features/public/auth/PublicSignInForm.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. GAP-01: Service Provider is absent from authentication screen grants despite UC-04 to UC-07 catalog inclusion; screen #39 specifically says mobile, while §3.2.4 also has web sign-in. Google sign-in action is inside public sign-in form, not administration recovery/security routes. Provider absent in Table5 grant must be treated as unresolved SRS auth gap; no per-screen compliance claim. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-41"></a>

### Screen #41 — Traveler Registration

- **Module / description:** Registration. Allows a new Traveler to provide required account information and create a TripMate Traveler account.
- **Source / platform:** §3.1.2.2, original #41; `WEB_AND_MOBILE`. §3.1.2.2 Screen #41; §3.1.3 Table 5 name-based authorization; §3.2.1 UC-01.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-01](#uc-01).
- **BR / MSG trace:** BR-01, BR-02, BR-03, BR-04, BR-05, BR-06 / MSG01, MSG02, MSG03, MSG04, MSG05, MSG06, MSG07, MSG08, MSG127
- **FE route/page candidates:** `/register` ([`app/register/page.tsx`](../app/register/page.tsx)) **Main component candidates:** [`src/features/traveler/registration/TravelerRegistrationForm.tsx`](../src/features/traveler/registration/TravelerRegistrationForm.tsx), [`src/features/traveler/registration/TravelerRegistrationPage.tsx`](../src/features/traveler/registration/TravelerRegistrationPage.tsx)
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above; [FE-01](#fe-01). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/traveler/registration/TravelerRegistrationForm.test.tsx`](../src/features/traveler/registration/TravelerRegistrationForm.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Public registration entry, not a protected page. No authentication guard is required to register; validations/backend results NOT_VERIFIED. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-42"></a>

### Screen #42 — Confirm Email

- **Module / description:** Authentication. Account verification screen prompting newly registered travelers to enter an email OTP or activate the verification link sent to their inbox.
- **Source / platform:** §3.1.2.2, original #42; `WEB_AND_MOBILE`. §3.1.2.2 Screen #42; §3.1.3 Table 5 name-based authorization; §3.2.1 UC-01.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-01](#uc-01).
- **BR / MSG trace:** BR-01, BR-02, BR-03, BR-04, BR-05, BR-06 / MSG01, MSG02, MSG03, MSG04, MSG05, MSG06, MSG07, MSG08, MSG127
- **FE route/page candidates:** `/verify-account` ([`app/verify-account/page.tsx`](../app/verify-account/page.tsx)), `/verify-email` ([`app/verify-email/page.tsx`](../app/verify-email/page.tsx)) **Main component candidates:** [`src/features/auth/verification/VerifyAccountPage.tsx`](../src/features/auth/verification/VerifyAccountPage.tsx), [`src/features/auth/verification/VerifyAccountForm.tsx`](../src/features/auth/verification/VerifyAccountForm.tsx), [`src/features/auth/verification/VerifyEmailHandler.tsx`](../src/features/auth/verification/VerifyEmailHandler.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above; [FE-01](#fe-01). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/auth/verification/VerifyAccountPage.test.tsx`](../src/features/auth/verification/VerifyAccountPage.test.tsx), [`src/features/auth/verification/VerifyEmailHandler.test.tsx`](../src/features/auth/verification/VerifyEmailHandler.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Actual verification routes compose email OTP/link handlers. Registration form initiates verification; /register is not the only evidence. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-43"></a>

### Screen #43 — Tour Operator Registration & Verification

- **Module / description:** Tour Operator Onboarding. Allows a Tour Operator to register a business account and provide the required business, legal, and verification information. Rejected information may be corrected and resubmitted through the same onboarding process.
- **Source / platform:** §3.1.2.2, original #43; `WEB_AND_MOBILE`. §3.1.2.2 Screen #43; §3.1.3 Table 5 name-based authorization; §3.2.2 UC-02; §3.2.3 UC-03.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-02](#uc-02), [UC-03](#uc-03).
- **BR / MSG trace:** BR-01, BR-02, BR-03, BR-07, BR-08, BR-09, BR-181 / MSG01, MSG02, MSG03, MSG04, MSG05, MSG19, MSG21, MSG22, MSG23, MSG24, MSG25, MSG26, MSG127
- **FE route/page candidates:** `/partner/register` ([`app/partner/register/page.tsx`](../app/partner/register/page.tsx)), `/partner/application` ([`app/partner/application/page.tsx`](../app/partner/application/page.tsx)), `/partner/application/resubmit` ([`app/partner/application/resubmit/page.tsx`](../app/partner/application/resubmit/page.tsx)) **Main component candidates:** [`src/features/operator/application/OperatorRegistrationForm.tsx`](../src/features/operator/application/OperatorRegistrationForm.tsx), [`src/features/operator/application/ResubmitApplicationForm.tsx`](../src/features/operator/application/ResubmitApplicationForm.tsx), [`src/features/operator/application/operatorApplicationApi.ts`](../src/features/operator/application/operatorApplicationApi.ts) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx), [`src/features/operator/access/partnerRouteDecision.ts`](../src/features/operator/access/partnerRouteDecision.ts) Evidence: [FE-02](#fe-02). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-44"></a>

### Screen #44 — Operator Application Status

- **Module / description:** Tour Operator Onboarding. Displays the current Tour Operator application state, such as pending, approved, or rejected, and provides the available rejection reason and resubmission entry when applicable.
- **Source / platform:** §3.1.2.2, original #44; `WEB_AND_MOBILE`. §3.1.2.2 Screen #44; §3.1.3 Table 5 name-based authorization; §3.2.2 UC-02; §3.2.3 UC-03.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-02](#uc-02), [UC-03](#uc-03).
- **BR / MSG trace:** BR-01, BR-02, BR-03, BR-07, BR-08, BR-09, BR-181 / MSG01, MSG02, MSG03, MSG04, MSG05, MSG19, MSG21, MSG22, MSG23, MSG24, MSG25, MSG26, MSG127
- **FE route/page candidates:** `/partner/register` ([`app/partner/register/page.tsx`](../app/partner/register/page.tsx)), `/partner/application` ([`app/partner/application/page.tsx`](../app/partner/application/page.tsx)), `/partner/application/resubmit` ([`app/partner/application/resubmit/page.tsx`](../app/partner/application/resubmit/page.tsx)) **Main component candidates:** [`src/features/operator/application/OperatorRegistrationForm.tsx`](../src/features/operator/application/OperatorRegistrationForm.tsx), [`src/features/operator/application/ResubmitApplicationForm.tsx`](../src/features/operator/application/ResubmitApplicationForm.tsx), [`src/features/operator/application/operatorApplicationApi.ts`](../src/features/operator/application/operatorApplicationApi.ts) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx), [`src/features/operator/access/partnerRouteDecision.ts`](../src/features/operator/access/partnerRouteDecision.ts) Evidence: [FE-02](#fe-02). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-45"></a>

### Screen #45 — Password Reset

- **Module / description:** Authentication. Allows a Traveler or Tour Operator who cannot access the current password to complete the supported password-reset process.
- **Source / platform:** §3.1.2.2, original #45; `WEB_AND_MOBILE`. §3.1.2.2 Screen #45; §3.1.3 Table 5 name-based authorization; §3.2.6 UC-06.
- **Authorized actors:** Guest. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-06](#uc-06).
- **BR / MSG trace:** BR-02, BR-03, BR-14, BR-15 / MSG01, MSG02, MSG03, MSG04, MSG14, MSG15, MSG16, MSG127
- **FE route/page candidates:** `/forgot-password` ([`app/forgot-password/page.tsx`](../app/forgot-password/page.tsx)) **Main component candidates:** [`src/features/public/auth/PublicPasswordRecoveryPage.tsx`](../src/features/public/auth/PublicPasswordRecoveryPage.tsx)
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above; [FE-03](#fe-03). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/public/auth/PublicPasswordRecoveryPage.test.tsx`](../src/features/public/auth/PublicPasswordRecoveryPage.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. GAP-01: Service Provider is absent from authentication screen grants despite UC-04 to UC-07 catalog inclusion; screen #39 specifically says mobile, while §3.2.4 also has web sign-in. Public password-reset route exists; detailed Provider auth inconsistency retained GAP01, but no Provider screen grant exists to prove screen-level mismatch. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-46"></a>

### Screen #46 — Change Password

- **Module / description:** Account Security. Allows an authenticated Traveler or Tour Operator to change the current account password.
- **Source / platform:** §3.1.2.2, original #46; `WEB_AND_MOBILE`. §3.1.2.2 Screen #46; §3.1.3 Table 5 name-based authorization; §3.2.7 UC-07.
- **Authorized actors:** Traveler, Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-07](#uc-07).
- **BR / MSG trace:** BR-02, BR-03, BR-15 / MSG01, MSG03, MSG04, MSG17, MSG18, MSG127, MSG181
- **FE route/page candidates:** `/account/security` ([`app/account/security/page.tsx`](../app/account/security/page.tsx)) **Main component candidates:** [`src/features/account/security/ChangePasswordPage.tsx`](../src/features/account/security/ChangePasswordPage.tsx), [`src/features/account/security/ChangePasswordForm.tsx`](../src/features/account/security/ChangePasswordForm.tsx), [`src/features/account/security/webChangePasswordCapability.ts`](../src/features/account/security/webChangePasswordCapability.ts)
- **Guard / evidence:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx) Evidence: Screen-specific paths above; [FE-03](#fe-03). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/account/security/__tests__/ChangePasswordForm.test.tsx`](../src/features/account/security/__tests__/ChangePasswordForm.test.tsx)
- **Status / issues:** `MISMATCH`. GAP-01: Service Provider is absent from authentication screen grants despite UC-04 to UC-07 catalog inclusion; screen #39 specifically says mobile, while §3.2.4 also has web sign-in. Traveler account security form exists. SRS Table5 also grants TourOperator, but account shell :168 renders only Traveler. No partner-specific security route found; Admin uses numbered Screen4. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-47"></a>

### Screen #47 — Traveler Home / Dashboard

- **Module / description:** Traveler Dashboard. Provides the Traveler with access to trip planning, active trips, tour bookings, recommendations, travel groups, and other personal travel functions.
- **Source / platform:** §3.1.2.2, original #47; `WEB_AND_MOBILE`. §3.1.2.2 Screen #47; §3.1.3 Table 5 name-based authorization; §1 / §2.1 workspace ownership.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** No dedicated numbered UC; workspace/navigation surface only..
- **BR / MSG trace:** None explicitly listed at this traceability level; see linked UC rules. / None explicitly listed at this traceability level; see linked UC rules.
- **FE route/page candidates:** `/account` ([`app/account/page.tsx`](../app/account/page.tsx)) **Main component candidates:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx), [`src/features/account/common/AccountWorkspaceNav.tsx`](../src/features/account/common/AccountWorkspaceNav.tsx)
- **Guard / evidence:** [`app/account/page.tsx`](../app/account/page.tsx), [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx) Evidence: Screen-specific paths above.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/account/common/__tests__/AccountWorkspaceShell.test.tsx`](../src/features/account/common/__tests__/AccountWorkspaceShell.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. Workspace dashboard/navigation screen, no single explicit dedicated UC; actions retain individual UC platform/role restrictions. Dashboard links include mobile-only group/live functions; shared dashboard ownership does not authorize these on Web. Account route exists but redirects to profile, not a dedicated dashboard with all Screen47 functions. Shell/nav supply workspace entry; exact dashboard NOT_VERIFIED and Mobile-only links cannot expand Web scope. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-48"></a>

### Screen #48 — Traveler Profile

- **Module / description:** Traveler Profile. Allows a Traveler to view and update supported personal profile information.
- **Source / platform:** §3.1.2.2, original #48; `WEB_AND_MOBILE`. §3.1.2.2 Screen #48; §3.1.3 Table 5 name-based authorization; §3.2.8 UC-08.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-08](#uc-08).
- **BR / MSG trace:** BR-01, BR-16, BR-17, BR-18 / MSG01, MSG19, MSG20, MSG127, MSG179, MSG180
- **FE route/page candidates:** `/account/profile` ([`app/account/profile/page.tsx`](../app/account/profile/page.tsx)), `/account/preferences` ([`app/account/preferences/page.tsx`](../app/account/preferences/page.tsx)) **Main component candidates:** [`src/features/account/profile/TravelerProfileForm.tsx`](../src/features/account/profile/TravelerProfileForm.tsx), [`src/features/account/profile/travelerProfileProxy.ts`](../src/features/account/profile/travelerProfileProxy.ts), [`src/features/account/preferences/TravelPreferencesForm.tsx`](../src/features/account/preferences/TravelPreferencesForm.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx) Evidence: [FE-04](#fe-04). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-49"></a>

### Screen #49 — Travel Preferences

- **Module / description:** Travel Preferences. Allows a Traveler to configure supported preferences used during itinerary generation and other personalized TripMate functions.
- **Source / platform:** §3.1.2.2, original #49; `WEB_AND_MOBILE`. §3.1.2.2 Screen #49; §3.1.3 Table 5 name-based authorization; §3.2.9 UC-09.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-09](#uc-09).
- **BR / MSG trace:** BR-19, BR-20 / MSG27, MSG127, MSG143
- **FE route/page candidates:** `/account/profile` ([`app/account/profile/page.tsx`](../app/account/profile/page.tsx)), `/account/preferences` ([`app/account/preferences/page.tsx`](../app/account/preferences/page.tsx)) **Main component candidates:** [`src/features/account/profile/TravelerProfileForm.tsx`](../src/features/account/profile/TravelerProfileForm.tsx), [`src/features/account/profile/travelerProfileProxy.ts`](../src/features/account/profile/travelerProfileProxy.ts), [`src/features/account/preferences/TravelPreferencesForm.tsx`](../src/features/account/preferences/TravelPreferencesForm.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx) Evidence: [FE-04](#fe-04). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-50"></a>

### Screen #50 — Trip / Itinerary Planner

- **Module / description:** Smart Itinerary Planning. Allows a Traveler to provide planning constraints and submit a request for generation of a personalized itinerary.
- **Source / platform:** §3.1.2.2, original #50; `WEB_AND_MOBILE`. §3.1.2.2 Screen #50; §3.1.3 Table 5 name-based authorization; §3.3.1 UC-10.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-10](#uc-10).
- **BR / MSG trace:** BR-21, BR-22, BR-23, BR-24, BR-25, BR-26 / MSG28, MSG29, MSG30, MSG31, MSG127, MSG143
- **FE route/page candidates:** `/plan` ([`app/plan/page.tsx`](../app/plan/page.tsx)), `/itinerary/[id]` ([`app/itinerary/[id]/page.tsx`](../app/itinerary/[id]/page.tsx)), `/itineraries` ([`app/itineraries/page.tsx`](../app/itineraries/page.tsx)) **Main component candidates:** [`src/features/scheduling/components/CreateSchedulingRequestPage.tsx`](../src/features/scheduling/components/CreateSchedulingRequestPage.tsx), [`src/features/scheduling/components/ViewSuggestedItineraryPage.tsx`](../src/features/scheduling/components/ViewSuggestedItineraryPage.tsx), [`src/features/scheduling/components/MyItinerariesPage.tsx`](../src/features/scheduling/components/MyItinerariesPage.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/scheduling/components/CreateSchedulingRequestPage.tsx`](../src/features/scheduling/components/CreateSchedulingRequestPage.tsx) Evidence: [FE-05](#fe-05). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-51"></a>

### Screen #51 — Suggested Itinerary

- **Module / description:** Itinerary Management. Displays a TripMate-generated itinerary including ordered POIs, schedule information, travel durations, and related trip information.
- **Source / platform:** §3.1.2.2, original #51; `WEB_AND_MOBILE`. §3.1.2.2 Screen #51; §3.1.3 Table 5 name-based authorization; §3.3.2 UC-11.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-11](#uc-11).
- **BR / MSG trace:** BR-24, BR-25, BR-26, BR-27, BR-51 / MSG32, MSG49, MSG126, MSG127
- **FE route/page candidates:** `/plan` ([`app/plan/page.tsx`](../app/plan/page.tsx)), `/itinerary/[id]` ([`app/itinerary/[id]/page.tsx`](../app/itinerary/[id]/page.tsx)), `/itineraries` ([`app/itineraries/page.tsx`](../app/itineraries/page.tsx)) **Main component candidates:** [`src/features/scheduling/components/CreateSchedulingRequestPage.tsx`](../src/features/scheduling/components/CreateSchedulingRequestPage.tsx), [`src/features/scheduling/components/ViewSuggestedItineraryPage.tsx`](../src/features/scheduling/components/ViewSuggestedItineraryPage.tsx), [`src/features/scheduling/components/MyItinerariesPage.tsx`](../src/features/scheduling/components/MyItinerariesPage.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/scheduling/components/CreateSchedulingRequestPage.tsx`](../src/features/scheduling/components/CreateSchedulingRequestPage.tsx) Evidence: [FE-05](#fe-05). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-52"></a>

### Screen #52 — Offline Map & Itinerary

- **Module / description:** Offline Trip. Allows a Traveler to download and access supported map and itinerary information for offline use when network connectivity is unavailable.
- **Source / platform:** §3.1.2.2, original #52; `MOBILE_ONLY`. §3.1.2.2 Screen #52; §3.1.3 Table 5 name-based authorization; §3.3.7 UC-16; §3.10.3 UC-70.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-16](#uc-16), [UC-70](#uc-70).
- **BR / MSG trace:** BR-26, BR-36, BR-37, BR-38, BR-39, BR-40, BR-165, BR-166 / MSG32, MSG104, MSG105, MSG106, MSG107, MSG126, MSG127, MSG128, MSG154, MSG155, MSG156
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-53"></a>

### Screen #53 — POI Explore / List

- **Module / description:** POI Discovery. Allows a Traveler to browse and search Points of Interest available through TripMate.
- **Source / platform:** §3.1.2.2, original #53; `WEB_AND_MOBILE`. §3.1.2.2 Screen #53; §3.1.3 Table 5 name-based authorization; §3.3.3 UC-12.
- **Authorized actors:** Guest, Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-12](#uc-12).
- **BR / MSG trace:** BR-24, BR-34, BR-180 / MSG33, MSG34, MSG46, MSG126, MSG127
- **FE route/page candidates:** `/pois` ([`app/pois/page.tsx`](../app/pois/page.tsx)), `/pois/[id]` ([`app/pois/[id]/page.tsx`](../app/pois/[id]/page.tsx)) **Main component candidates:** [`src/features/public/pois/components/ExplorePoisPage.tsx`](../src/features/public/pois/components/ExplorePoisPage.tsx), [`src/features/public/pois/components/PoiDetailPage.tsx`](../src/features/public/pois/components/PoiDetailPage.tsx), [`src/features/public/pois/services/poiProxy.ts`](../src/features/public/pois/services/poiProxy.ts)
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-06](#fe-06). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-54"></a>

### Screen #54 — POI Details

- **Module / description:** POI Discovery. Displays detailed information about a selected Point of Interest.
- **Source / platform:** §3.1.2.2, original #54; `WEB_AND_MOBILE`. §3.1.2.2 Screen #54; §3.1.3 Table 5 name-based authorization; §3.3.3 UC-12.
- **Authorized actors:** Guest, Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-12](#uc-12).
- **BR / MSG trace:** BR-24, BR-34, BR-180 / MSG33, MSG34, MSG46, MSG126, MSG127
- **FE route/page candidates:** `/pois` ([`app/pois/page.tsx`](../app/pois/page.tsx)), `/pois/[id]` ([`app/pois/[id]/page.tsx`](../app/pois/[id]/page.tsx)) **Main component candidates:** [`src/features/public/pois/components/ExplorePoisPage.tsx`](../src/features/public/pois/components/ExplorePoisPage.tsx), [`src/features/public/pois/components/PoiDetailPage.tsx`](../src/features/public/pois/components/PoiDetailPage.tsx), [`src/features/public/pois/services/poiProxy.ts`](../src/features/public/pois/services/poiProxy.ts)
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-06](#fe-06). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-55"></a>

### Screen #55 — Live Trip Navigation

- **Module / description:** Real-Time Navigation. Displays available real-time navigation information for an active itinerary, including current location, route, next waypoint, and trip progress.
- **Source / platform:** §3.1.2.2, original #55; `MOBILE_ONLY`. §3.1.2.2 Screen #55; §3.1.3 Table 5 name-based authorization; §3.3.4 UC-13.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-13](#uc-13).
- **BR / MSG trace:** BR-28, BR-31, BR-35, BR-40 / MSG32, MSG35, MSG36, MSG37, MSG45, MSG46, MSG47, MSG48, MSG126
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-56"></a>

### Screen #56 — Real-Time Trip Alert

- **Module / description:** Real-Time Navigation. Notifies a Traveler about detected conditions that may affect the current trip, such as severe weather, delays, route deviations, or unavailable POIs.
- **Source / platform:** §3.1.2.2, original #56; `MOBILE_ONLY`. §3.1.2.2 Screen #56; §3.1.3 Table 5 name-based authorization; §3.3.5 UC-14.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-14](#uc-14).
- **BR / MSG trace:** BR-29, BR-30, BR-31, BR-32 / MSG38, MSG39, MSG40, MSG41, MSG128
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-57"></a>

### Screen #57 — Re-routing Proposal

- **Module / description:** Real-Time Navigation. Presents a proposed route or itinerary adjustment and allows the Traveler to accept or reject the proposal.
- **Source / platform:** §3.1.2.2, original #57; `MOBILE_ONLY`. §3.1.2.2 Screen #57; §3.1.3 Table 5 name-based authorization; §3.3.6 UC-15.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-15](#uc-15).
- **BR / MSG trace:** BR-25, BR-26, BR-27, BR-31, BR-33 / MSG41, MSG42, MSG43, MSG44, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-58"></a>

### Screen #58 — Travel Groups

- **Module / description:** Travel Group Management. Provides access to shared travel groups associated with the Traveler.
- **Source / platform:** §3.1.2.2, original #58; `MOBILE_ONLY`. §3.1.2.2 Screen #58; §3.1.3 Table 5 name-based authorization; §3.4.1 UC-17.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-17](#uc-17).
- **BR / MSG trace:** BR-41, BR-42, BR-48 / MSG01, MSG54, MSG126, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-59"></a>

### Screen #59 — Create Travel Group

- **Module / description:** Travel Group Management. Allows an authenticated Traveler to create a shared travel group associated with one existing TripMate itinerary owned by the Traveler. The system creates the group, links it to the selected itinerary, and assigns the creating Traveler as the sole Group Host.
- **Source / platform:** §3.1.2.2, original #59; `MOBILE_ONLY`. §3.1.2.2 Screen #59; §3.1.3 Table 5 name-based authorization; §3.4.1 UC-17.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-17](#uc-17).
- **BR / MSG trace:** BR-41, BR-42, BR-48 / MSG01, MSG54, MSG126, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-60"></a>

### Screen #60 — Travel Group Details & Members

- **Module / description:** Travel Group Management. Displays shared travel-group information and the Travelers participating in the selected group.
- **Source / platform:** §3.1.2.2, original #60; `MOBILE_ONLY`. §3.1.2.2 Screen #60; §3.1.3 Table 5 name-based authorization; §3.4.2 UC-18; §3.4.3 UC-19; §3.4.4 UC-20; §3.4.5 UC-21.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-18](#uc-18), [UC-19](#uc-19), [UC-20](#uc-20), [UC-21](#uc-21).
- **BR / MSG trace:** BR-43, BR-44, BR-45, BR-46, BR-48, BR-49, BR-51 / MSG55, MSG59, MSG60, MSG61, MSG126, MSG127, MSG128, MSG129, MSG130
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-61"></a>

### Screen #61 — Invite Group Members

- **Module / description:** Travel Group Management. Displays a supported invitation mechanism that the Group Host can use to invite other Travelers to the shared trip.
- **Source / platform:** §3.1.2.2, original #61; `MOBILE_ONLY`. §3.1.2.2 Screen #61; §3.1.3 Table 5 name-based authorization; §3.4.2 UC-18.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-18](#uc-18).
- **BR / MSG trace:** BR-43, BR-44, BR-46 / MSG55, MSG126, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-62"></a>

### Screen #62 — Remove Group Member Confirmation

- **Module / description:** Travel Group Management. Allows the Group Host to confirm removal of an eligible Traveler from the shared travel group.
- **Source / platform:** §3.1.2.2, original #62; `MOBILE_ONLY`. §3.1.2.2 Screen #62; §3.1.3 Table 5 name-based authorization; §3.4.4 UC-20.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-20](#uc-20).
- **BR / MSG trace:** BR-45, BR-48, BR-51 / MSG59, MSG60, MSG126, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-63"></a>

### Screen #63 — Leave Travel Group Confirmation

- **Module / description:** Travel Group Management. Allows a Traveler to confirm leaving an existing shared travel group according to applicable group rules.
- **Source / platform:** §3.1.2.2, original #63; `MOBILE_ONLY`. §3.1.2.2 Screen #63; §3.1.3 Table 5 name-based authorization; §3.4.5 UC-21.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-21](#uc-21).
- **BR / MSG trace:** BR-48, BR-49, BR-51 / MSG61, MSG127, MSG129, MSG130
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-64"></a>

### Screen #64 — Group Location Sharing Settings

- **Module / description:** Travel Group Management. Allows a Traveler to configure supported location-sharing behavior for a shared travel group.
- **Source / platform:** §3.1.2.2, original #64; `MOBILE_ONLY`. §3.1.2.2 Screen #64; §3.1.3 Table 5 name-based authorization; §3.4.6 UC-22.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-22](#uc-22).
- **BR / MSG trace:** BR-50, BR-51 / MSG46, MSG62, MSG63, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-65"></a>

### Screen #65 — Join Shared Group Trip

- **Module / description:** Travel Group Management. Allows a Traveler to join an existing travel group using a valid invitation code or QR invitation.
- **Source / platform:** §3.1.2.2, original #65; `MOBILE_ONLY`. §3.1.2.2 Screen #65; §3.1.3 Table 5 name-based authorization; §3.4.7 UC-23.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-23](#uc-23).
- **BR / MSG trace:** BR-46, BR-47, BR-48, BR-51 / MSG01, MSG46, MSG56, MSG57, MSG58, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-66"></a>

### Screen #66 — Search Tours

- **Module / description:** Tour Discovery. Allows a Traveler to browse and search publicly available tour packages using supported search and filtering criteria.
- **Source / platform:** §3.1.2.2, original #66; `WEB_AND_MOBILE`. §3.1.2.2 Screen #66; §3.1.3 Table 5 name-based authorization; §3.5.1 UC-24.
- **Authorized actors:** Guest, Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-24](#uc-24).
- **BR / MSG trace:** BR-52, BR-53, BR-54, BR-55, BR-56 / MSG29, MSG64, MSG127
- **FE route/page candidates:** `/tours` ([`app/tours/page.tsx`](../app/tours/page.tsx)), `/tours/[id]` ([`app/tours/[id]/page.tsx`](../app/tours/[id]/page.tsx)) **Main component candidates:** [`src/features/public/tours/components/ExploreToursPage.tsx`](../src/features/public/tours/components/ExploreToursPage.tsx), [`src/features/public/tours/components/TourDetailPage.tsx`](../src/features/public/tours/components/TourDetailPage.tsx), [`src/features/public/tours/components/TourRecommendationsSection.tsx`](../src/features/public/tours/components/TourRecommendationsSection.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-08](#fe-08). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-67"></a>

### Screen #67 — Tour Recommendations

- **Module / description:** Tour Discovery. Displays tour packages recommended by TripMate using supported Traveler preferences, interests, and other recommendation criteria.
- **Source / platform:** §3.1.2.2, original #67; `WEB_AND_MOBILE`. §3.1.2.2 Screen #67; §3.1.3 Table 5 name-based authorization; §3.5.2 UC-25.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-25](#uc-25).
- **BR / MSG trace:** BR-20, BR-56, BR-57, BR-58, BR-60 / MSG64, MSG68, MSG127, MSG183
- **FE route/page candidates:** `/tours` ([`app/tours/page.tsx`](../app/tours/page.tsx)), `/tours/[id]` ([`app/tours/[id]/page.tsx`](../app/tours/[id]/page.tsx)) **Main component candidates:** [`src/features/public/tours/components/ExploreToursPage.tsx`](../src/features/public/tours/components/ExploreToursPage.tsx), [`src/features/public/tours/components/TourDetailPage.tsx`](../src/features/public/tours/components/TourDetailPage.tsx), [`src/features/public/tours/components/TourRecommendationsSection.tsx`](../src/features/public/tours/components/TourRecommendationsSection.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-08](#fe-08). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-68"></a>

### Screen #68 — Tour Details

- **Module / description:** Tour Discovery. Displays detailed information about a selected tour package before booking.
- **Source / platform:** §3.1.2.2, original #68; `WEB_AND_MOBILE`. §3.1.2.2 Screen #68; §3.1.3 Table 5 name-based authorization; §3.5.3 UC-26.
- **Authorized actors:** Guest, Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-26](#uc-26).
- **BR / MSG trace:** BR-54, BR-56, BR-59, BR-60, BR-96 / MSG65, MSG127, MSG128
- **FE route/page candidates:** `/tours` ([`app/tours/page.tsx`](../app/tours/page.tsx)), `/tours/[id]` ([`app/tours/[id]/page.tsx`](../app/tours/[id]/page.tsx)) **Main component candidates:** [`src/features/public/tours/components/ExploreToursPage.tsx`](../src/features/public/tours/components/ExploreToursPage.tsx), [`src/features/public/tours/components/TourDetailPage.tsx`](../src/features/public/tours/components/TourDetailPage.tsx), [`src/features/public/tours/components/TourRecommendationsSection.tsx`](../src/features/public/tours/components/TourRecommendationsSection.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-08](#fe-08). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-69"></a>

### Screen #69 — Tour Booking Confirmation

- **Module / description:** Tour Booking. Allows a Traveler to provide required booking information and confirm creation of a booking for an eligible tour.
- **Source / platform:** §3.1.2.2, original #69; `WEB_AND_MOBILE`. §3.1.2.2 Screen #69; §3.1.3 Table 5 name-based authorization; §3.5.4 UC-27.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-27](#uc-27).
- **BR / MSG trace:** BR-61, BR-62, BR-63, BR-64, BR-65, BR-66, BR-67, BR-68, BR-97, BR-98, BR-99, BR-100, BR-135, BR-154, BR-156 / MSG01, MSG65, MSG77, MSG78, MSG79, MSG100, MSG101, MSG102, MSG103, MSG126, MSG127, MSG169, MSG196
- **FE route/page candidates:** `/tours/[id]/book` ([`app/tours/[id]/book/page.tsx`](../app/tours/[id]/book/page.tsx)), `/bookings/[id]/pay` ([`app/bookings/[id]/pay/page.tsx`](../app/bookings/[id]/pay/page.tsx)), `/checkout/result` ([`app/checkout/result/page.tsx`](../app/checkout/result/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx)), `/account/tickets/[ticketId]` ([`app/account/tickets/[ticketId]/page.tsx`](../app/account/tickets/[ticketId]/page.tsx)) **Main component candidates:** [`src/features/bookings/components/TourBookingPage.tsx`](../src/features/bookings/components/TourBookingPage.tsx), [`src/features/bookings/components/PaymentHandoffPage.tsx`](../src/features/bookings/components/PaymentHandoffPage.tsx), [`src/features/bookings/components/CheckoutResultPage.tsx`](../src/features/bookings/components/CheckoutResultPage.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/bookings/services/bookingBffAuth.ts`](../src/features/bookings/services/bookingBffAuth.ts) Evidence: [FE-09](#fe-09). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-70"></a>

### Screen #70 — Electronic Payment

- **Module / description:** Payment. Provides the supported TripMate payment entry or confirmation process and connects the booking flow to an available external Payment Gateway.
- **Source / platform:** §3.1.2.2, original #70; `WEB_AND_MOBILE`. §3.1.2.2 Screen #70; §3.1.3 Table 5 name-based authorization; §3.5.5 UC-28.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-28](#uc-28).
- **BR / MSG trace:** BR-68, BR-69, BR-70, BR-71, BR-72, BR-73, BR-74, BR-75, BR-79, BR-80, BR-81, BR-154, BR-159, BR-179 / MSG80, MSG81, MSG82, MSG85, MSG86, MSG87, MSG88, MSG89, MSG91, MSG92, MSG126, MSG169, MSG187
- **FE route/page candidates:** `/tours/[id]/book` ([`app/tours/[id]/book/page.tsx`](../app/tours/[id]/book/page.tsx)), `/bookings/[id]/pay` ([`app/bookings/[id]/pay/page.tsx`](../app/bookings/[id]/pay/page.tsx)), `/checkout/result` ([`app/checkout/result/page.tsx`](../app/checkout/result/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx)), `/account/tickets/[ticketId]` ([`app/account/tickets/[ticketId]/page.tsx`](../app/account/tickets/[ticketId]/page.tsx)) **Main component candidates:** [`src/features/bookings/components/TourBookingPage.tsx`](../src/features/bookings/components/TourBookingPage.tsx), [`src/features/bookings/components/PaymentHandoffPage.tsx`](../src/features/bookings/components/PaymentHandoffPage.tsx), [`src/features/bookings/components/CheckoutResultPage.tsx`](../src/features/bookings/components/CheckoutResultPage.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/bookings/services/bookingBffAuth.ts`](../src/features/bookings/services/bookingBffAuth.ts) Evidence: [FE-09](#fe-09). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-71"></a>

### Screen #71 — My Tour Bookings

- **Module / description:** Tour Booking. Displays tour bookings associated with the Traveler and provides access to booking-related information.
- **Source / platform:** §3.1.2.2, original #71; `WEB_AND_MOBILE`. §3.1.2.2 Screen #71; §3.1.3 Table 5 name-based authorization; §3.5.6 UC-29.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-29](#uc-29).
- **BR / MSG trace:** BR-82, BR-83, BR-84, BR-85, BR-86, BR-90 / MSG74, MSG93, MSG95, MSG98, MSG99, MSG126, MSG127, MSG187
- **FE route/page candidates:** `/tours/[id]/book` ([`app/tours/[id]/book/page.tsx`](../app/tours/[id]/book/page.tsx)), `/bookings/[id]/pay` ([`app/bookings/[id]/pay/page.tsx`](../app/bookings/[id]/pay/page.tsx)), `/checkout/result` ([`app/checkout/result/page.tsx`](../app/checkout/result/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx)), `/account/tickets/[ticketId]` ([`app/account/tickets/[ticketId]/page.tsx`](../app/account/tickets/[ticketId]/page.tsx)) **Main component candidates:** [`src/features/bookings/components/TourBookingPage.tsx`](../src/features/bookings/components/TourBookingPage.tsx), [`src/features/bookings/components/PaymentHandoffPage.tsx`](../src/features/bookings/components/PaymentHandoffPage.tsx), [`src/features/bookings/components/CheckoutResultPage.tsx`](../src/features/bookings/components/CheckoutResultPage.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/bookings/services/bookingBffAuth.ts`](../src/features/bookings/services/bookingBffAuth.ts) Evidence: [FE-09](#fe-09). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-72"></a>

### Screen #72 — Booking Details & QR E-ticket

- **Module / description:** Tour Ticket. Displays booking information and the QR e-ticket associated with an eligible tour booking.
- **Source / platform:** §3.1.2.2, original #72; `WEB_AND_MOBILE`. §3.1.2.2 Screen #72; §3.1.3 Table 5 name-based authorization; §3.5.6 UC-29.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-29](#uc-29).
- **BR / MSG trace:** BR-82, BR-83, BR-84, BR-85, BR-86, BR-90 / MSG74, MSG93, MSG95, MSG98, MSG99, MSG126, MSG127, MSG187
- **FE route/page candidates:** `/tours/[id]/book` ([`app/tours/[id]/book/page.tsx`](../app/tours/[id]/book/page.tsx)), `/bookings/[id]/pay` ([`app/bookings/[id]/pay/page.tsx`](../app/bookings/[id]/pay/page.tsx)), `/checkout/result` ([`app/checkout/result/page.tsx`](../app/checkout/result/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx)), `/account/tickets/[ticketId]` ([`app/account/tickets/[ticketId]/page.tsx`](../app/account/tickets/[ticketId]/page.tsx)) **Main component candidates:** [`src/features/bookings/components/TourBookingPage.tsx`](../src/features/bookings/components/TourBookingPage.tsx), [`src/features/bookings/components/PaymentHandoffPage.tsx`](../src/features/bookings/components/PaymentHandoffPage.tsx), [`src/features/bookings/components/CheckoutResultPage.tsx`](../src/features/bookings/components/CheckoutResultPage.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/bookings/services/bookingBffAuth.ts`](../src/features/bookings/services/bookingBffAuth.ts) Evidence: [FE-09](#fe-09). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-73"></a>

### Screen #73 — Confirm Cancellation Modal

- **Module / description:** Tour Booking. Confirmation dialogue allowing travelers to cancel an eligible booking and review the applicable refund policy details.
- **Source / platform:** §3.1.2.2, original #73; `WEB_AND_MOBILE`. §3.1.2.2 Screen #73; §3.1.3 Table 5 name-based authorization; §3.8.4.2 UC-41.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-41](#uc-41).
- **BR / MSG trace:** BR-66, BR-76, BR-86, BR-105, BR-106, BR-107, BR-135, BR-136, BR-137, BR-138, BR-143, BR-155, BR-164 / MSG82, MSG126, MSG127, MSG131, MSG132, MSG133, MSG134, MSG135, MSG136, MSG170
- **FE route/page candidates:** `/partner/bookings` ([`app/partner/bookings/page.tsx`](../app/partner/bookings/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx)) **Main component candidates:** [`src/features/operator/bookings/components/CancelBookingDialog.tsx`](../src/features/operator/bookings/components/CancelBookingDialog.tsx), [`src/features/operator/bookings/services/operatorBookingService.ts`](../src/features/operator/bookings/services/operatorBookingService.ts), [`src/features/bookings/components/BookingCancelAction.tsx`](../src/features/bookings/components/BookingCancelAction.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/bookings/guards/BookingRouteGuard.tsx`](../src/features/operator/bookings/guards/BookingRouteGuard.tsx) Evidence: [FE-16](#fe-16). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-74"></a>

### Screen #74 — Commercial Services Search & List

- **Module / description:** Commercial Services. Allows a Traveler to browse and search supported commercial travel services available through TripMate.
- **Source / platform:** §3.1.2.2, original #74; `MOBILE_ONLY`. §3.1.2.2 Screen #74; §3.1.3 Table 5 name-based authorization; §3.6.1 UC-30.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-30](#uc-30).
- **BR / MSG trace:** BR-34, BR-55, BR-87, BR-88 / MSG34, MSG75, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-75"></a>

### Screen #75 — Commercial Service Details & Booking

- **Module / description:** Commercial Services. Displays supported commercial-service information and allows an eligible service booking to be created.
- **Source / platform:** §3.1.2.2, original #75; `MOBILE_ONLY`. §3.1.2.2 Screen #75; §3.1.3 Table 5 name-based authorization; §3.6.1 UC-30; §3.6.2 UC-31.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-30](#uc-30), [UC-31](#uc-31).
- **BR / MSG trace:** BR-34, BR-55, BR-63, BR-87, BR-88, BR-89, BR-194, BR-196 / MSG01, MSG34, MSG69, MSG70, MSG71, MSG72, MSG73, MSG75, MSG76, MSG127, MSG186, MSG205
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-76"></a>

### Screen #76 — Trip History

- **Module / description:** Trip History. Displays previous trips associated with the Traveler account and available historical trip information.
- **Source / platform:** §3.1.2.2, original #76; `WEB_AND_MOBILE`. §3.1.2.2 Screen #76; §3.1.3 Table 5 name-based authorization; §3.7.1 UC-32.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-32](#uc-32).
- **BR / MSG trace:** BR-52, BR-90, BR-91, BR-92 / MSG29, MSG52, MSG127, MSG128
- **FE route/page candidates:** `/account/trips` ([`app/account/trips/page.tsx`](../app/account/trips/page.tsx)), `/account/trips/[id]/review` ([`app/account/trips/[id]/review/page.tsx`](../app/account/trips/[id]/review/page.tsx)), `/account/reviews/[kind]/[id]` ([`app/account/reviews/[kind]/[id]/page.tsx`](../app/account/reviews/[kind]/[id]/page.tsx)) **Main component candidates:** [`src/features/trips/components/TripHistoryPage.tsx`](../src/features/trips/components/TripHistoryPage.tsx), [`src/features/trips/services/tripHistoryProxy.ts`](../src/features/trips/services/tripHistoryProxy.ts), [`src/features/trips/services/tripReviewBff.ts`](../src/features/trips/services/tripReviewBff.ts)
- **Guard / evidence:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx) Evidence: [FE-11](#fe-11). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-77"></a>

### Screen #77 — Trip Review & Rating

- **Module / description:** Reviews & Feedback. Allows an eligible Traveler to submit ratings and feedback after completing a supported trip.
- **Source / platform:** §3.1.2.2, original #77; `WEB_AND_MOBILE`. §3.1.2.2 Screen #77; §3.1.3 Table 5 name-based authorization; §3.7.2 UC-33.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-33](#uc-33).
- **BR / MSG trace:** BR-16, BR-91, BR-92, BR-93, BR-94, BR-95, BR-96 / MSG01, MSG19, MSG50, MSG51, MSG52, MSG53, MSG66, MSG67, MSG126, MSG127
- **FE route/page candidates:** `/account/trips` ([`app/account/trips/page.tsx`](../app/account/trips/page.tsx)), `/account/trips/[id]/review` ([`app/account/trips/[id]/review/page.tsx`](../app/account/trips/[id]/review/page.tsx)), `/account/reviews/[kind]/[id]` ([`app/account/reviews/[kind]/[id]/page.tsx`](../app/account/reviews/[kind]/[id]/page.tsx)) **Main component candidates:** [`src/features/trips/components/TripHistoryPage.tsx`](../src/features/trips/components/TripHistoryPage.tsx), [`src/features/trips/services/tripHistoryProxy.ts`](../src/features/trips/services/tripHistoryProxy.ts), [`src/features/trips/services/tripReviewBff.ts`](../src/features/trips/services/tripReviewBff.ts)
- **Guard / evidence:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx) Evidence: [FE-11](#fe-11). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-78"></a>

### Screen #78 — Tour Operator Dashboard

- **Module / description:** Tour Operator Dashboard. Provides a Tour Operator with access to tour management, customer bookings, check-in, revenue, and settlement functions.
- **Source / platform:** §3.1.2.2, original #78; `WEB_AND_MOBILE`. §3.1.2.2 Screen #78; §3.1.3 Table 5 name-based authorization; §1 / §2.1 workspace ownership.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** No dedicated numbered UC; workspace/navigation surface only..
- **BR / MSG trace:** None explicitly listed at this traceability level; see linked UC rules. / None explicitly listed at this traceability level; see linked UC rules.
- **FE route/page candidates:** `/partner` ([`app/partner/page.tsx`](../app/partner/page.tsx)) **Main component candidates:** [`src/features/operator/dashboard/OperatorDashboard.tsx`](../src/features/operator/dashboard/OperatorDashboard.tsx)
- **Guard / evidence:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx), [`src/features/operator/access/partnerRouteDecision.ts`](../src/features/operator/access/partnerRouteDecision.ts) Evidence: Screen-specific paths above.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/operator/access/PartnerRouteGuard.test.tsx`](../src/features/operator/access/PartnerRouteGuard.test.tsx)
- **Status / issues:** `NOT_VERIFIED`. Workspace dashboard/navigation screen, no single explicit dedicated UC; actions retain individual UC platform/role restrictions. Dashboard mentions check-in but QR scanning remains mobile-only UC-43. Actual operator dashboard composed by app/partner/page.tsx behind approved operator guard; route availability not proof of all operational metric compliance. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-79"></a>

### Screen #79 — Tour Operator Profile

- **Module / description:** Tour Operator Profile. Allows a Tour Operator to view and update supported business-profile information.
- **Source / platform:** §3.1.2.2, original #79; `WEB_AND_MOBILE`. §3.1.2.2 Screen #79; §3.1.3 Table 5 name-based authorization; §3.8.1 UC-34.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-34](#uc-34).
- **BR / MSG trace:** BR-07, BR-08, BR-16, BR-17 / MSG01, MSG02, MSG19, MSG121, MSG126, MSG127
- **FE route/page candidates:** `/partner/profile` ([`app/partner/profile/page.tsx`](../app/partner/profile/page.tsx)) **Main component candidates:** [`src/features/operator/profile/components/OperatorProfilePage.tsx`](../src/features/operator/profile/components/OperatorProfilePage.tsx), [`src/features/operator/profile/components/OperatorProfileView.tsx`](../src/features/operator/profile/components/OperatorProfileView.tsx), [`src/features/operator/profile/services/operatorProfileService.ts`](../src/features/operator/profile/services/operatorProfileService.ts)
- **Guard / evidence:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx) Evidence: [FE-12](#fe-12). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-80"></a>

### Screen #80 — Tour Packages List

- **Module / description:** Tour Package Management. Displays tour packages owned by the Tour Operator and their current lifecycle or approval states.
- **Source / platform:** §3.1.2.2, original #80; `WEB_AND_MOBILE`. §3.1.2.2 Screen #80; §3.1.3 Table 5 name-based authorization; §3.8.2.1 UC-35; §3.8.2.2 UC-36; §3.8.2.3 UC-37.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-35](#uc-35), [UC-36](#uc-36), [UC-37](#uc-37).
- **BR / MSG trace:** BR-22, BR-56, BR-61, BR-79, BR-101, BR-102, BR-103, BR-185 / MSG01, MSG19, MSG29, MSG108, MSG109, MSG110, MSG111, MSG122, MSG126, MSG127, MSG143
- **FE route/page candidates:** `/partner/tours` ([`app/partner/tours/page.tsx`](../app/partner/tours/page.tsx)), `/partner/tours/new` ([`app/partner/tours/new/page.tsx`](../app/partner/tours/new/page.tsx)), `/partner/tours/[id]/edit` ([`app/partner/tours/[id]/edit/page.tsx`](../app/partner/tours/[id]/edit/page.tsx)), `/partner/tours/[id]/submit` ([`app/partner/tours/[id]/submit/page.tsx`](../app/partner/tours/[id]/submit/page.tsx)) **Main component candidates:** [`src/features/operator/tours/components/CreateTourPackageView.tsx`](../src/features/operator/tours/components/CreateTourPackageView.tsx), [`src/features/operator/tours/components/UpdateTourPackageView.tsx`](../src/features/operator/tours/components/UpdateTourPackageView.tsx), [`src/features/operator/tours/components/SubmitTourApprovalView.tsx`](../src/features/operator/tours/components/SubmitTourApprovalView.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/tours/guards/TourRouteGuard.tsx`](../src/features/operator/tours/guards/TourRouteGuard.tsx) Evidence: [FE-13](#fe-13). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-81"></a>

### Screen #81 — Create Tour Package

- **Module / description:** Tour Package Management. Allows a Tour Operator to create a new tour package by providing the required itinerary, POIs, pricing, capacity, and other supported tour information.
- **Source / platform:** §3.1.2.2, original #81; `WEB_AND_MOBILE`. §3.1.2.2 Screen #81; §3.1.3 Table 5 name-based authorization; §3.8.2.1 UC-35.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-35](#uc-35).
- **BR / MSG trace:** BR-22, BR-56, BR-79, BR-101, BR-102 / MSG01, MSG19, MSG29, MSG108, MSG126, MSG127, MSG143
- **FE route/page candidates:** `/partner/tours` ([`app/partner/tours/page.tsx`](../app/partner/tours/page.tsx)), `/partner/tours/new` ([`app/partner/tours/new/page.tsx`](../app/partner/tours/new/page.tsx)), `/partner/tours/[id]/edit` ([`app/partner/tours/[id]/edit/page.tsx`](../app/partner/tours/[id]/edit/page.tsx)), `/partner/tours/[id]/submit` ([`app/partner/tours/[id]/submit/page.tsx`](../app/partner/tours/[id]/submit/page.tsx)) **Main component candidates:** [`src/features/operator/tours/components/CreateTourPackageView.tsx`](../src/features/operator/tours/components/CreateTourPackageView.tsx), [`src/features/operator/tours/components/UpdateTourPackageView.tsx`](../src/features/operator/tours/components/UpdateTourPackageView.tsx), [`src/features/operator/tours/components/SubmitTourApprovalView.tsx`](../src/features/operator/tours/components/SubmitTourApprovalView.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/tours/guards/TourRouteGuard.tsx`](../src/features/operator/tours/guards/TourRouteGuard.tsx) Evidence: [FE-13](#fe-13). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-82"></a>

### Screen #82 — Update Tour Package

- **Module / description:** Tour Package Management. Allows a Tour Operator to load an existing eligible tour package and modify supported tour information.
- **Source / platform:** §3.1.2.2, original #82; `WEB_AND_MOBILE`. §3.1.2.2 Screen #82; §3.1.3 Table 5 name-based authorization; §3.8.2.2 UC-36.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-36](#uc-36).
- **BR / MSG trace:** BR-22, BR-61, BR-101, BR-102, BR-103 / MSG01, MSG29, MSG109, MSG110, MSG122, MSG126, MSG127, MSG143
- **FE route/page candidates:** `/partner/tours` ([`app/partner/tours/page.tsx`](../app/partner/tours/page.tsx)), `/partner/tours/new` ([`app/partner/tours/new/page.tsx`](../app/partner/tours/new/page.tsx)), `/partner/tours/[id]/edit` ([`app/partner/tours/[id]/edit/page.tsx`](../app/partner/tours/[id]/edit/page.tsx)), `/partner/tours/[id]/submit` ([`app/partner/tours/[id]/submit/page.tsx`](../app/partner/tours/[id]/submit/page.tsx)) **Main component candidates:** [`src/features/operator/tours/components/CreateTourPackageView.tsx`](../src/features/operator/tours/components/CreateTourPackageView.tsx), [`src/features/operator/tours/components/UpdateTourPackageView.tsx`](../src/features/operator/tours/components/UpdateTourPackageView.tsx), [`src/features/operator/tours/components/SubmitTourApprovalView.tsx`](../src/features/operator/tours/components/SubmitTourApprovalView.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/tours/guards/TourRouteGuard.tsx`](../src/features/operator/tours/guards/TourRouteGuard.tsx) Evidence: [FE-13](#fe-13). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-83"></a>

### Screen #83 — Tour Preview & Submit for Approval

- **Module / description:** Tour Package Management. Allows a Tour Operator to review a prepared or updated tour package and submit or resubmit it for Staff approval.
- **Source / platform:** §3.1.2.2, original #83; `WEB_AND_MOBILE`. §3.1.2.2 Screen #83; §3.1.3 Table 5 name-based authorization; §3.8.2.3 UC-37.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-37](#uc-37).
- **BR / MSG trace:** BR-56, BR-101, BR-102, BR-103, BR-185 / MSG01, MSG110, MSG111, MSG122, MSG126, MSG127
- **FE route/page candidates:** `/partner/tours` ([`app/partner/tours/page.tsx`](../app/partner/tours/page.tsx)), `/partner/tours/new` ([`app/partner/tours/new/page.tsx`](../app/partner/tours/new/page.tsx)), `/partner/tours/[id]/edit` ([`app/partner/tours/[id]/edit/page.tsx`](../app/partner/tours/[id]/edit/page.tsx)), `/partner/tours/[id]/submit` ([`app/partner/tours/[id]/submit/page.tsx`](../app/partner/tours/[id]/submit/page.tsx)) **Main component candidates:** [`src/features/operator/tours/components/CreateTourPackageView.tsx`](../src/features/operator/tours/components/CreateTourPackageView.tsx), [`src/features/operator/tours/components/UpdateTourPackageView.tsx`](../src/features/operator/tours/components/UpdateTourPackageView.tsx), [`src/features/operator/tours/components/SubmitTourApprovalView.tsx`](../src/features/operator/tours/components/SubmitTourApprovalView.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/tours/guards/TourRouteGuard.tsx`](../src/features/operator/tours/guards/TourRouteGuard.tsx) Evidence: [FE-13](#fe-13). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-84"></a>

### Screen #84 — Promotional Coupons List

- **Module / description:** Coupon Management. Displays promotional coupons created by the Tour Operator and their current configuration or status.
- **Source / platform:** §3.1.2.2, original #84; `WEB_AND_MOBILE`. §3.1.2.2 Screen #84; §3.1.3 Table 5 name-based authorization; §3.8.3.1 UC-38; §3.8.3.2 UC-39.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-38](#uc-38), [UC-39](#uc-39).
- **BR / MSG trace:** BR-97, BR-98, BR-100, BR-102, BR-178, BR-184 / MSG01, MSG29, MSG112, MSG113, MSG114, MSG126, MSG127, MSG143
- **FE route/page candidates:** `/partner/coupons` ([`app/partner/coupons/page.tsx`](../app/partner/coupons/page.tsx)), `/partner/coupons/create` ([`app/partner/coupons/create/page.tsx`](../app/partner/coupons/create/page.tsx)), `/partner/coupons/[id]/edit` ([`app/partner/coupons/[id]/edit/page.tsx`](../app/partner/coupons/[id]/edit/page.tsx)) **Main component candidates:** [`src/features/operator/coupons/components/CreateCouponForm.tsx`](../src/features/operator/coupons/components/CreateCouponForm.tsx), [`src/features/operator/coupons/components/UpdateCouponView.tsx`](../src/features/operator/coupons/components/UpdateCouponView.tsx), [`src/features/operator/coupons/services/couponApi.ts`](../src/features/operator/coupons/services/couponApi.ts)
- **Guard / evidence:** [`src/features/operator/coupons/guards/CouponRouteGuard.tsx`](../src/features/operator/coupons/guards/CouponRouteGuard.tsx) Evidence: [FE-14](#fe-14). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-85"></a>

### Screen #85 — Create Coupon

- **Module / description:** Coupon Management. Allows a Tour Operator to create a new promotional coupon by providing supported discount, validity, usage, and applicable-tour information.
- **Source / platform:** §3.1.2.2, original #85; `WEB_AND_MOBILE`. §3.1.2.2 Screen #85; §3.1.3 Table 5 name-based authorization; §3.8.3.1 UC-38.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-38](#uc-38).
- **BR / MSG trace:** BR-97, BR-98, BR-100, BR-102, BR-184 / MSG01, MSG29, MSG112, MSG113, MSG126, MSG127, MSG143
- **FE route/page candidates:** `/partner/coupons` ([`app/partner/coupons/page.tsx`](../app/partner/coupons/page.tsx)), `/partner/coupons/create` ([`app/partner/coupons/create/page.tsx`](../app/partner/coupons/create/page.tsx)), `/partner/coupons/[id]/edit` ([`app/partner/coupons/[id]/edit/page.tsx`](../app/partner/coupons/[id]/edit/page.tsx)) **Main component candidates:** [`src/features/operator/coupons/components/CreateCouponForm.tsx`](../src/features/operator/coupons/components/CreateCouponForm.tsx), [`src/features/operator/coupons/components/UpdateCouponView.tsx`](../src/features/operator/coupons/components/UpdateCouponView.tsx), [`src/features/operator/coupons/services/couponApi.ts`](../src/features/operator/coupons/services/couponApi.ts)
- **Guard / evidence:** [`src/features/operator/coupons/guards/CouponRouteGuard.tsx`](../src/features/operator/coupons/guards/CouponRouteGuard.tsx) Evidence: [FE-14](#fe-14). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-86"></a>

### Screen #86 — Update Coupon

- **Module / description:** Coupon Management. Allows a Tour Operator to load and modify an eligible existing promotional coupon.
- **Source / platform:** §3.1.2.2, original #86; `WEB_AND_MOBILE`. §3.1.2.2 Screen #86; §3.1.3 Table 5 name-based authorization; §3.8.3.2 UC-39.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-39](#uc-39).
- **BR / MSG trace:** BR-97, BR-98, BR-100, BR-102, BR-178 / MSG01, MSG29, MSG114, MSG126, MSG127, MSG143
- **FE route/page candidates:** `/partner/coupons` ([`app/partner/coupons/page.tsx`](../app/partner/coupons/page.tsx)), `/partner/coupons/create` ([`app/partner/coupons/create/page.tsx`](../app/partner/coupons/create/page.tsx)), `/partner/coupons/[id]/edit` ([`app/partner/coupons/[id]/edit/page.tsx`](../app/partner/coupons/[id]/edit/page.tsx)) **Main component candidates:** [`src/features/operator/coupons/components/CreateCouponForm.tsx`](../src/features/operator/coupons/components/CreateCouponForm.tsx), [`src/features/operator/coupons/components/UpdateCouponView.tsx`](../src/features/operator/coupons/components/UpdateCouponView.tsx), [`src/features/operator/coupons/services/couponApi.ts`](../src/features/operator/coupons/services/couponApi.ts)
- **Guard / evidence:** [`src/features/operator/coupons/guards/CouponRouteGuard.tsx`](../src/features/operator/coupons/guards/CouponRouteGuard.tsx) Evidence: [FE-14](#fe-14). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-87"></a>

### Screen #87 — Customer Bookings List

- **Module / description:** Booking Management. Displays customer bookings associated with tours owned by the Tour Operator.
- **Source / platform:** §3.1.2.2, original #87; `WEB_AND_MOBILE`. §3.1.2.2 Screen #87; §3.1.3 Table 5 name-based authorization; §3.8.4.1 UC-40.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-40](#uc-40).
- **BR / MSG trace:** BR-52, BR-77, BR-105 / MSG29, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/partner/bookings` ([`app/partner/bookings/page.tsx`](../app/partner/bookings/page.tsx)) **Main component candidates:** [`src/features/operator/bookings/components/OperatorBookingListView.tsx`](../src/features/operator/bookings/components/OperatorBookingListView.tsx), [`src/features/operator/bookings/components/BookingDetailPanel.tsx`](../src/features/operator/bookings/components/BookingDetailPanel.tsx), [`src/features/operator/bookings/services/operatorBookingLiveClient.ts`](../src/features/operator/bookings/services/operatorBookingLiveClient.ts)
- **Guard / evidence:** [`src/features/operator/bookings/guards/BookingRouteGuard.tsx`](../src/features/operator/bookings/guards/BookingRouteGuard.tsx) Evidence: [FE-15](#fe-15). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-88"></a>

### Screen #88 — Booking Details & Passenger Manifest

- **Module / description:** Booking Management. Displays detailed customer booking information and the participants associated with the selected tour booking.
- **Source / platform:** §3.1.2.2, original #88; `WEB_AND_MOBILE`. §3.1.2.2 Screen #88; §3.1.3 Table 5 name-based authorization; §3.8.4.1 UC-40.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-40](#uc-40).
- **BR / MSG trace:** BR-52, BR-77, BR-105 / MSG29, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/partner/bookings` ([`app/partner/bookings/page.tsx`](../app/partner/bookings/page.tsx)) **Main component candidates:** [`src/features/operator/bookings/components/OperatorBookingListView.tsx`](../src/features/operator/bookings/components/OperatorBookingListView.tsx), [`src/features/operator/bookings/components/BookingDetailPanel.tsx`](../src/features/operator/bookings/components/BookingDetailPanel.tsx), [`src/features/operator/bookings/services/operatorBookingLiveClient.ts`](../src/features/operator/bookings/services/operatorBookingLiveClient.ts)
- **Guard / evidence:** [`src/features/operator/bookings/guards/BookingRouteGuard.tsx`](../src/features/operator/bookings/guards/BookingRouteGuard.tsx) Evidence: [FE-15](#fe-15). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-89"></a>

### Screen #89 — Cancel Tour Booking

- **Module / description:** Booking Management. Allows a Traveler to cancel an eligible booking they own, or a Tour Operator to cancel an eligible customer booking on a tour package owned by that operator, according to the CancellationPolicySnapshot and applicable booking rules. The Tour Operator uses this screen on the web application only.
- **Source / platform:** §3.1.2.2, original #89; `WEB_AND_MOBILE`. §3.1.2.2 Screen #89; §3.1.3 Table 5 name-based authorization; §3.8.4.2 UC-41. Traveler shared; Tour Operator cancellation WEB_ONLY (§3.8.4.2).
- **Authorized actors:** Traveler, Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-41](#uc-41).
- **BR / MSG trace:** BR-66, BR-76, BR-86, BR-105, BR-106, BR-107, BR-135, BR-136, BR-137, BR-138, BR-143, BR-155, BR-164 / MSG82, MSG126, MSG127, MSG131, MSG132, MSG133, MSG134, MSG135, MSG136, MSG170
- **FE route/page candidates:** `/partner/bookings` ([`app/partner/bookings/page.tsx`](../app/partner/bookings/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx)) **Main component candidates:** [`src/features/operator/bookings/components/CancelBookingDialog.tsx`](../src/features/operator/bookings/components/CancelBookingDialog.tsx), [`src/features/operator/bookings/services/operatorBookingService.ts`](../src/features/operator/bookings/services/operatorBookingService.ts), [`src/features/bookings/components/BookingCancelAction.tsx`](../src/features/bookings/components/BookingCancelAction.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/bookings/guards/BookingRouteGuard.tsx`](../src/features/operator/bookings/guards/BookingRouteGuard.tsx) Evidence: [FE-16](#fe-16). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-90"></a>

### Screen #90 — Confirm Booking Refund

- **Module / description:** Booking Management. Allows a Tour Operator to confirm the refund of a booking whose settlement was already transferred, view its refund share and return deadline, and report the bank transfer reference of the returned share (UC-42).
- **Source / platform:** §3.1.2.2, original #90; `WEB_AND_MOBILE`. §3.1.2.2 Screen #90; §3.1.3 Table 5 name-based authorization; §3.8.4.3 UC-42.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-42](#uc-42).
- **BR / MSG trace:** BR-130, BR-139, BR-143, BR-144, BR-158, BR-168, BR-175, BR-186, BR-187, BR-188, BR-189 / MSG126, MSG127, MSG136, MSG171, MSG172, MSG173, MSG197, MSG198
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-17](#fe-17). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. Screen description says settlement already transferred; §3.8.4.3 also covers zero-share case when none transferred. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-91"></a>

### Screen #91 — Tour Participant QR Check-in Scanner

- **Module / description:** Tour Check-in. Allows a Tour Operator to scan a Traveler’s QR e-ticket, validate the associated booking, and record the Traveler as checked in when the ticket is eligible.
- **Source / platform:** §3.1.2.2, original #91; `MOBILE_ONLY`. §3.1.2.2 Screen #91; §3.1.3 Table 5 name-based authorization; §3.8.4.4 UC-43.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-43](#uc-43).
- **BR / MSG trace:** BR-82, BR-83, BR-84, BR-85, BR-86, BR-108 / MSG46, MSG74, MSG94, MSG95, MSG96, MSG97, MSG98, MSG99, MSG126, MSG127
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: No matching production module in the baseline route/feature inventory.. Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-92"></a>

### Screen #92 — Revenue & Analytics

- **Module / description:** Revenue & Reporting. Displays available revenue and financial information associated with the Tour Operator’s activities.
- **Source / platform:** §3.1.2.2, original #92; `CONFLICT_REQUIRES_APPROVAL`. §3.1.2.2 Screen #92; §3.1.3 Table 5 name-based authorization; §3.8.5.1 UC-44.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-44](#uc-44).
- **BR / MSG trace:** BR-105, BR-109, BR-140, BR-173 / MSG29, MSG115, MSG126, MSG127, MSG128
- **FE route/page candidates:** `/partner/revenue` ([`app/partner/revenue/page.tsx`](../app/partner/revenue/page.tsx)) **Main component candidates:** [`src/features/operator/finance/components/revenue/OperatorRevenueView.tsx`](../src/features/operator/finance/components/revenue/OperatorRevenueView.tsx), [`src/features/operator/finance/components/revenue/ExportRevenueDialog.tsx`](../src/features/operator/finance/components/revenue/ExportRevenueDialog.tsx), [`src/features/operator/finance/components/revenue/ExportHistoryPanel.tsx`](../src/features/operator/finance/components/revenue/ExportHistoryPanel.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx) Evidence: [FE-19](#fe-19). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `AMBIGUOUS_REQUIREMENT`. GAP-06: 09/11 change log says UC-44/45 web-only; §1/§2.1 expressly include revenue/export on both. Detailed interface Next.js; unresolved approval evidence. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-93"></a>

### Screen #93 — Export Revenue Report

- **Module / description:** Revenue & Reporting. Allows a Tour Operator to configure and export available revenue information using supported reporting criteria and output formats.
- **Source / platform:** §3.1.2.2, original #93; `CONFLICT_REQUIRES_APPROVAL`. §3.1.2.2 Screen #93; §3.1.3 Table 5 name-based authorization; §3.8.5.2 UC-45.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-45](#uc-45).
- **BR / MSG trace:** BR-105, BR-109, BR-110 / MSG01, MSG106, MSG116, MSG117, MSG128
- **FE route/page candidates:** `/partner/revenue` ([`app/partner/revenue/page.tsx`](../app/partner/revenue/page.tsx)) **Main component candidates:** [`src/features/operator/finance/components/revenue/OperatorRevenueView.tsx`](../src/features/operator/finance/components/revenue/OperatorRevenueView.tsx), [`src/features/operator/finance/components/revenue/ExportRevenueDialog.tsx`](../src/features/operator/finance/components/revenue/ExportRevenueDialog.tsx), [`src/features/operator/finance/components/revenue/ExportHistoryPanel.tsx`](../src/features/operator/finance/components/revenue/ExportHistoryPanel.tsx) Additional service/component paths in linked evidence.
- **Guard / evidence:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx) Evidence: [FE-19](#fe-19). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `AMBIGUOUS_REQUIREMENT`. GAP-06: 09/11 change log says UC-44/45 web-only; §1/§2.1 expressly include revenue/export on both. Detailed interface Next.js; unresolved approval evidence. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-94"></a>

### Screen #94 — Payout Settlement History

- **Module / description:** Payout Management. Displays the Tour Operator’s per-booking settlements (amount, status, transfer time and reference) and any pending debt being offset (BR-144).
- **Source / platform:** §3.1.2.2, original #94; `WEB_AND_MOBILE`. §3.1.2.2 Screen #94; §3.1.3 Table 5 name-based authorization; §3.10.4 UC-71; §3.10.5 UC-74.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-71](#uc-71), [UC-74](#uc-74).
- **BR / MSG trace:** BR-139, BR-140, BR-141, BR-142, BR-144, BR-145, BR-146, BR-160, BR-172, BR-177, BR-188 / MSG145, MSG146, MSG175, MSG176
- **FE route/page candidates:** `/partner/payout-settlements` ([`app/partner/payout-settlements/page.tsx`](../app/partner/payout-settlements/page.tsx)) **Main component candidates:** [`src/features/operator/payout-settlements/PayoutSettlementHistoryScreen.tsx`](../src/features/operator/payout-settlements/PayoutSettlementHistoryScreen.tsx), [`src/features/operator/payout-settlements/payoutSettlementsProxy.ts`](../src/features/operator/payout-settlements/payoutSettlementsProxy.ts)
- **Guard / evidence:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx) Evidence: Screen-specific paths above; [FE-33](#fe-33), [FE-39](#fe-39). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/operator/payout-settlements/PayoutSettlementHistoryScreen.test.tsx`](../src/features/operator/payout-settlements/PayoutSettlementHistoryScreen.test.tsx), [`src/features/operator/payout-settlements/payoutSettlementsProxy.test.ts`](../src/features/operator/payout-settlements/payoutSettlementsProxy.test.ts)
- **Status / issues:** `NOT_VERIFIED`. GAP-03: Tour Operator own settlement-history surface; UC-71/UC-74 results only. UC-72 authorizes Staff/Administrator #28, not this screen. Dedicated history-UC mapping not explicit. Own-operator payout history exists. Distinct from UC72 Staff/Admin records and from /partner/payouts beneficiary bank maintenance; settlement execution NOT_VERIFIED. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-95"></a>

### Screen #95 — Complaint Form

- **Module / description:** Post-Trip Complaint. Allows a Traveler to submit a post-trip complaint with a reason and evidence files (UC-68).
- **Source / platform:** §3.1.2.2, original #95; `WEB_AND_MOBILE`. §3.1.2.2 Screen #95; §3.1.3 Table 5 name-based authorization; §3.8.6.1 UC-68.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-68](#uc-68).
- **BR / MSG trace:** BR-147, BR-148, BR-149, BR-151 / MSG127, MSG157, MSG158, MSG159, MSG160, MSG161
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-34](#fe-34). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-96"></a>

### Screen #96 — Complaint Response

- **Module / description:** Post-Trip Complaint. Allows a Tour Operator to accept a full refund, propose a partial refund or reject a complaint (UC-69).
- **Source / platform:** §3.1.2.2, original #96; `WEB_AND_MOBILE`. §3.1.2.2 Screen #96; §3.1.3 Table 5 name-based authorization; §3.8.6.2 UC-69.
- **Authorized actors:** Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-69](#uc-69).
- **BR / MSG trace:** BR-143, BR-150, BR-151, BR-152 / MSG126, MSG127, MSG162, MSG163, MSG164, MSG165
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-34](#fe-34). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-97"></a>

### Screen #97 — Partial Refund Proposal

- **Module / description:** Post-Trip Complaint. Allows a Traveler to accept or decline a partial refund proposed by the Tour Operator (UC-75).
- **Source / platform:** §3.1.2.2, original #97; `WEB_AND_MOBILE`. §3.1.2.2 Screen #97; §3.1.3 Table 5 name-based authorization; §3.8.6.3 UC-75.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-75](#uc-75).
- **BR / MSG trace:** BR-143, BR-153 / MSG126, MSG127, MSG165
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-34](#fe-34). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-98"></a>

### Screen #98 — Weather Warning & Departure Cancellation

- **Module / description:** Weather Warning. Shows the weather warning to the Tour Operator and lets it continue or cancel the departure; shows the warning, the cancellation, the 100% refund and a link to book another departure to the Traveler (UC-66).
- **Source / platform:** §3.1.2.2, original #98; `WEB_AND_MOBILE`. §3.1.2.2 Screen #98; §3.1.3 Table 5 name-based authorization; §3.10.1 UC-66.
- **Authorized actors:** Traveler, Tour Operator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-66](#uc-66).
- **BR / MSG trace:** BR-136, BR-143, BR-144, BR-186, BR-187, BR-189 / MSG123, MSG126, MSG127, MSG133, MSG151, MSG153, MSG185
- **FE route/page candidates:** `/partner/weather-safety-reviews` ([`app/partner/weather-safety-reviews/page.tsx`](../app/partner/weather-safety-reviews/page.tsx)), `/partner/weather-safety-reviews/[reviewId]` ([`app/partner/weather-safety-reviews/[reviewId]/page.tsx`](../app/partner/weather-safety-reviews/[reviewId]/page.tsx)) **Main component candidates:** [`src/features/operator/weather-safety/components/WeatherSafetyReviewDetailPage.tsx`](../src/features/operator/weather-safety/components/WeatherSafetyReviewDetailPage.tsx), [`src/features/operator/weather-safety/weatherSafetyApi.ts`](../src/features/operator/weather-safety/weatherSafetyApi.ts), [`src/features/operator/tours/emergency/components/CancelBeforeDepartureForm.tsx`](../src/features/operator/tours/emergency/components/CancelBeforeDepartureForm.tsx)
- **Guard / evidence:** [`app/partner/weather-safety-reviews/layout.tsx`](../app/partner/weather-safety-reviews/layout.tsx) Evidence: [FE-32](#fe-32). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-99"></a>

### Screen #99 — Refund Progress

- **Module / description:** Refund. Shows the refund status timeline of a booking to the Traveler (UC-67).
- **Source / platform:** §3.1.2.2, original #99; `WEB_AND_MOBILE`. §3.1.2.2 Screen #99; §3.1.3 Table 5 name-based authorization; §3.10.2 UC-67.
- **Authorized actors:** Traveler. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-67](#uc-67).
- **BR / MSG trace:** BR-74, BR-76, BR-77, BR-78, BR-134, BR-139, BR-143, BR-158, BR-159, BR-161, BR-186 / MSG89, MSG90, MSG91, MSG136, MSG137, MSG152, MSG153, MSG174
- **FE route/page candidates:** `/bookings/[id]/refund` ([`app/bookings/[id]/refund/page.tsx`](../app/bookings/[id]/refund/page.tsx)) **Main component candidates:** [`src/features/bookings/components/RefundProgressPage.tsx`](../src/features/bookings/components/RefundProgressPage.tsx), [`src/features/bookings/services/refundProgressProxy.ts`](../src/features/bookings/services/refundProgressProxy.ts)
- **Guard / evidence:** [`src/features/bookings/services/bookingBffAuth.ts`](../src/features/bookings/services/bookingBffAuth.ts) Evidence: Screen-specific paths above; [FE-33](#fe-33). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen. Screen-specific tests: [`src/features/bookings/components/RefundProgressPage.test.tsx`](../src/features/bookings/components/RefundProgressPage.test.tsx), [`src/features/bookings/services/refundProgressProxy.test.ts`](../src/features/bookings/services/refundProgressProxy.test.ts)
- **Status / issues:** `NOT_VERIFIED`. No additional conflict identified; page grant does not establish action or data permissions. Refund status page exists; component :102 reads session and :113 fetches refund progress. Observer of UC67 processing, not proof of backend refund execution or confirmation-share workflow. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-100"></a>

### Screen #100 — Refund Return Reconciliation

- **Module / description:** Refund (Web Administration). Allows Staff to record the receipt of a refund share returned by a Tour Operator after bank reconciliation (UC-42).
- **Source / platform:** §3.1.2.2, original #100; `ADMIN_WEB_ONLY`. §3.1.2.2 Screen #100; §3.1.3 Table 5 name-based authorization; §3.8.4.3 UC-42.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-42](#uc-42).
- **BR / MSG trace:** BR-130, BR-139, BR-143, BR-144, BR-158, BR-168, BR-175, BR-186, BR-187, BR-188, BR-189 / MSG126, MSG127, MSG136, MSG171, MSG172, MSG173, MSG197, MSG198
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-17](#fe-17). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. No additional conflict identified; page grant does not establish action or data permissions. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-101"></a>

### Screen #101 — Escalated Refunds Monitor

- **Module / description:** Refund (Web Administration). Lists refunds whose retries are exhausted for Administrator handling (UC-67, BR-161).
- **Source / platform:** §3.1.2.2, original #101; `ADMIN_WEB_ONLY`. §3.1.2.2 Screen #101; §3.1.3 Table 5 name-based authorization; §3.10.2 UC-67.
- **Authorized actors:** Administrator. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-67](#uc-67).
- **BR / MSG trace:** BR-74, BR-76, BR-77, BR-78, BR-134, BR-139, BR-143, BR-158, BR-159, BR-161, BR-186 / MSG89, MSG90, MSG91, MSG136, MSG137, MSG152, MSG153, MSG174
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: Screen-specific paths above; [FE-33](#fe-33). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. No additional conflict identified; page grant does not establish action or data permissions. No dedicated escalated-refund monitoring UI/route found. Failed payout review is a separate settlement capability and cannot substitute. Backend refund escalation behavior NOT_VERIFIED. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-102"></a>

### Screen #102 — Create Service Provider Account

- **Module / description:** User Management (Web Administration). Allows a Staff member to create a Service Provider account and link it to commercial points of interest (UC-77).
- **Source / platform:** §3.1.2.2, original #102; `ADMIN_WEB_ONLY`. §3.1.2.2 Screen #102; §3.1.3 Table 5 name-based authorization; §3.9.1.5 UC-77.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-77](#uc-77).
- **BR / MSG trace:** BR-03, BR-174, BR-192 / MSG01, MSG05, MSG34, MSG126, MSG127, MSG143, MSG201, MSG202
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-37](#fe-37). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. GAP-02: inventoried under §3.1.2.2 Guest, Traveler and Tour Operator heading although role is Service Provider or Staff. UC-77/BR-192 proposal approval pending. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-103"></a>

### Screen #103 — Service Booking Requests

- **Module / description:** Service Provider Workspace. Lists the booking requests of the signed-in Service Provider’s own services with search, status filter and pagination (UC-78).
- **Source / platform:** §3.1.2.2, original #103; `WEB_ONLY`. §3.1.2.2 Screen #103; §3.1.3 Table 5 name-based authorization; §3.6.3 UC-78.
- **Authorized actors:** Service Provider. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-78](#uc-78).
- **BR / MSG trace:** BR-52, BR-193 / MSG126, MSG127, MSG128
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-37](#fe-37). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. GAP-02: inventoried under §3.1.2.2 Guest, Traveler and Tour Operator heading although role is Service Provider or Staff. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-104"></a>

### Screen #104 — Service Booking Request Details

- **Module / description:** Service Provider Workspace. Shows one request with the Traveler’s contact information and special request, lets the Service Provider confirm or reject it (UC-79) and, after the service date, record its outcome (UC-80).
- **Source / platform:** §3.1.2.2, original #104; `WEB_ONLY`. §3.1.2.2 Screen #104; §3.1.3 Table 5 name-based authorization; §3.6.3 UC-78; §3.6.4 UC-79; §3.6.5 UC-80.
- **Authorized actors:** Service Provider. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-78](#uc-78), [UC-79](#uc-79), [UC-80](#uc-80).
- **BR / MSG trace:** BR-52, BR-89, BR-193, BR-194, BR-195, BR-196, BR-197, BR-198 / MSG72, MSG73, MSG123, MSG126, MSG127, MSG128, MSG133, MSG143, MSG203, MSG204, MSG206
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-37](#fe-37). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. GAP-02: inventoried under §3.1.2.2 Guest, Traveler and Tour Operator heading although role is Service Provider or Staff. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-105"></a>

### Screen #105 — Commission Statements

- **Module / description:** Service Provider Workspace. Lists the monthly commission statements of the signed-in Service Provider with amount, due date and status, and opens a statement with its requests to report the bank transfer (UC-82).
- **Source / platform:** §3.1.2.2, original #105; `WEB_ONLY`. §3.1.2.2 Screen #105; §3.1.3 Table 5 name-based authorization; §3.10.7 UC-81; §3.6.6 UC-82.
- **Authorized actors:** Service Provider. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-81](#uc-81), [UC-82](#uc-82).
- **BR / MSG trace:** BR-197, BR-198, BR-199, BR-200 / MSG126, MSG127, MSG133, MSG172, MSG207, MSG208, MSG210
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-33](#fe-33), [FE-38](#fe-38). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. GAP-02: inventoried under §3.1.2.2 Guest, Traveler and Tour Operator heading although role is Service Provider or Staff. GAP-04/05: UC-81 generates in background; UC-82 views/reports payment here; Payment Reported is not Paid, Staff receipt #106 required. Backend authorization/viewport behavior NOT_VERIFIED.

<a id="screen-106"></a>

### Screen #106 — Commission Reconciliation

- **Module / description:** Commercial Services (Web Administration). Lists the commission statements of all Service Providers and lets Staff record the receipt of a reported payment (UC-83).
- **Source / platform:** §3.1.2.2, original #106; `ADMIN_WEB_ONLY`. §3.1.2.2 Screen #106; §3.1.3 Table 5 name-based authorization; §3.10.7 UC-81; §3.6.7 UC-83.
- **Authorized actors:** Staff. Exact grant row in §E; action/data constraints separate. **UCs:** [UC-81](#uc-81), [UC-83](#uc-83).
- **BR / MSG trace:** BR-174, BR-197, BR-198, BR-199, BR-200 / MSG126, MSG127, MSG133, MSG207, MSG209, MSG210
- **FE route/page candidates:** No matching production route. **Main component candidates:** No matching production surface found in the audited route/feature inventory.
- **Guard / evidence:** No dedicated guard evidence mapped; source role constraints still apply. Evidence: [FE-33](#fe-33), [FE-38](#fe-38). Group evidence may cover neighboring list/detail/dialog surfaces, not this exact complete screen.
- **Status / issues:** `MISSING_IMPLEMENTATION`. GAP-02: inventoried under §3.1.2.2 Guest, Traveler and Tour Operator heading although role is Service Provider or Staff. GAP-04/05: UC-81 output observation; Staff UC-83 reconciles/records receipt. No Administrator grant in Table5. Backend authorization/viewport behavior NOT_VERIFIED.

## E. Screen authorization matrix

Source: §3.1.3 Table 5. X reproduces a grant; — reproduces a blank, not a newly invented deny policy. Source header Admin is rendered Administrator. Join by screen name, not row ordinal: Staff Dashboard, Create Staff Account and revenue screens occur out of inventory order. Exact aliases: Home Page → Home Page (Guest); Sign In → Mobile Sign In. No role grants merged.

| Screen ID | Guest | Traveler | Tour Operator | Service Provider | Staff | Administrator |
| --- | --- | --- | --- | --- | --- | --- |
| [#1](#screen-1) | X | — | — | — | — | — |
| [#2](#screen-2) | — | — | — | — | X | X |
| [#3](#screen-3) | — | — | — | — | X | X |
| [#4](#screen-4) | — | — | — | — | X | X |
| [#5](#screen-5) | — | — | — | — | — | X |
| [#6](#screen-6) | — | — | — | — | X | X |
| [#7](#screen-7) | — | — | — | — | X | X |
| [#8](#screen-8) | — | — | — | — | X | X |
| [#9](#screen-9) | — | — | — | — | X | X |
| [#10](#screen-10) | — | — | — | — | X | — |
| [#11](#screen-11) | — | — | — | — | X | — |
| [#12](#screen-12) | — | — | — | — | X | — |
| [#13](#screen-13) | — | — | — | — | X | — |
| [#14](#screen-14) | — | — | — | — | X | — |
| [#15](#screen-15) | — | — | — | — | X | — |
| [#16](#screen-16) | — | — | — | — | X | X |
| [#17](#screen-17) | — | — | — | — | X | — |
| [#18](#screen-18) | — | — | — | — | X | X |
| [#19](#screen-19) | — | — | — | — | — | X |
| [#20](#screen-20) | — | — | — | — | X | — |
| [#21](#screen-21) | — | — | — | — | X | — |
| [#22](#screen-22) | — | — | — | — | X | — |
| [#23](#screen-23) | — | — | — | — | — | X |
| [#24](#screen-24) | — | — | — | — | X | — |
| [#25](#screen-25) | — | — | — | — | X | — |
| [#26](#screen-26) | — | — | — | — | X | — |
| [#27](#screen-27) | — | — | — | — | X | — |
| [#28](#screen-28) | — | — | — | — | X | X |
| [#29](#screen-29) | — | — | — | — | — | X |
| [#30](#screen-30) | — | — | — | — | X | — |
| [#31](#screen-31) | — | — | — | — | — | X |
| [#32](#screen-32) | — | — | — | — | — | X |
| [#33](#screen-33) | — | — | — | — | — | X |
| [#34](#screen-34) | — | — | — | — | X | — |
| [#35](#screen-35) | — | — | — | — | — | X |
| [#36](#screen-36) | — | — | — | — | — | X |
| [#37](#screen-37) | — | — | — | — | — | X |
| [#38](#screen-38) | X | — | — | — | — | — |
| [#39](#screen-39) | X | — | — | — | — | — |
| [#40](#screen-40) | X | — | — | — | — | — |
| [#41](#screen-41) | X | — | — | — | — | — |
| [#42](#screen-42) | X | — | — | — | — | — |
| [#43](#screen-43) | X | — | — | — | — | — |
| [#44](#screen-44) | — | — | X | — | — | — |
| [#45](#screen-45) | X | — | — | — | — | — |
| [#46](#screen-46) | — | X | X | — | — | — |
| [#47](#screen-47) | — | X | — | — | — | — |
| [#48](#screen-48) | — | X | — | — | — | — |
| [#49](#screen-49) | — | X | — | — | — | — |
| [#50](#screen-50) | — | X | — | — | — | — |
| [#51](#screen-51) | — | X | — | — | — | — |
| [#52](#screen-52) | — | X | — | — | — | — |
| [#53](#screen-53) | X | X | — | — | — | — |
| [#54](#screen-54) | X | X | — | — | — | — |
| [#55](#screen-55) | — | X | — | — | — | — |
| [#56](#screen-56) | — | X | — | — | — | — |
| [#57](#screen-57) | — | X | — | — | — | — |
| [#58](#screen-58) | — | X | — | — | — | — |
| [#59](#screen-59) | — | X | — | — | — | — |
| [#60](#screen-60) | — | X | — | — | — | — |
| [#61](#screen-61) | — | X | — | — | — | — |
| [#62](#screen-62) | — | X | — | — | — | — |
| [#63](#screen-63) | — | X | — | — | — | — |
| [#64](#screen-64) | — | X | — | — | — | — |
| [#65](#screen-65) | — | X | — | — | — | — |
| [#66](#screen-66) | X | X | — | — | — | — |
| [#67](#screen-67) | — | X | — | — | — | — |
| [#68](#screen-68) | X | X | — | — | — | — |
| [#69](#screen-69) | — | X | — | — | — | — |
| [#70](#screen-70) | — | X | — | — | — | — |
| [#71](#screen-71) | — | X | — | — | — | — |
| [#72](#screen-72) | — | X | — | — | — | — |
| [#73](#screen-73) | — | X | — | — | — | — |
| [#74](#screen-74) | — | X | — | — | — | — |
| [#75](#screen-75) | — | X | — | — | — | — |
| [#76](#screen-76) | — | X | — | — | — | — |
| [#77](#screen-77) | — | X | — | — | — | — |
| [#78](#screen-78) | — | — | X | — | — | — |
| [#79](#screen-79) | — | — | X | — | — | — |
| [#80](#screen-80) | — | — | X | — | — | — |
| [#81](#screen-81) | — | — | X | — | — | — |
| [#82](#screen-82) | — | — | X | — | — | — |
| [#83](#screen-83) | — | — | X | — | — | — |
| [#84](#screen-84) | — | — | X | — | — | — |
| [#85](#screen-85) | — | — | X | — | — | — |
| [#86](#screen-86) | — | — | X | — | — | — |
| [#87](#screen-87) | — | — | X | — | — | — |
| [#88](#screen-88) | — | — | X | — | — | — |
| [#89](#screen-89) | — | X | X | — | — | — |
| [#90](#screen-90) | — | — | X | — | — | — |
| [#91](#screen-91) | — | — | X | — | — | — |
| [#92](#screen-92) | — | — | X | — | — | — |
| [#93](#screen-93) | — | — | X | — | — | — |
| [#94](#screen-94) | — | — | X | — | — | — |
| [#95](#screen-95) | — | X | — | — | — | — |
| [#96](#screen-96) | — | — | X | — | — | — |
| [#97](#screen-97) | — | X | — | — | — | — |
| [#98](#screen-98) | — | X | X | — | — | — |
| [#99](#screen-99) | — | X | — | — | — | — |
| [#100](#screen-100) | — | — | — | — | X | — |
| [#101](#screen-101) | — | — | — | — | — | X |
| [#102](#screen-102) | — | — | — | — | X | — |
| [#103](#screen-103) | — | — | — | X | — | — |
| [#104](#screen-104) | — | — | — | X | — | — |
| [#105](#screen-105) | — | — | — | X | — | — |
| [#106](#screen-106) | — | — | — | — | X | — |

**Visibility:** only source screen eligibility reproduced. **Page access:** direct navigation requires independent guards. **Actions:** Staff approvals/reconciliation/content cannot be inherited by Administrator because both use `/admin`. **Ownership:** Traveler own bookings/profile; Operator own tours/coupons/bookings/reports; Provider linked POIs/own statements. **Administration:** BR-115/168/182 and CR-11 require server enforcement. Staff cannot retry/resolve failed payouts; Administrator does not inherit Staff review actions. Login/reset rows denote intended account audience despite pre-authentication state. Provider authentication/target-account contradictions remain GAP-01/07.

## F. Non-screen function matrix

All 19 rows preserve §3.1.4 Table 6 IDs. Descriptions and explicit schedules come from that table; UC/BR links cross-reference the corresponding detailed functions, without creating triggers. Responsible components describe SRS responsibilities, not verified backend implementation. No fictional job screen is created. Execution verification is NOT_VERIFIED throughout this FE audit.

### NSF-01 — CSP Itinerary Solver Service

- **Original ID / feature / description:** Table 6 #1; Smart Itinerary Generation. Runs as a background computation service that executes the Constraint Satisfaction Problem (CSP) optimization algorithm to calculate, filter, and schedule optimal travel itineraries based on traveler preferences (budget, POI operating hours, travel time, transit mode).
- **Trigger / schedule:** Traveler scheduling request.
- **UC / BR:** [UC-10](#uc-10), [UC-11](#uc-11); BR-21, BR-22 Cross-reference basis: linked detailed sections and §3.1.4 #1.
- **Responsible component / affected actors:** Backend CSP solver; Traveler.
- **Input → output:** planning constraints → candidate itinerary.
- **Observable surface / FE relevance:** Screen 50–51; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-02 — Real-Time Re-Routing Event Engine

- **Original ID / feature / description:** Table 6 #2; Dynamic Navigation. Background event listener service that monitors Google Maps traffic data, weather events and POI status changes during Live Trip Execution. It triggers dynamic re-routing calculations when route delays exceed defined thresholds.
- **Trigger / schedule:** Traffic/weather/POI event during active trip.
- **UC / BR:** [UC-13](#uc-13), [UC-14](#uc-14), [UC-15](#uc-15); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #2.
- **Responsible component / affected actors:** Backend event/rerouting engine; Traveler.
- **Input → output:** event and active itinerary → rerouting proposal.
- **Observable surface / FE relevance:** Screen 55–57 Mobile; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-03 — Booking Auto-Expiration Cron Job

- **Original ID / feature / description:** Table 6 #3; Ticket & Booking Management. Scheduled background batch job (running every 5 minutes) that automatically cancels Pending Payment tour bookings when no verified payment is recorded within 15 minutes of creation (BR-68). The job runs every 5 minutes (BR-117).
- **Trigger / schedule:** Every 5 minutes; unpaid booking older than 15 minutes.
- **UC / BR:** [UC-27](#uc-27), [UC-28](#uc-28); BR-68, BR-117 Cross-reference basis: linked detailed sections and §3.1.4 #3.
- **Responsible component / affected actors:** Backend expiration job; Traveler / Tour Operator.
- **Input → output:** pending bookings/payment records → expired booking and released capacity.
- **Observable surface / FE relevance:** Screen 69–72 / 87–88; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-04 — Dynamic QR Code Generation & Cryptographic Signer

- **Original ID / feature / description:** Table 6 #4; E-Ticket Security. Background security service that generates encrypted, time-stamped QR payload tokens containing booking IDs and cryptographic signatures to prevent ticket forgery during check-in.
- **Trigger / schedule:** Ticket lifecycle event; exact cadence not specified.
- **UC / BR:** [UC-29](#uc-29), [UC-43](#uc-43); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #4.
- **Responsible component / affected actors:** Backend cryptographic ticket service; Traveler / Tour Operator.
- **Input → output:** booking identity → signed time-stamped QR payload.
- **Observable surface / FE relevance:** Screen 72; 91 Mobile scanner; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-05 — Tour Completion Service

- **Original ID / feature / description:** Table 6 #5; Financial Settlement. Tour Completion Service: Automated background service that sets a booking to Completed after the tour ends. It does not hold or release funds; settlement is governed by UC-71.
- **Trigger / schedule:** After tour ends; cadence not specified.
- **UC / BR:** [UC-32](#uc-32), [UC-71](#uc-71); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #5.
- **Responsible component / affected actors:** Backend completion service; Traveler / Tour Operator.
- **Input → output:** tour end → Completed booking; no funds release.
- **Observable surface / FE relevance:** Screen 76 / 94; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-06 — Batch Payout Disbursement Processor

- **Original ID / feature / description:** Table 6 #6; Financial Settlement. Payout Disbursement Processor: Background integration worker that transfers each settlement scheduled by UC-71 to the Tour Operator’s bank account through the payment or banking gateway at 10:00 each day, and retries failed transfers under BR-145.
- **Trigger / schedule:** Daily 10:00; failure retry hourly up to 3 times.
- **UC / BR:** [UC-71](#uc-71), [UC-74](#uc-74); BR-145 Cross-reference basis: linked detailed sections and §3.1.4 #6.
- **Responsible component / affected actors:** Backend banking worker; Tour Operator / Administrator.
- **Input → output:** scheduled settlement → transfer result/failure escalation.
- **Observable surface / FE relevance:** Screen 28, 29, 94; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-07 — Voucher Expiration & Capacity Tracker Cron Job

- **Original ID / feature / description:** Table 6 #7; Promotions & Marketing. Daily scheduled batch job running at 00:00 that evaluates voucher validity periods and claim quotas, automatically deactivating expired or fully-redeemed promotional vouchers.
- **Trigger / schedule:** Daily 00:00.
- **UC / BR:** [UC-38](#uc-38), [UC-39](#uc-39); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #7.
- **Responsible component / affected actors:** Backend voucher job; Tour Operator / Traveler.
- **Input → output:** validity and quota → inactive voucher.
- **Observable surface / FE relevance:** Screen 84–86; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-08 — Push Notification & Email Dispatch Worker

- **Original ID / feature / description:** Table 6 #8; Notifications. Asynchronous background queue worker of the ASP.NET Core back-end handling automated dispatch of OTP verification codes, booking confirmations, payment receipts, and trip incident alerts to users. Notifications are never sent synchronously in the request path (BR-114).
- **Trigger / schedule:** Asynchronous queue event.
- **UC / BR:** [UC-01](#uc-01), [UC-02](#uc-02), [UC-14](#uc-14), [UC-27](#uc-27), [UC-28](#uc-28), [UC-66](#uc-66); BR-114 Cross-reference basis: linked detailed sections and §3.1.4 #8.
- **Responsible component / affected actors:** ASP.NET Core queue worker; Affected registered actors.
- **Input → output:** event → dispatched email/push.
- **Observable surface / FE relevance:** Screen Associated notification/booking surfaces, no job page; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-09 — Daily Revenue & Platform Analytics Aggregator

- **Original ID / feature / description:** Table 6 #9; Operations & Analytics. Scheduled batch processing job that compiles daily transaction logs, booking volumes, active user counts, and commission metrics into aggregated database reporting tables for the Admin and Operator dashboards.
- **Trigger / schedule:** Daily aggregation; exact hour unspecified.
- **UC / BR:** [UC-44](#uc-44), [UC-63](#uc-63); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #9.
- **Responsible component / affected actors:** Backend analytics aggregator; Tour Operator / Administrator.
- **Input → output:** transactions/bookings/users → reporting aggregates.
- **Observable surface / FE relevance:** Screen 5, 31, 36, 37, 92; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-10 — System Audit Log Ingestion Engine

- **Original ID / feature / description:** Table 6 #10; Security & Compliance. Asynchronous logging service that captures, formats, and persists system activity events (user actions, API payloads, administrative overrides, and data diffs) into audit storage for compliance and technical debugging.
- **Trigger / schedule:** System/user action; asynchronous ingestion.
- **UC / BR:** [UC-64](#uc-64), [UC-65](#uc-65); BR-174 Cross-reference basis: linked detailed sections and §3.1.4 #10.
- **Responsible component / affected actors:** Backend audit ingestion; Administrator and logged subjects.
- **Input → output:** action/context/diff → audit entry.
- **Observable surface / FE relevance:** Screen 32, 33; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-11 — FSM Trip State Engine

- **Original ID / feature / description:** Table 6 #11; Real-Time Navigation. Manages and transitions TripSession state (Planning/Navigating/Exploring/Interrupted/Completed) throughout the live trip lifecycle
- **Trigger / schedule:** Live-trip lifecycle event.
- **UC / BR:** [UC-13](#uc-13), [UC-14](#uc-14), [UC-15](#uc-15); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #11.
- **Responsible component / affected actors:** Backend FSM engine; Traveler.
- **Input → output:** event → Planning/Navigating/Exploring/Interrupted/Completed state.
- **Observable surface / FE relevance:** Screen 55–57 Mobile; 24–25 read-only observation; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-12 — Weather Monitoring & Alert Ingestion Service

- **Original ID / feature / description:** Table 6 #12; Dynamic Navigation. Polls OpenWeatherMap every 15 minutes, stores WeatherEvent records, evaluates alert thresholds, and triggers the Rerouting Engine and the Weather Warning Service (UC-66). It does not cancel any booking or tour.
- **Trigger / schedule:** Weather polling every 15 minutes.
- **UC / BR:** [UC-14](#uc-14), [UC-66](#uc-66); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #12.
- **Responsible component / affected actors:** Backend weather ingestion; Traveler / Tour Operator.
- **Input → output:** weather data → WeatherEvent/warning/rerouting trigger.
- **Observable surface / FE relevance:** Screen 56 / 98; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-13 — Weather Warning Service

- **Original ID / feature / description:** Table 6 #13; Tour & Booking Management. Automatically sends a weather warning to the responsible Tour Operator and the affected Travelers when a qualifying extreme-weather event exceeds the configured threshold. It does not cancel any booking or tour (UC-66).
- **Trigger / schedule:** Configured extreme-weather threshold exceeded.
- **UC / BR:** [UC-66](#uc-66); None explicitly listed at this traceability level; see linked UC rules. Cross-reference basis: linked detailed sections and §3.1.4 #13.
- **Responsible component / affected actors:** Backend warning service; Traveler / Tour Operator.
- **Input → output:** qualifying event → warning only; never automatic cancellation.
- **Observable surface / FE relevance:** Screen 98; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-14 — Refund Processing Service

- **Original ID / feature / description:** Table 6 #14; Financial Settlement. Takes the refund amount fixed by the triggering function (BR-135 or the accepted complaint amount, confirmed in UC-42; BR-136 for a Tour Operator cancellation) and submits the refund under UC-67 through the original payment channel. Records the refund status and transaction reference. The amount is never recalculated.
- **Trigger / schedule:** Confirmed/received refund share or explicit UC-67 exception.
- **UC / BR:** [UC-42](#uc-42), [UC-67](#uc-67); BR-135, BR-136, BR-139, BR-143, BR-186 Cross-reference basis: linked detailed sections and §3.1.4 #14.
- **Responsible component / affected actors:** Backend refund service; Traveler / Tour Operator / Administrator.
- **Input → output:** fixed refund amount → gateway request/recorded result.
- **Observable surface / FE relevance:** Screen 99, 101; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-15 — Offline Trip Data Synchronization Service

- **Original ID / feature / description:** Table 6 #15; Offline Trip Management. Syncs buffered GPS data, trip state, and check-in logs collected offline once the device regains network connectivity (UC-70).
- **Trigger / schedule:** Connectivity regained with buffered trip data.
- **UC / BR:** [UC-70](#uc-70); BR-165, BR-166 Cross-reference basis: linked detailed sections and §3.1.4 #15.
- **Responsible component / affected actors:** Mobile sync client + backend service; Traveler.
- **Input → output:** local GPS/state/logs → reconciled server execution data.
- **Observable surface / FE relevance:** Screen 52 supporting Mobile offline surface; detailed sync banner not separately numbered; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying UC approval provenance applies; no new job approved here.

### NSF-16 — Complaint Deadline Job

- **Original ID / feature / description:** Table 6 #16; Post-Trip Complaint. Hourly job that sets a complaint to Expired when the Tour Operator has not responded within 7 days (BR-151) and a partial refund proposal to Declined when the Traveler has not responded within 3 days (BR-153), and notifies both parties.
- **Trigger / schedule:** Hourly; Operator response 7 days / Traveler response 3 days.
- **UC / BR:** [UC-68](#uc-68), [UC-69](#uc-69), [UC-75](#uc-75); BR-151, BR-153 Cross-reference basis: linked detailed sections and §3.1.4 #16.
- **Responsible component / affected actors:** Backend complaint deadline job; Traveler / Tour Operator.
- **Input → output:** unanswered complaint/proposal → Expired/Declined and notification.
- **Observable surface / FE relevance:** Screen 95–97; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying deadlines, debt and commission decisions require approval evidence (GAP-05/09).

### NSF-17 — Refund Return Deadline Monitor

- **Original ID / feature / description:** Table 6 #17; Financial Settlement. Daily job that (1) automatically confirms refund requests not confirmed by the Tour Operator within 3 working days (BR-187), (2) converts a refund share not received within 3 working days of the confirmation into a pending debt (BR-144), and (3) automatically locks a Tour Operator account whose pending debt is not fully recovered 15 days after it arose (BR-189).
- **Trigger / schedule:** Daily; 3 working-day confirmation/return deadlines; 15-day debt lock.
- **UC / BR:** [UC-42](#uc-42), [UC-48](#uc-48), [UC-71](#uc-71); BR-144, BR-187, BR-189 Cross-reference basis: linked detailed sections and §3.1.4 #17.
- **Responsible component / affected actors:** Backend refund-return monitor; Tour Operator / Staff.
- **Input → output:** overdue return → auto-confirmation/debt/account lock.
- **Observable surface / FE relevance:** Screen 90, 100 and account status; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying deadlines, debt and commission decisions require approval evidence (GAP-05/09).

### NSF-18 — Service Request Expiry Job

- **Original ID / feature / description:** Table 6 #18; Commercial Services. Hourly job that sets a commercial service booking request to Expired when the Service Provider has not responded within 24 hours and notifies the Traveler (BR-194).
- **Trigger / schedule:** Hourly; expire unanswered request after 24 hours (proposal).
- **UC / BR:** [UC-31](#uc-31), [UC-78](#uc-78), [UC-79](#uc-79); BR-194 Cross-reference basis: linked detailed sections and §3.1.4 #18.
- **Responsible component / affected actors:** Backend service request expiry; Traveler / Service Provider.
- **Input → output:** pending request → Expired and notification.
- **Observable surface / FE relevance:** Screen 75 Mobile / 103–104 Web; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying deadlines, debt and commission decisions require approval evidence (GAP-05/09).

### NSF-19 — Commission Statement Job

- **Original ID / feature / description:** Table 6 #19; Commercial Services. Daily job that sets unrecorded outcomes to Completed after 3 days (BR-197), issues the monthly commission statements on the first day of the month (UC-81, BR-199), marks unpaid statements Overdue after the due date and locks a Service Provider account 15 days after the due date (BR-200).
- **Trigger / schedule:** Daily outcome/deadline checks; monthly first-day statement; proposal timing.
- **UC / BR:** [UC-80](#uc-80), [UC-81](#uc-81), [UC-82](#uc-82), [UC-83](#uc-83); BR-197, BR-198, BR-199, BR-200 Cross-reference basis: linked detailed sections and §3.1.4 #19.
- **Responsible component / affected actors:** Backend commission job; Service Provider / Staff.
- **Input → output:** unrecorded outcomes/completed requests/unpaid statements → default completion, issued/overdue statement, lock.
- **Observable surface / FE relevance:** Screen 105, 106; FE observes/requests only where its own UC permits. No FE scheduler or job execution claim.
- **Verification / approval:** `NOT_VERIFIED`. Underlying deadlines, debt and commission decisions require approval evidence (GAP-05/09).

## G. FE implementation coverage and evidence

All paths below were inspected at `1f2ed13f9a40def98709736199d81e4afd23b52b`. Source behavior does not establish deployment, full SRS compliance, backend ownership, payment execution or Mobile delivery. Some comments use older UC IDs: map current capabilities by name, not stale comments (Create POI is now UC-51). Tests establish coverage intent; required execution results are in §I.

<a id="fe-01"></a>

### FE-01 — Evidence for UC-01

- **UCs / screens:** [UC-01](#uc-01); [#41](#screen-41), [#42](#screen-42).
- **Routes/pages:** `/register` ([`app/register/page.tsx`](../app/register/page.tsx))
- **Components/services:** [`src/features/traveler/registration/TravelerRegistrationForm.tsx`](../src/features/traveler/registration/TravelerRegistrationForm.tsx)
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** [`src/features/traveler/registration/TravelerRegistrationForm.test.tsx`](../src/features/traveler/registration/TravelerRegistrationForm.test.tsx)
- **Finding / limits:** Traveler registration form exists; full server validation and delivery NOT_VERIFIED.

<a id="fe-02"></a>

### FE-02 — Evidence for UC-02, UC-03

- **UCs / screens:** [UC-02](#uc-02), [UC-03](#uc-03); [#43](#screen-43), [#44](#screen-44).
- **Routes/pages:** `/partner/register` ([`app/partner/register/page.tsx`](../app/partner/register/page.tsx)), `/partner/application` ([`app/partner/application/page.tsx`](../app/partner/application/page.tsx)), `/partner/application/resubmit` ([`app/partner/application/resubmit/page.tsx`](../app/partner/application/resubmit/page.tsx))
- **Components/services:** [`src/features/operator/application/OperatorRegistrationForm.tsx`](../src/features/operator/application/OperatorRegistrationForm.tsx), [`src/features/operator/application/ResubmitApplicationForm.tsx`](../src/features/operator/application/ResubmitApplicationForm.tsx), [`src/features/operator/application/operatorApplicationApi.ts`](../src/features/operator/application/operatorApplicationApi.ts), [`src/features/operator/application/operatorApplicationProxy.ts`](../src/features/operator/application/operatorApplicationProxy.ts)
- **Guards:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx), [`src/features/operator/access/partnerRouteDecision.ts`](../src/features/operator/access/partnerRouteDecision.ts)
- **Tests:** [`src/features/operator/application/ResubmitApplicationForm.test.tsx`](../src/features/operator/application/ResubmitApplicationForm.test.tsx), [`src/features/operator/application/operatorApplicationProxy.test.ts`](../src/features/operator/application/operatorApplicationProxy.test.ts)
- **Finding / limits:** Rejected/pending application guarded workflows exist. Staff approval actions mismatch current SRS as FE-20.

<a id="fe-03"></a>

### FE-03 — Evidence for UC-04, UC-05, UC-06, UC-07

- **UCs / screens:** [UC-04](#uc-04), [UC-05](#uc-05), [UC-06](#uc-06), [UC-07](#uc-07); [#2](#screen-2), [#3](#screen-3), [#4](#screen-4), [#39](#screen-39), [#40](#screen-40), [#45](#screen-45), [#46](#screen-46).
- **Routes/pages:** `/sign-in` ([`app/sign-in/page.tsx`](../app/sign-in/page.tsx)), `/forgot-password` ([`app/forgot-password/page.tsx`](../app/forgot-password/page.tsx)), `/admin/login` ([`app/admin/login/page.tsx`](../app/admin/login/page.tsx)), `/admin/forgot-password` ([`app/admin/forgot-password/page.tsx`](../app/admin/forgot-password/page.tsx)), `/account/security` ([`app/account/security/page.tsx`](../app/account/security/page.tsx)), `/admin/account/security` ([`app/admin/(console)/account/security/page.tsx`](../app/admin/%28console%29/account/security/page.tsx))
- **Components/services:** [`src/features/auth/session/authSession.ts`](../src/features/auth/session/authSession.ts), [`src/features/auth/sign-in/useSignInEngine.ts`](../src/features/auth/sign-in/useSignInEngine.ts), [`src/features/admin/auth/AdminSignInForm.tsx`](../src/features/admin/auth/AdminSignInForm.tsx), [`src/features/account/security/ChangePasswordForm.tsx`](../src/features/account/security/ChangePasswordForm.tsx), [`src/features/admin/account/changePasswordProxy.ts`](../src/features/admin/account/changePasswordProxy.ts)
- **Guards:** [`src/lib/server/adminSession.ts`](../src/lib/server/adminSession.ts), [`src/features/auth/session/WebSessionProvider.tsx`](../src/features/auth/session/WebSessionProvider.tsx)
- **Tests:** [`src/features/auth/session/authSession.test.ts`](../src/features/auth/session/authSession.test.ts), [`src/features/admin/account/changePasswordProxy.test.ts`](../src/features/admin/account/changePasswordProxy.test.ts), [`src/features/auth/session/webLogout.test.ts`](../src/features/auth/session/webLogout.test.ts)
- **Finding / limits:** MISMATCH: AuthRole :1 and validator :38 exclude Service Provider, although original SRS UC04-07 include it. Other roles have source flows and tests; no Provider session/workspace.

<a id="fe-04"></a>

### FE-04 — Evidence for UC-08, UC-09

- **UCs / screens:** [UC-08](#uc-08), [UC-09](#uc-09); [#48](#screen-48), [#49](#screen-49).
- **Routes/pages:** `/account/profile` ([`app/account/profile/page.tsx`](../app/account/profile/page.tsx)), `/account/preferences` ([`app/account/preferences/page.tsx`](../app/account/preferences/page.tsx))
- **Components/services:** [`src/features/account/profile/TravelerProfileForm.tsx`](../src/features/account/profile/TravelerProfileForm.tsx), [`src/features/account/profile/travelerProfileProxy.ts`](../src/features/account/profile/travelerProfileProxy.ts), [`src/features/account/preferences/TravelPreferencesForm.tsx`](../src/features/account/preferences/TravelPreferencesForm.tsx), [`src/features/account/preferences/travelPreferencesApi.ts`](../src/features/account/preferences/travelPreferencesApi.ts)
- **Guards:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx)
- **Tests:** [`src/features/account/profile/travelerProfileProxy.test.ts`](../src/features/account/profile/travelerProfileProxy.test.ts), [`src/features/account/preferences/__tests__/TravelPreferencesForm.test.tsx`](../src/features/account/preferences/__tests__/TravelPreferencesForm.test.tsx)
- **Finding / limits:** Traveler-only shell :168 and profile BFF :29 role check. Form validation, API and tests present; backend persistence NOT_VERIFIED.

<a id="fe-05"></a>

### FE-05 — Evidence for UC-10, UC-11

- **UCs / screens:** [UC-10](#uc-10), [UC-11](#uc-11); [#50](#screen-50), [#51](#screen-51).
- **Routes/pages:** `/plan` ([`app/plan/page.tsx`](../app/plan/page.tsx)), `/itinerary/[id]` ([`app/itinerary/[id]/page.tsx`](../app/itinerary/[id]/page.tsx)), `/itineraries` ([`app/itineraries/page.tsx`](../app/itineraries/page.tsx))
- **Components/services:** [`src/features/scheduling/components/CreateSchedulingRequestPage.tsx`](../src/features/scheduling/components/CreateSchedulingRequestPage.tsx), [`src/features/scheduling/components/ViewSuggestedItineraryPage.tsx`](../src/features/scheduling/components/ViewSuggestedItineraryPage.tsx), [`src/features/scheduling/components/MyItinerariesPage.tsx`](../src/features/scheduling/components/MyItinerariesPage.tsx), [`src/features/scheduling/services/schedulingApi.ts`](../src/features/scheduling/services/schedulingApi.ts)
- **Guards:** [`src/features/scheduling/components/CreateSchedulingRequestPage.tsx`](../src/features/scheduling/components/CreateSchedulingRequestPage.tsx)
- **Tests:** [`src/features/scheduling/__tests__/CreateSchedulingRequestForm.test.tsx`](../src/features/scheduling/__tests__/CreateSchedulingRequestForm.test.tsx), [`src/features/scheduling/__tests__/ViewSuggestedItineraryPage.test.tsx`](../src/features/scheduling/__tests__/ViewSuggestedItineraryPage.test.tsx), [`src/features/scheduling/__tests__/MyItinerariesPage.test.tsx`](../src/features/scheduling/__tests__/MyItinerariesPage.test.tsx)
- **Finding / limits:** Live scheduling/API plus gated demo fixture mode; Traveler render gate; loading/error/empty responsive intent. Actual CSP backend correctness NOT_VERIFIED.

<a id="fe-06"></a>

### FE-06 — Evidence for UC-12

- **UCs / screens:** [UC-12](#uc-12); [#53](#screen-53), [#54](#screen-54).
- **Routes/pages:** `/pois` ([`app/pois/page.tsx`](../app/pois/page.tsx)), `/pois/[id]` ([`app/pois/[id]/page.tsx`](../app/pois/[id]/page.tsx))
- **Components/services:** [`src/features/public/pois/components/ExplorePoisPage.tsx`](../src/features/public/pois/components/ExplorePoisPage.tsx), [`src/features/public/pois/components/PoiDetailPage.tsx`](../src/features/public/pois/components/PoiDetailPage.tsx), [`src/features/public/pois/services/poiProxy.ts`](../src/features/public/pois/services/poiProxy.ts)
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** [`tests/public-poi-proxy.test.cjs`](../tests/public-poi-proxy.test.cjs)
- **Finding / limits:** Public discovery source + same-origin proxy/tests; category preview restrictions and missing backend contract cannot be counted compliant.

<a id="fe-07"></a>

### FE-07 — Evidence for UC-13, UC-14, UC-15, UC-16, UC-17, UC-18, UC-19, UC-20, UC-21, UC-22, UC-23

- **UCs / screens:** [UC-13](#uc-13), [UC-14](#uc-14), [UC-15](#uc-15), [UC-16](#uc-16), [UC-17](#uc-17), [UC-18](#uc-18), [UC-19](#uc-19), [UC-20](#uc-20), [UC-21](#uc-21), [UC-22](#uc-22), [UC-23](#uc-23); [#52](#screen-52), [#55](#screen-55), [#56](#screen-56), [#57](#screen-57), [#58](#screen-58), [#59](#screen-59), [#60](#screen-60), [#61](#screen-61), [#62](#screen-62), [#63](#screen-63), [#64](#screen-64), [#65](#screen-65).
- **Routes/pages:** No matching production route.
- **Components/services:** No matching production surface found in the audited route/feature inventory.
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** No relevant automated test cited.
- **Finding / limits:** Mobile functions; no corresponding production Web route. Mobile repository deliberately not audited. Not a missing Web implementation.

<a id="fe-08"></a>

### FE-08 — Evidence for UC-24, UC-25, UC-26

- **UCs / screens:** [UC-24](#uc-24), [UC-25](#uc-25), [UC-26](#uc-26); [#66](#screen-66), [#67](#screen-67), [#68](#screen-68).
- **Routes/pages:** `/tours` ([`app/tours/page.tsx`](../app/tours/page.tsx)), `/tours/[id]` ([`app/tours/[id]/page.tsx`](../app/tours/[id]/page.tsx))
- **Components/services:** [`src/features/public/tours/components/ExploreToursPage.tsx`](../src/features/public/tours/components/ExploreToursPage.tsx), [`src/features/public/tours/components/TourDetailPage.tsx`](../src/features/public/tours/components/TourDetailPage.tsx), [`src/features/public/tours/components/TourRecommendationsSection.tsx`](../src/features/public/tours/components/TourRecommendationsSection.tsx), [`src/features/public/tours/services/tourProxy.ts`](../src/features/public/tours/services/tourProxy.ts)
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** [`tests/public-tour-proxy.test.cjs`](../tests/public-tour-proxy.test.cjs)
- **Finding / limits:** Public tour list/detail and recommendation surfaces exist. Matching algorithm threshold and backend completeness NOT_VERIFIED.

<a id="fe-09"></a>

### FE-09 — Evidence for UC-27, UC-28, UC-29

- **UCs / screens:** [UC-27](#uc-27), [UC-28](#uc-28), [UC-29](#uc-29); [#69](#screen-69), [#70](#screen-70), [#71](#screen-71), [#72](#screen-72).
- **Routes/pages:** `/tours/[id]/book` ([`app/tours/[id]/book/page.tsx`](../app/tours/[id]/book/page.tsx)), `/bookings/[id]/pay` ([`app/bookings/[id]/pay/page.tsx`](../app/bookings/[id]/pay/page.tsx)), `/checkout/result` ([`app/checkout/result/page.tsx`](../app/checkout/result/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx)), `/account/tickets/[ticketId]` ([`app/account/tickets/[ticketId]/page.tsx`](../app/account/tickets/[ticketId]/page.tsx))
- **Components/services:** [`src/features/bookings/components/TourBookingPage.tsx`](../src/features/bookings/components/TourBookingPage.tsx), [`src/features/bookings/components/PaymentHandoffPage.tsx`](../src/features/bookings/components/PaymentHandoffPage.tsx), [`src/features/bookings/components/CheckoutResultPage.tsx`](../src/features/bookings/components/CheckoutResultPage.tsx), [`src/features/bookings/components/BookingTicketPage.tsx`](../src/features/bookings/components/BookingTicketPage.tsx), [`src/features/bookings/services/bookingBffAuth.ts`](../src/features/bookings/services/bookingBffAuth.ts), [`src/features/bookings/services/ticketProxy.ts`](../src/features/bookings/services/ticketProxy.ts)
- **Guards:** [`src/features/bookings/services/bookingBffAuth.ts`](../src/features/bookings/services/bookingBffAuth.ts)
- **Tests:** [`src/features/bookings/components/TourBookingPage.test.tsx`](../src/features/bookings/components/TourBookingPage.test.tsx), [`src/features/bookings/components/BookingTicketPage.test.tsx`](../src/features/bookings/components/BookingTicketPage.test.tsx), [`src/features/bookings/services/ticketProxy.test.ts`](../src/features/bookings/services/ticketProxy.test.ts)
- **Finding / limits:** Live BFF interfaces and tests; bookingAccessToken :35 accepts Traveler/TourOperator; resource checks/gateway results NOT_VERIFIED. QR ticket display distinct from Mobile scanner. Explicit /checkout/mock and /dev/payment do not verify real payment.

<a id="fe-10"></a>

### FE-10 — Evidence for UC-30, UC-31

- **UCs / screens:** [UC-30](#uc-30), [UC-31](#uc-31); [#74](#screen-74), [#75](#screen-75).
- **Routes/pages:** No matching production route.
- **Components/services:** No matching production surface found in the audited route/feature inventory.
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** No relevant automated test cited.
- **Finding / limits:** Traveler commercial-services route absent; platform ownership must be resolved from SRS, not Provider-side functions. Mobile backend behavior NOT_VERIFIED.

<a id="fe-11"></a>

### FE-11 — Evidence for UC-32, UC-33

- **UCs / screens:** [UC-32](#uc-32), [UC-33](#uc-33); [#76](#screen-76), [#77](#screen-77).
- **Routes/pages:** `/account/trips` ([`app/account/trips/page.tsx`](../app/account/trips/page.tsx)), `/account/trips/[id]/review` ([`app/account/trips/[id]/review/page.tsx`](../app/account/trips/[id]/review/page.tsx)), `/account/reviews/[kind]/[id]` ([`app/account/reviews/[kind]/[id]/page.tsx`](../app/account/reviews/[kind]/[id]/page.tsx))
- **Components/services:** [`src/features/trips/components/TripHistoryPage.tsx`](../src/features/trips/components/TripHistoryPage.tsx), [`src/features/trips/services/tripHistoryProxy.ts`](../src/features/trips/services/tripHistoryProxy.ts), [`src/features/trips/services/tripReviewBff.ts`](../src/features/trips/services/tripReviewBff.ts)
- **Guards:** [`src/features/account/common/AccountWorkspaceShell.tsx`](../src/features/account/common/AccountWorkspaceShell.tsx)
- **Tests:** [`src/features/trips/components/TripHistoryPage.test.tsx`](../src/features/trips/components/TripHistoryPage.test.tsx), [`src/features/trips/services/tripReviewBff.test.ts`](../src/features/trips/services/tripReviewBff.test.ts)
- **Finding / limits:** Trip history/review interfaces, BFF, fixtures separated and tests; formal complaint workflow is separate and absent.

<a id="fe-12"></a>

### FE-12 — Evidence for UC-34

- **UCs / screens:** [UC-34](#uc-34); [#79](#screen-79).
- **Routes/pages:** `/partner/profile` ([`app/partner/profile/page.tsx`](../app/partner/profile/page.tsx))
- **Components/services:** [`src/features/operator/profile/components/OperatorProfilePage.tsx`](../src/features/operator/profile/components/OperatorProfilePage.tsx), [`src/features/operator/profile/components/OperatorProfileView.tsx`](../src/features/operator/profile/components/OperatorProfileView.tsx), [`src/features/operator/profile/services/operatorProfileService.ts`](../src/features/operator/profile/services/operatorProfileService.ts)
- **Guards:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx)
- **Tests:** No relevant automated test cited.
- **Finding / limits:** Profile surface present; server legal-field validation NOT_VERIFIED.

<a id="fe-13"></a>

### FE-13 — Evidence for UC-35, UC-36, UC-37

- **UCs / screens:** [UC-35](#uc-35), [UC-36](#uc-36), [UC-37](#uc-37); [#80](#screen-80), [#81](#screen-81), [#82](#screen-82), [#83](#screen-83).
- **Routes/pages:** `/partner/tours` ([`app/partner/tours/page.tsx`](../app/partner/tours/page.tsx)), `/partner/tours/new` ([`app/partner/tours/new/page.tsx`](../app/partner/tours/new/page.tsx)), `/partner/tours/[id]/edit` ([`app/partner/tours/[id]/edit/page.tsx`](../app/partner/tours/[id]/edit/page.tsx)), `/partner/tours/[id]/submit` ([`app/partner/tours/[id]/submit/page.tsx`](../app/partner/tours/[id]/submit/page.tsx))
- **Components/services:** [`src/features/operator/tours/components/CreateTourPackageView.tsx`](../src/features/operator/tours/components/CreateTourPackageView.tsx), [`src/features/operator/tours/components/UpdateTourPackageView.tsx`](../src/features/operator/tours/components/UpdateTourPackageView.tsx), [`src/features/operator/tours/components/SubmitTourApprovalView.tsx`](../src/features/operator/tours/components/SubmitTourApprovalView.tsx), [`src/features/operator/tours/services/operatorTourApi.ts`](../src/features/operator/tours/services/operatorTourApi.ts)
- **Guards:** [`src/features/operator/tours/guards/TourRouteGuard.tsx`](../src/features/operator/tours/guards/TourRouteGuard.tsx)
- **Tests:** [`src/features/operator/tours/guards/tourRouteDecision.test.ts`](../src/features/operator/tours/guards/tourRouteDecision.test.ts)
- **Finding / limits:** Tour API CRUD/submit source + approved operator/lifecycle guard; backend ownership/publication compliance NOT_VERIFIED.

<a id="fe-14"></a>

### FE-14 — Evidence for UC-38, UC-39

- **UCs / screens:** [UC-38](#uc-38), [UC-39](#uc-39); [#84](#screen-84), [#85](#screen-85), [#86](#screen-86).
- **Routes/pages:** `/partner/coupons` ([`app/partner/coupons/page.tsx`](../app/partner/coupons/page.tsx)), `/partner/coupons/create` ([`app/partner/coupons/create/page.tsx`](../app/partner/coupons/create/page.tsx)), `/partner/coupons/[id]/edit` ([`app/partner/coupons/[id]/edit/page.tsx`](../app/partner/coupons/[id]/edit/page.tsx))
- **Components/services:** [`src/features/operator/coupons/components/CreateCouponForm.tsx`](../src/features/operator/coupons/components/CreateCouponForm.tsx), [`src/features/operator/coupons/components/UpdateCouponView.tsx`](../src/features/operator/coupons/components/UpdateCouponView.tsx), [`src/features/operator/coupons/services/couponApi.ts`](../src/features/operator/coupons/services/couponApi.ts)
- **Guards:** [`src/features/operator/coupons/guards/CouponRouteGuard.tsx`](../src/features/operator/coupons/guards/CouponRouteGuard.tsx)
- **Tests:** [`src/features/operator/coupons/services/operatorCouponService.create.regression.test.ts`](../src/features/operator/coupons/services/operatorCouponService.create.regression.test.ts)
- **Finding / limits:** Coupon forms/services/guard tests; lifecycle invariants backend NOT_VERIFIED.

<a id="fe-15"></a>

### FE-15 — Evidence for UC-40

- **UCs / screens:** [UC-40](#uc-40); [#87](#screen-87), [#88](#screen-88).
- **Routes/pages:** `/partner/bookings` ([`app/partner/bookings/page.tsx`](../app/partner/bookings/page.tsx))
- **Components/services:** [`src/features/operator/bookings/components/OperatorBookingListView.tsx`](../src/features/operator/bookings/components/OperatorBookingListView.tsx), [`src/features/operator/bookings/components/BookingDetailPanel.tsx`](../src/features/operator/bookings/components/BookingDetailPanel.tsx), [`src/features/operator/bookings/services/operatorBookingLiveClient.ts`](../src/features/operator/bookings/services/operatorBookingLiveClient.ts)
- **Guards:** [`src/features/operator/bookings/guards/BookingRouteGuard.tsx`](../src/features/operator/bookings/guards/BookingRouteGuard.tsx)
- **Tests:** [`src/features/operator/bookings/services/operatorBookingService.test.ts`](../src/features/operator/bookings/services/operatorBookingService.test.ts)
- **Finding / limits:** Live list/detail same-origin BFF :25,51 and response parsers. Backend own-tour enforcement NOT_VERIFIED.

<a id="fe-16"></a>

### FE-16 — Evidence for UC-41

- **UCs / screens:** [UC-41](#uc-41); [#73](#screen-73), [#89](#screen-89).
- **Routes/pages:** `/partner/bookings` ([`app/partner/bookings/page.tsx`](../app/partner/bookings/page.tsx)), `/bookings/[id]/ticket` ([`app/bookings/[id]/ticket/page.tsx`](../app/bookings/[id]/ticket/page.tsx))
- **Components/services:** [`src/features/operator/bookings/components/CancelBookingDialog.tsx`](../src/features/operator/bookings/components/CancelBookingDialog.tsx), [`src/features/operator/bookings/services/operatorBookingService.ts`](../src/features/operator/bookings/services/operatorBookingService.ts), [`src/features/bookings/components/BookingCancelAction.tsx`](../src/features/bookings/components/BookingCancelAction.tsx), [`src/features/bookings/services/cancellationProxy.ts`](../src/features/bookings/services/cancellationProxy.ts)
- **Guards:** [`src/features/operator/bookings/guards/BookingRouteGuard.tsx`](../src/features/operator/bookings/guards/BookingRouteGuard.tsx)
- **Tests:** [`src/features/operator/bookings/components/CancelBookingDialog.test.tsx`](../src/features/operator/bookings/components/CancelBookingDialog.test.tsx), [`src/features/bookings/services/cancellationProxy.test.ts`](../src/features/bookings/services/cancellationProxy.test.ts)
- **Finding / limits:** cancelBookingLive :272 submits reason with idempotency key, :306 live dispatch. Traveler shared cancellation separate from Operator Web-only. Current refund tiers and recovery backend NOT_VERIFIED.

<a id="fe-17"></a>

### FE-17 — Evidence for UC-42

- **UCs / screens:** [UC-42](#uc-42); [#90](#screen-90), [#100](#screen-100).
- **Routes/pages:** `/partner/bookings` ([`app/partner/bookings/page.tsx`](../app/partner/bookings/page.tsx))
- **Components/services:** [`src/features/operator/bookings/components/InitiateRefundDialog.tsx`](../src/features/operator/bookings/components/InitiateRefundDialog.tsx), [`src/features/operator/bookings/services/operatorBookingService.ts`](../src/features/operator/bookings/services/operatorBookingService.ts)
- **Guards:** [`src/features/operator/bookings/guards/BookingRouteGuard.tsx`](../src/features/operator/bookings/guards/BookingRouteGuard.tsx)
- **Tests:** [`src/features/operator/bookings/components/InitiateRefundDialog.test.tsx`](../src/features/operator/bookings/components/InitiateRefundDialog.test.tsx)
- **Finding / limits:** initiateBookingRefund :405-420 returns PENDING_BE_INTEGRATION in production. Demo initiation is not current confirm/refund-share-return and Staff bank reconciliation workflow.

<a id="fe-18"></a>

### FE-18 — Evidence for UC-43

- **UCs / screens:** [UC-43](#uc-43); [#91](#screen-91).
- **Routes/pages:** No matching production route.
- **Components/services:** No matching production surface found in the audited route/feature inventory.
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** No relevant automated test cited.
- **Finding / limits:** Mobile scanner has no Web route. Mobile behavior NOT_VERIFIED; ticket display does not implement scanning.

<a id="fe-19"></a>

### FE-19 — Evidence for UC-44, UC-45

- **UCs / screens:** [UC-44](#uc-44), [UC-45](#uc-45); [#92](#screen-92), [#93](#screen-93).
- **Routes/pages:** `/partner/revenue` ([`app/partner/revenue/page.tsx`](../app/partner/revenue/page.tsx))
- **Components/services:** [`src/features/operator/finance/components/revenue/OperatorRevenueView.tsx`](../src/features/operator/finance/components/revenue/OperatorRevenueView.tsx), [`src/features/operator/finance/components/revenue/ExportRevenueDialog.tsx`](../src/features/operator/finance/components/revenue/ExportRevenueDialog.tsx), [`src/features/operator/finance/components/revenue/ExportHistoryPanel.tsx`](../src/features/operator/finance/components/revenue/ExportHistoryPanel.tsx), [`src/features/operator/finance/api/operatorRevenueProxy.ts`](../src/features/operator/finance/api/operatorRevenueProxy.ts), [`src/features/operator/finance/api/operatorRevenueExportProxy.ts`](../src/features/operator/finance/api/operatorRevenueExportProxy.ts)
- **Guards:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx)
- **Tests:** [`src/features/operator/finance/api/operatorRevenueExportProxy.test.ts`](../src/features/operator/finance/api/operatorRevenueExportProxy.test.ts)
- **Finding / limits:** Live report/export exists (OperatorRevenueView :255). Demo explicit env gate :59-60; error/loading states :354,367,379. Historical blanket claim all finance mutations disabled is stale. Backend accounting NOT_VERIFIED.

<a id="fe-20"></a>

### FE-20 — Evidence for UC-46, UC-47, UC-48

- **UCs / screens:** [UC-46](#uc-46), [UC-47](#uc-47), [UC-48](#uc-48); [#6](#screen-6), [#7](#screen-7), [#8](#screen-8), [#9](#screen-9).
- **Routes/pages:** `/admin/users` ([`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx)), `/admin/users/[userId]` ([`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx))
- **Components/services:** [`src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx), [`src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx`](../src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx)
- **Guards:** [`app/admin/(console)/users/page.tsx`](../app/admin/%28console%29/users/page.tsx), [`app/admin/(console)/users/[userId]/page.tsx`](../app/admin/%28console%29/users/[userId]/page.tsx)
- **Tests:** [Directory page tests](../app/admin/%28console%29/users/page.test.tsx#L140) check that Administrator renders a view without a redirect and that Staff receives AdminAccessDeniedView. UserAccountsPage identifies the Administrator view as the unavailable shell.
- **Finding / limits:** Staff is denied (:26/:31), violating Staff-managed Traveler/Operator scope; Admin only Staff scope not implemented. Directory/lock/unlock are explicitly unavailable placeholders.

<a id="fe-21"></a>

### FE-21 — Evidence for UC-49, UC-50

- **UCs / screens:** [UC-49](#uc-49), [UC-50](#uc-50); [#10](#screen-10), [#11](#screen-11), [#12](#screen-12).
- **Routes/pages:** `/admin/tour-operator-applications` ([`app/admin/(console)/tour-operator-applications/page.tsx`](../app/admin/%28console%29/tour-operator-applications/page.tsx)), `/admin/tour-operator-applications/[userId]` ([`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx))
- **Components/services:** [`src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx`](../src/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView.tsx), [`src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts`](../src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts)
- **Guards:** [`app/admin/(console)/tour-operator-applications/[userId]/page.tsx`](../app/admin/%28console%29/tour-operator-applications/[userId]/page.tsx)
- **Tests:** [`tests/tour-operator-application-proxy.test.cjs`](../tests/tour-operator-application-proxy.test.cjs)
- **Finding / limits:** Detail page :28 and action proxy :38 reject Staff, contrary to current Staff-only UC49/50; page visibility is distinct from action access.

<a id="fe-22"></a>

### FE-22 — Evidence for UC-51

- **UCs / screens:** [UC-51](#uc-51); [#16](#screen-16), [#17](#screen-17).
- **Routes/pages:** `/admin/catalogue/points-of-interest/new` ([`app/admin/catalogue/points-of-interest/new/page.tsx`](../app/admin/catalogue/points-of-interest/new/page.tsx))
- **Components/services:** [`src/features/admin/create-poi/CreatePoiPage.tsx`](../src/features/admin/create-poi/CreatePoiPage.tsx), [`src/features/admin/create-poi/services/poi-proxy.ts`](../src/features/admin/create-poi/services/poi-proxy.ts)
- **Guards:** [`app/admin/catalogue/points-of-interest/new/page.tsx`](../app/admin/catalogue/points-of-interest/new/page.tsx)
- **Tests:** [`tests/poi-proxy.test.cjs`](../tests/poi-proxy.test.cjs), [`tests/poi-contract.test.cjs`](../tests/poi-contract.test.cjs), [`tests/poi-api.test.cjs`](../tests/poi-api.test.cjs)
- **Finding / limits:** Staff-only page :31 and BFF :22 present. Existing metadata labels Create POI UC52; current SRS is UC51. Preserve source numbering, record stale implementation labels.

<a id="fe-23"></a>

### FE-23 — Evidence for UC-52, UC-53

- **UCs / screens:** [UC-52](#uc-52), [UC-53](#uc-53); [#16](#screen-16), [#18](#screen-18), [#19](#screen-19).
- **Routes/pages:** `/admin/catalogue/points-of-interest` ([`app/admin/catalogue/points-of-interest/page.tsx`](../app/admin/catalogue/points-of-interest/page.tsx))
- **Components/services:** [`src/features/admin/catalogue/components/PoiCatalogListView.tsx`](../src/features/admin/catalogue/components/PoiCatalogListView.tsx), [`src/features/admin/catalogue/services/poi-management-proxy.ts`](../src/features/admin/catalogue/services/poi-management-proxy.ts)
- **Guards:** [`app/admin/catalogue/points-of-interest/page.tsx`](../app/admin/catalogue/points-of-interest/page.tsx)
- **Tests:** [`src/features/admin/catalogue/services/poi-management-proxy.test.ts`](../src/features/admin/catalogue/services/poi-management-proxy.test.ts)
- **Finding / limits:** Only management GET list/read detail table found, no update/deactivate mutation form or route. List display does not implement current UC52/53.

<a id="fe-24"></a>

### FE-24 — Evidence for UC-54, UC-55

- **UCs / screens:** [UC-54](#uc-54), [UC-55](#uc-55); [#20](#screen-20), [#21](#screen-21), [#22](#screen-22).
- **Routes/pages:** `/admin/routes` ([`app/admin/(console)/routes/page.tsx`](../app/admin/%28console%29/routes/page.tsx)), `/admin/routes/create` ([`app/admin/(console)/routes/create/page.tsx`](../app/admin/%28console%29/routes/create/page.tsx))
- **Components/services:** [`src/features/admin/routes/components/CreateRouteUnavailableView.tsx`](../src/features/admin/routes/components/CreateRouteUnavailableView.tsx), [`src/features/admin/routes/resources/en.ts`](../src/features/admin/routes/resources/en.ts)
- **Guards:** [`app/admin/(console)/routes/page.tsx`](../app/admin/%28console%29/routes/page.tsx), [`app/admin/(console)/routes/create/page.tsx`](../app/admin/%28console%29/routes/create/page.tsx)
- **Tests:** [Route directory](../app/admin/%28console%29/routes/page.test.tsx#L136) and [create route](../app/admin/%28console%29/routes/create/page.test.tsx#L136) tests cover current route access for Administrator and denial for Staff.
- **Finding / limits:** Pages deny Staff :26 while SRS assigns Staff. Disabled placeholder controls; route create/update integration absent.

<a id="fe-25"></a>

### FE-25 — Evidence for UC-56

- **UCs / screens:** [UC-56](#uc-56); [#23](#screen-23).
- **Routes/pages:** `/admin/settings/algorithm-parameters` ([`app/admin/(console)/settings/algorithm-parameters/page.tsx`](../app/admin/%28console%29/settings/algorithm-parameters/page.tsx))
- **Components/services:** [`src/features/admin/algorithm-config/AlgorithmConfigForm.tsx`](../src/features/admin/algorithm-config/AlgorithmConfigForm.tsx), [`src/features/admin/algorithm-config/algorithmConfigProxy.ts`](../src/features/admin/algorithm-config/algorithmConfigProxy.ts)
- **Guards:** [`app/admin/(console)/settings/algorithm-parameters/page.tsx`](../app/admin/%28console%29/settings/algorithm-parameters/page.tsx)
- **Tests:** [`src/features/admin/algorithm-config/algorithmConfigProxy.test.ts`](../src/features/admin/algorithm-config/algorithmConfigProxy.test.ts)
- **Finding / limits:** Admin-only route, value ranges :176-181 and API present. Actual CSP/FSM consumption NOT_VERIFIED.

<a id="fe-26"></a>

### FE-26 — Evidence for UC-57, UC-58

- **UCs / screens:** [UC-57](#uc-57), [UC-58](#uc-58); [#24](#screen-24), [#25](#screen-25).
- **Routes/pages:** `/admin/trips/active` ([`app/admin/(console)/trips/active/page.tsx`](../app/admin/%28console%29/trips/active/page.tsx)), `/admin/trips/active/[id]` ([`app/admin/(console)/trips/active/[id]/page.tsx`](../app/admin/%28console%29/trips/active/[id]/page.tsx))
- **Components/services:** [`src/features/admin/active-trips/ActiveTripsScreen.tsx`](../src/features/admin/active-trips/ActiveTripsScreen.tsx), [`src/features/admin/active-trips/activeTripsProxy.ts`](../src/features/admin/active-trips/activeTripsProxy.ts), [`src/features/admin/active-trip-details/activeTripDetailsProxy.ts`](../src/features/admin/active-trip-details/activeTripDetailsProxy.ts)
- **Guards:** [`app/admin/(console)/layout.tsx`](../app/admin/%28console%29/layout.tsx)
- **Tests:** [`tests/active-trips-proxy.test.cjs`](../tests/active-trips-proxy.test.cjs)
- **Finding / limits:** BFFs check token only (:25/:13); parent layout allows Staff and Admin, no Staff-only page gate. Current SRS Staff-only monitoring. Backend authorization NOT_VERIFIED.

<a id="fe-27"></a>

### FE-27 — Evidence for UC-59, UC-60

- **UCs / screens:** [UC-59](#uc-59), [UC-60](#uc-60); [#13](#screen-13), [#14](#screen-14), [#15](#screen-15).
- **Routes/pages:** `/admin/tours/reviews` ([`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx)), `/admin/tours/reviews/[id]` ([`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx))
- **Components/services:** [`src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx`](../src/features/admin/tour-reviews/TourReviewDecisionPanel.tsx), [`src/features/admin/tour-reviews/services/tourModerationService.ts`](../src/features/admin/tour-reviews/services/tourModerationService.ts)
- **Guards:** [`app/admin/(console)/tours/reviews/page.tsx`](../app/admin/%28console%29/tours/reviews/page.tsx), [`app/admin/(console)/tours/reviews/[id]/page.tsx`](../app/admin/%28console%29/tours/reviews/[id]/page.tsx)
- **Tests:** [Tour moderation tests](../src/features/admin/tour-reviews/TourModeration.test.tsx#L50) check that production renders neither fixture rows nor decision actions. Demo tests separately exercise approval confirmation and rejection reason validation.
- **Finding / limits:** Pages deny Staff :28/:32 contrary to SRS. Production service :18-23/:48-49 returns NO_BACKEND. Demo only.

<a id="fe-28"></a>

### FE-28 — Evidence for UC-61

- **UCs / screens:** [UC-61](#uc-61); [#26](#screen-26), [#27](#screen-27).
- **Routes/pages:** `/admin/bookings` ([`app/admin/(console)/bookings/page.tsx`](../app/admin/%28console%29/bookings/page.tsx))
- **Components/services:** [`src/features/admin/platform-bookings/platformBookingsProxy.ts`](../src/features/admin/platform-bookings/platformBookingsProxy.ts), [`src/features/admin/platform-bookings/platformBookingsService.ts`](../src/features/admin/platform-bookings/platformBookingsService.ts)
- **Guards:** [`app/admin/(console)/bookings/page.tsx`](../app/admin/%28console%29/bookings/page.tsx)
- **Tests:** [`src/features/admin/platform-bookings/platformBookingsProxy.test.ts`](../src/features/admin/platform-bookings/platformBookingsProxy.test.ts)
- **Finding / limits:** Page :27 and BFF :22 require Staff. Source read interface and tests; backend data/ownership NOT_VERIFIED.

<a id="fe-29"></a>

### FE-29 — Evidence for UC-62

- **UCs / screens:** [UC-62](#uc-62); [#1](#screen-1), [#30](#screen-30).
- **Routes/pages:** `/admin/landing-content` ([`app/admin/(console)/landing-content/page.tsx`](../app/admin/%28console%29/landing-content/page.tsx))
- **Components/services:** [`src/features/admin/landing-content/landingContentService.ts`](../src/features/admin/landing-content/landingContentService.ts), [`src/features/admin/landing-content/landingContentProxy.ts`](../src/features/admin/landing-content/landingContentProxy.ts)
- **Guards:** [`app/admin/(console)/landing-content/page.tsx`](../app/admin/%28console%29/landing-content/page.tsx)
- **Tests:** [`src/features/admin/landing-content/landingContentProxy.test.ts`](../src/features/admin/landing-content/landingContentProxy.test.ts)
- **Finding / limits:** Page :26 and BFF :52 allow Staff and Admin mutations; current UC62 Staff actor. Save/publish/restore/upload actions exist.

<a id="fe-30"></a>

### FE-30 — Evidence for UC-63

- **UCs / screens:** [UC-63](#uc-63); [#31](#screen-31), [#36](#screen-36), [#37](#screen-37).
- **Routes/pages:** `/admin/reports` ([`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx))
- **Components/services:** [`src/features/admin/reports/components/StatisticalReportsView.tsx`](../src/features/admin/reports/components/StatisticalReportsView.tsx), [`src/features/admin/reports/services/statisticalReportsProxy.ts`](../src/features/admin/reports/services/statisticalReportsProxy.ts)
- **Guards:** [`app/admin/(console)/reports/page.tsx`](../app/admin/%28console%29/reports/page.tsx)
- **Tests:** [`src/features/admin/reports/services/statisticalReportService.test.ts`](../src/features/admin/reports/services/statisticalReportService.test.ts)
- **Finding / limits:** Admin-only BFF :33 and export :96. Full report data/backend correctness NOT_VERIFIED.

<a id="fe-31"></a>

### FE-31 — Evidence for UC-64, UC-65

- **UCs / screens:** [UC-64](#uc-64), [UC-65](#uc-65); [#32](#screen-32), [#33](#screen-33).
- **Routes/pages:** `/admin/audit-logs` ([`app/admin/(console)/audit-logs/page.tsx`](../app/admin/%28console%29/audit-logs/page.tsx))
- **Components/services:** [`src/features/admin/audit-logs/api/auditLogProxy.ts`](../src/features/admin/audit-logs/api/auditLogProxy.ts), [`src/features/admin/audit-logs/services/auditLogAdminService.ts`](../src/features/admin/audit-logs/services/auditLogAdminService.ts)
- **Guards:** [`app/admin/(console)/audit-logs/page.tsx`](../app/admin/%28console%29/audit-logs/page.tsx)
- **Tests:** [`tests/audit-log-proxy.test.cjs`](../tests/audit-log-proxy.test.cjs)
- **Finding / limits:** Admin-only source list/detail and BFF/tests; backend audit completeness NOT_VERIFIED.

<a id="fe-32"></a>

### FE-32 — Evidence for UC-66

- **UCs / screens:** [UC-66](#uc-66); [#98](#screen-98).
- **Routes/pages:** `/partner/weather-safety-reviews` ([`app/partner/weather-safety-reviews/page.tsx`](../app/partner/weather-safety-reviews/page.tsx)), `/partner/weather-safety-reviews/[reviewId]` ([`app/partner/weather-safety-reviews/[reviewId]/page.tsx`](../app/partner/weather-safety-reviews/[reviewId]/page.tsx))
- **Components/services:** [`src/features/operator/weather-safety/components/WeatherSafetyReviewDetailPage.tsx`](../src/features/operator/weather-safety/components/WeatherSafetyReviewDetailPage.tsx), [`src/features/operator/weather-safety/weatherSafetyApi.ts`](../src/features/operator/weather-safety/weatherSafetyApi.ts), [`src/features/operator/tours/emergency/components/CancelBeforeDepartureForm.tsx`](../src/features/operator/tours/emergency/components/CancelBeforeDepartureForm.tsx)
- **Guards:** [`app/partner/weather-safety-reviews/layout.tsx`](../app/partner/weather-safety-reviews/layout.tsx)
- **Tests:** [`src/features/operator/weather-safety/__tests__/weatherSafetyApi.test.ts`](../src/features/operator/weather-safety/__tests__/weatherSafetyApi.test.ts)
- **Finding / limits:** Warning review + operator decision API exists. Weather jobs, no automatic cancellation, emergency refund and notification processing/backend NOT_VERIFIED.

<a id="fe-33"></a>

### FE-33 — Evidence for UC-67, UC-70, UC-71, UC-74, UC-81

- **UCs / screens:** [UC-67](#uc-67), [UC-70](#uc-70), [UC-71](#uc-71), [UC-74](#uc-74), [UC-81](#uc-81); [#28](#screen-28), [#29](#screen-29), [#52](#screen-52), [#94](#screen-94), [#99](#screen-99), [#101](#screen-101), [#105](#screen-105), [#106](#screen-106).
- **Routes/pages:** No matching production route.
- **Components/services:** No matching production surface found in the audited route/feature inventory.
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** No relevant automated test cited.
- **Finding / limits:** System/background/Mobile use cases; no standalone Web page required. Backend jobs, gateway retries, settlement schedules, commission generation NOT_VERIFIED from FE.

<a id="fe-34"></a>

### FE-34 — Evidence for UC-68, UC-69, UC-75

- **UCs / screens:** [UC-68](#uc-68), [UC-69](#uc-69), [UC-75](#uc-75); [#95](#screen-95), [#96](#screen-96), [#97](#screen-97).
- **Routes/pages:** No matching production route.
- **Components/services:** No matching production surface found in the audited route/feature inventory.
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** No relevant automated test cited.
- **Finding / limits:** No formal complaint/evidence/reply/partial-proposal route or feature module found. Trip reviews are not complaints.

<a id="fe-35"></a>

### FE-35 — Evidence for UC-72

- **UCs / screens:** [UC-72](#uc-72); [#28](#screen-28).
- **Routes/pages:** `/admin/payout-settlements` ([`app/admin/(console)/payout-settlements/page.tsx`](../app/admin/%28console%29/payout-settlements/page.tsx))
- **Components/services:** [`src/features/admin/payout-settlements/payoutSettlementsProxy.ts`](../src/features/admin/payout-settlements/payoutSettlementsProxy.ts), [`src/features/admin/payout-settlements/PayoutSettlementsScreen.tsx`](../src/features/admin/payout-settlements/PayoutSettlementsScreen.tsx)
- **Guards:** [`app/admin/(console)/payout-settlements/page.tsx`](../app/admin/%28console%29/payout-settlements/page.tsx)
- **Tests:** [`src/features/admin/payout-settlements/payoutSettlementsProxy.test.ts`](../src/features/admin/payout-settlements/payoutSettlementsProxy.test.ts)
- **Finding / limits:** Internal read list allows Staff/Admin at proxy :32-42/:70; separate from Tour Operator own history Screen94 at /partner/payout-settlements.

<a id="fe-36"></a>

### FE-36 — Evidence for UC-73

- **UCs / screens:** [UC-73](#uc-73); [#29](#screen-29).
- **Routes/pages:** `/admin/payout-settlements/[batchId]` ([`app/admin/(console)/payout-settlements/[batchId]/page.tsx`](../app/admin/%28console%29/payout-settlements/[batchId]/page.tsx))
- **Components/services:** [`src/features/admin/payout-settlements/payoutSettlementsProxy.ts`](../src/features/admin/payout-settlements/payoutSettlementsProxy.ts)
- **Guards:** [`app/admin/(console)/payout-settlements/[batchId]/page.tsx`](../app/admin/%28console%29/payout-settlements/[batchId]/page.tsx)
- **Tests:** [`src/features/admin/payout-settlements/payoutSettlementsProxy.test.ts`](../src/features/admin/payout-settlements/payoutSettlementsProxy.test.ts)
- **Finding / limits:** Admin-only detail/action route (:30-31). BFF :84 detail/:97 actions; amount preservation and real bank retry processing NOT_VERIFIED.

<a id="fe-37"></a>

### FE-37 — Evidence for UC-76, UC-77, UC-78, UC-79, UC-80

- **UCs / screens:** [UC-76](#uc-76), [UC-77](#uc-77), [UC-78](#uc-78), [UC-79](#uc-79), [UC-80](#uc-80); [#35](#screen-35), [#102](#screen-102), [#103](#screen-103), [#104](#screen-104).
- **Routes/pages:** No matching production route.
- **Components/services:** [`src/features/auth/session/authSession.ts`](../src/features/auth/session/authSession.ts)
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** No relevant automated test cited.
- **Finding / limits:** No create Staff/Provider form or dedicated Provider workspace feature. Provider AuthRole absent. Screens35/102-104 capability missing; older unavailable user-account page does not implement onboarding.

<a id="fe-38"></a>

### FE-38 — Evidence for UC-82, UC-83

- **UCs / screens:** [UC-82](#uc-82), [UC-83](#uc-83); [#105](#screen-105), [#106](#screen-106).
- **Routes/pages:** No matching production route.
- **Components/services:** [`src/features/auth/session/authSession.ts`](../src/features/auth/session/authSession.ts)
- **Guards:** No matching production surface found in the audited route/feature inventory.
- **Tests:** No relevant automated test cited.
- **Finding / limits:** No commission statement payment/report-transfer or Staff receipt reconciliation route. Provider role missing. Screens105/106 missing. UC81 system generation separate.

<a id="fe-39"></a>

### FE-39 — Evidence for observer screen

- **UCs / screens:** No dedicated numbered UC; workspace/navigation surface only.; [#94](#screen-94).
- **Routes/pages:** `/partner/payouts` ([`app/partner/payouts/page.tsx`](../app/partner/payouts/page.tsx)), `/partner/payout-settlements` ([`app/partner/payout-settlements/page.tsx`](../app/partner/payout-settlements/page.tsx))
- **Components/services:** [`src/features/operator/finance/components/payouts/OperatorPayoutView.tsx`](../src/features/operator/finance/components/payouts/OperatorPayoutView.tsx), [`src/features/operator/finance/services/operatorPayoutService.ts`](../src/features/operator/finance/services/operatorPayoutService.ts), [`src/features/operator/payout-settlements/PayoutSettlementHistoryScreen.tsx`](../src/features/operator/payout-settlements/PayoutSettlementHistoryScreen.tsx), [`src/features/operator/payout-settlements/payoutSettlementsProxy.ts`](../src/features/operator/payout-settlements/payoutSettlementsProxy.ts)
- **Guards:** [`src/features/operator/access/PartnerRouteGuard.tsx`](../src/features/operator/access/PartnerRouteGuard.tsx)
- **Tests:** [`src/features/operator/payout-settlements/payoutSettlementsProxy.test.ts`](../src/features/operator/payout-settlements/payoutSettlementsProxy.test.ts)
- **Finding / limits:** Screen94 own operator settlement history; /partner/payouts is beneficiary bank management (GET :76/PUT :106) not a manual payout request; no independent numbered UC inferred.

Cross-cutting authorization: `AuthRole` and `parseWebAuthContext` in [`src/features/auth/session/authSession.ts`](../src/features/auth/session/authSession.ts) accept Traveler, TourOperator, Administrator, Staff, but no Provider. [`src/lib/server/adminSession.ts`](../src/lib/server/adminSession.ts) seals/verifies internal identity; [`app/admin/(console)/layout.tsx`](../app/admin/%28console%29/layout.tsx) protects the console. [`src/features/admin/shared/components/AdminSidebar.tsx`](../src/features/admin/shared/components/AdminSidebar.tsx) is navigation evidence only. [`src/features/operator/access/partnerRouteDecision.ts`](../src/features/operator/access/partnerRouteDecision.ts) separates partner roles and approval states. These do not verify backend resource ownership.

State/responsive evidence: [`src/features/scheduling/components/MyItinerariesPage.tsx`](../src/features/scheduling/components/MyItinerariesPage.tsx) has restoring/loading, error, empty and responsive-grid states; [`src/features/scheduling/components/CreateSchedulingRequestPage.tsx`](../src/features/scheduling/components/CreateSchedulingRequestPage.tsx) gates the Traveler session and composes responsive UI. Finance views have loading/status and alert states; dialog tests cover interaction intent. CSS classes establish responsive intent only; browser/viewport QA was not performed. CR-01–15 remain acceptance requirements: inline validation, error feedback, double-submit prevention, expiry, ownership and audit. Backend and visual behavior remain NOT_VERIFIED.

Finance: current revenue export and beneficiary bank-save actions exist; no universal financial-mutations-disabled gate was found. `/partner/payouts` is bank-account maintenance, not the retired manual payout request. Explicit demo gates and `/checkout/mock` or `/dev/payment` cannot verify gateway behavior. Admin/Staff dashboard datasets default to DATA_SOURCE_NOT_CONNECTED; charts are not production reporting evidence.

## H. Requirement gap and conflict register


<a id="gap-01"></a>

### GAP-01

- **Affected:** UC-04–07; #39/40/45/46. **Exact SRS:** §2.2.2; §§3.2.4–3.2.7; §3.1.3.
- **Conflict/missing information:** Provider in catalog/§2.1 but omitted from detailed authentication actors and screen grants.
- **Implementation evidence:** AuthRole/parseWebAuthContext excludes Provider. See linked UC evidence in §C/G.
- **Web impact:** Existing account flows cannot be claimed complete for Provider.
- **Clarification / owner:** Owner confirms authentication, reset, password change/forced first change and grants.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-02"></a>

### GAP-02

- **Affected:** UC-77–83; #102–106. **Exact SRS:** §3.1.2.2; §§3.6.3–3.6.7; §3.9.1.5.
- **Conflict/missing information:** Guest/Traveler/Tour Operator heading includes Provider and Staff Administration rows.
- **Implementation evidence:** No Provider/commission module found. See linked UC evidence in §C/G.
- **Web impact:** Retain dedicated workspaces and original IDs; heading cannot reallocate them.
- **Clarification / owner:** Owner/BA confirms heading and cross-workspace inventory without renumbering.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-03"></a>

### GAP-03

- **Affected:** UC-71/72/74; #28/94. **Exact SRS:** §3.9.9.1; §§3.10.4–3.10.5; §3.1.3.
- **Conflict/missing information:** UC72 is internal read-only #28; #94 is own-Operator history observing System outputs, without dedicated viewing UC.
- **Implementation evidence:** Separate admin/partner settlement routes exist. See linked UC evidence in §C/G.
- **Web impact:** Do not grant Operator UC72 or Staff failed-settlement actions.
- **Clarification / owner:** Owner/BA confirms explicit history UC traceability; retain observer mapping.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-04"></a>

### GAP-04

- **Affected:** UC-81; #105/106. **Exact SRS:** §3.10.7; §3.6.6; Table 6 #19.
- **Conflict/missing information:** System generates; Provider UC82 views/reports; Staff UC83 confirms receipt.
- **Implementation evidence:** No commission implementation. See linked UC evidence in §C/G.
- **Web impact:** UC81 NON_SCREEN; only existing observer surfaces.
- **Clarification / owner:** Owner confirms statement rules/evidence; no Generate page invented.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-05"></a>

### GAP-05

- **Affected:** UC-80–83; #104–106. **Exact SRS:** §§3.6.5–3.6.7; §3.10.7; BR-196–200; MSG206–210.
- **Conflict/missing information:** Bank transfer reporting yields Payment Reported; Staff bank reconciliation alone sets Paid. BR197–200 explicitly unapproved proposals.
- **Implementation evidence:** Provider workspace and Staff commission receipt absent. See linked UC evidence in §C/G.
- **Web impact:** No invented gateway action or Paid status from Provider report.
- **Clarification / owner:** Owner confirms actual amount, 10% rate, 3-day default, monthly/7-day deadline, 15-day lock; finance confirms reconciliation.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-06"></a>

### GAP-06

- **Affected:** UC-13–23/30/31/41/43/44/45/66/70; #89/91–93/98. **Exact SRS:** §1; §2.1; §2.2.2; §§3.6.1–2/3.8.4.2/3.8.4.4/3.8.5.1–2/3.10.1/3.10.3; 9–10 November change records.
- **Conflict/missing information:** Revenue/export shared ownership contradicts 9-Nov Web-only decision with written evidence pending. Operator UC41 Web-only exception explicit; QR/commercial services/active-trip functions Mobile-only.
- **Implementation evidence:** Web revenue/cancellation exist; QR display is not scanner. See linked UC evidence in §C/G.
- **Web impact:** UC44/45 CONFLICT_REQUIRES_APPROVAL; Provider Web workspace adds no Traveler Web commercial booking.
- **Clarification / owner:** Owner supplies decision evidence and resolves revenue/export allocation; keep per-actor exception.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-07"></a>

### GAP-07

- **Affected:** [UC-46](#uc-46), [UC-47](#uc-47), [UC-48](#uc-48), [UC-77](#uc-77) and [UC-82](#uc-82), including Screens [#6](#screen-6)–[#9](#screen-9), [#102](#screen-102) and [#105](#screen-105) on Web. **Exact SRS:** §2.2.2, §3.1.2.1 Screens #6, #8 and #9, §§3.9.1.1–3.9.1.3, §3.9.1.5, §3.10.7 and §5.1 BR-168, BR-192 and BR-200.
- **Conflict/missing information:** Screen #6 and the lock/unlock actor lines limit Staff targets to Traveler and Tour Operator. BR-168 includes Service Provider for view, lock and unlock. UC-77 expects newly created providers in the account list and BR-200 describes Staff unlock after overdue payment. The UC-48 trigger also names only Administrator. Administrator target scope remains Staff accounts.
- **Implementation evidence:** [FE-20](#fe-20) shows the unavailable directory and Staff denial. [FE-03](#fe-03) shows the session role list excludes Service Provider.
- **Web impact:** Provider governance cannot be silently added or assigned to Admin.
- **Clarification / owner:** Owner aligns account visibility, lock and unlock target roles, the UC-48 trigger and first-password rules.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-08"></a>

### GAP-08

- **Affected:** UC-37/49/50/59/60; #10–15/83. **Exact SRS:** §3.8.2.3 PC-02; §2.2.2; §§3.9.2/3.9.7; §3.1.3.
- **Conflict/missing information:** UC37 postcondition retains Administrator queue and UC60/61, contradicting Staff/current UC59/60.
- **Implementation evidence:** Approval proxy and tour-review pages deny Staff; production moderation returns NO_BACKEND. See linked UC evidence in §C/G.
- **Web impact:** Staff review requirements mismatch; stale refs do not justify Admin rights.
- **Clarification / owner:** Owner/BA confirms traceability; FE owner needs separately authorized RBAC/moderation work.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-09"></a>

### GAP-09

- **Affected:** UC-41/42/66/67/71/73/74/76–83. **Exact SRS:** Record of Changes 9–12 November; BR-135/139/141–145/177/186–200.
- **Conflict/missing information:** Recent refund tiers, two-stage70%+20% settlement, weather refund, debt locks and Provider proposals lack complete approval evidence.
- **Implementation evidence:** Live UC42 returns PENDING_BE_INTEGRATION; finance contracts not verified against new formulas. See linked UC evidence in §C/G.
- **Web impact:** No policy approval or authoritative FE financial computation from this document.
- **Clarification / owner:** Owner supplies traceable decisions; finance/backend confirms contracts. Pending rules remain gated.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-10"></a>

### GAP-10

- **Affected:** UC-54/55/57/58/62; #20–25/30. **Exact SRS:** §2.2.2; §3.1.3; §§3.9.4/3.9.6/3.9.10; BR-115.
- **Conflict/missing information:** Source denies Staff route management; active-trip BFF lacks explicit Staff-only checks; Admin content actions exceed Staff catalog actor.
- **Implementation evidence:** Concrete source evidence in §G. See linked UC evidence in §C/G.
- **Web impact:** Menu visibility cannot establish action/data enforcement.
- **Clarification / owner:** FE owner scopes separate corrections; Owner approval required for permission expansion, not documenting mismatch.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

<a id="gap-11"></a>

### GAP-11

- **Affected:** Non-screen functions #3/#8. **Exact SRS:** §3.1.4 Table6 #3/#8; §5.1; 12-Nov Record of Changes.
- **Conflict/missing information:** Table6 explicitly cites BR-117 for five-minute expiration and BR-114 for asynchronous notification. Neither has a definition row in the inspected §5.1 tables, despite change-log wording claiming these are resolved.
- **Implementation evidence:** FE does not verify background job cadence or queue execution. See linked UC evidence in §C/G.
- **Web impact:** Preserve exact source references; definition traceability check fails for BR-114/117. Do not invent their appendix definitions.
- **Clarification / owner:** Owner/BA confirms definitions and approves source correction separately.
- **Approval requirement / resolution:** `PENDING_APPROVAL`; OPEN. Owner decision or evidence is required to change the requirement. The open requirement is recorded for traceability.

## I. Summary, historical comparison and validation

### Coverage and status distribution

| Inventory | Coverage |
| --- | --- |
| Canonical UC records | 83 / 83 |
| Canonical screen records | 106 / 106 |
| Actors | 6 / 6 |
| Non-screen functions | 19 / 19 |

| UC platform classification | Count |
| --- | --- |
| `WEB_ONLY` | 4 |
| `WEB_AND_MOBILE` | 33 |
| `ADMIN_WEB_ONLY` | 25 |
| `MOBILE_ONLY` | 15 |
| `NON_SCREEN` | 4 |
| `NOT_SPECIFIED` | 0 |
| `CONFLICT_REQUIRES_APPROVAL` | 2 |

Counts classify UCs once, not individual role allocations or observer screens. UC41 counts shared because Traveler uses both platforms; Operator cancellation remains Web-only. UC04–07 count shared with Provider/internal variants qualified by role. UC66 is System-triggered with shared human warning/cancellation surfaces. NON_SCREEN UC67/71/74/81 creates no human execution page. Android is the SRS Mobile target; Mobile implementation was not audited.

| UC implementation status | Count |
| --- | --- |
| `COMPLIANT` | 0 |
| `MISMATCH` | 16 |
| `MISSING_IMPLEMENTATION` | 13 |
| `AMBIGUOUS_REQUIREMENT` | 3 |
| `NOT_VERIFIED` | 51 |

Single-status precedence: demonstrated permission/behavior mismatch, then missing required Web workflow, then requirement ambiguity affecting assessment, otherwise NOT_VERIFIED. All conflicts remain visible regardless of status. Screen statuses are separate and are not counted as UC compliance. Approval gates: GAP-01–11 remain open; recent finance, Provider and account-governance proposals require Owner evidence. No requirement decision was approved by this update.

### Historical comparison

The previous develop matrix was a 72-UC V2-based historical snapshot. [PR #147](https://github.com/FPTUCapstone/Capstone_FE/pull/147) was rechecked: OPEN draft, branch `docs/web-scope-matrix-rebaseline-2026-11-08`, head `9c18bb4ef7fd77ea08db04e448a7c3b39c3f9380`, base develop. It was not reused, modified, merged or closed. The new branch starts from the fetched develop SHA in §A, not that historical branch. Other open PRs #63/73/91/151 are unmerged evidence and excluded from the baseline.

PR #147 ancestry was checked, not assumed: merge base with the audit develop is `feb3613d2373a5cea0231d65af3881da0566ecfb`; its head is 58 commits behind and 4 commits ahead of that develop. Final pre-publication fetch reconfirmed the §A baseline unchanged.

Per-ID comparison below is against the old develop matrix. Same ID may now mean another capability. All current rows trace to §2.2.2 and their exact detailed §C references; historical labels do not establish current scope. Unchanged capabilities are included for exhaustive accounting.

Historical inventory defect: the old canonical table has 72 rows but only 71 unique UC IDs: UC-63 appears twice (View Payout Records and Export Statistical Reports), and UC-67 is absent. Its old completeness claim was incorrect. Both duplicate names are retained below; absence of old UC67 does not mean current UC67 is newly invented.

| UC ID | Historical name → current name | Actor/platform comparison | Current source |
| --- | --- | --- | --- |
| UC-01 | Register Traveler Account → Register Traveler Account | Guest / SHARED_WEB_MOBILE → Guest / WEB_AND_MOBILE | §2.2.2; §3.2.1 |
| UC-02 | Register Tour Operator Account → Register Tour Operator Account | Guest / SHARED_WEB_MOBILE → Guest / WEB_AND_MOBILE | §2.2.2; §3.2.2 |
| UC-03 | Resubmit Tour Operator Application → Resubmit Tour Operator Application | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.2.3 |
| UC-04 | Sign In → Sign In | Guest / SHARED_WEB_MOBILE → Traveler / Tour Operator / Service Provider / Staff / Administrator (not yet authenticated) / WEB_AND_MOBILE | §2.2.2; §3.2.4 |
| UC-05 | Sign Out → Sign Out | Traveler / Tour Operator / Administrator / SHARED_WEB_MOBILE → Traveler / Tour Operator / Service Provider / Staff / Administrator / WEB_AND_MOBILE | §2.2.2; §3.2.5 |
| UC-06 | Reset Password → Reset Password | Guest / SHARED_WEB_MOBILE → Traveler / Tour Operator / Service Provider / Staff / Administrator (not yet authenticated) / WEB_AND_MOBILE | §2.2.2; §3.2.6 |
| UC-07 | Change Password → Change Password | Traveler / Tour Operator / Administrator / SHARED_WEB_MOBILE → Traveler / Tour Operator / Service Provider / Staff / Administrator / WEB_AND_MOBILE | §2.2.2; §3.2.7 |
| UC-08 | Update Traveler Profile → Update Traveler Profile | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.2.8 |
| UC-09 | Update Travel Preferences → Update Travel Preferences | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.2.9 |
| UC-10 | Create Scheduling Request → Create Scheduling Request | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.3.1 |
| UC-11 | View Suggested Itinerary → View Suggested Itinerary | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.3.2 |
| UC-12 | Explore Points of Interest → Explore Points of Interest | Guest / Traveler / SHARED_WEB_MOBILE → Guest / Traveler / WEB_AND_MOBILE | §2.2.2; §3.3.3 |
| UC-13 | Navigate Route → Navigate Route | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.3.4 |
| UC-14 | Receive Real-Time Alerts → Receive Real-Time Alerts | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.3.5 |
| UC-15 | Confirm Re-routing → Confirm Re-routing | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.3.6 |
| UC-16 | Download Offline Map & Itinerary → Download Offline Map & Itinerary | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.3.7 |
| UC-17 | Create Travel Group → Create Travel Group | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.4.1 |
| UC-18 | Invite Group Members → Invite Group Members | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.4.2 |
| UC-19 | View Group Members → View Group Members | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.4.3 |
| UC-20 | Remove Group Member → Remove Group Member | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.4.4 |
| UC-21 | Leave Travel Group → Leave Travel Group | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.4.5 |
| UC-22 | Configure Group Location Sharing → Configure Group Location Sharing | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.4.6 |
| UC-23 | Join Shared Group Trip → Join Shared Group Trip | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.4.7 |
| UC-24 | Search Tours → Search Tours | Guest / Traveler / SHARED_WEB_MOBILE → Guest / Traveler / WEB_AND_MOBILE | §2.2.2; §3.5.1 |
| UC-25 | Receive Tour Recommendations → Receive Tour Recommendations | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.5.2 |
| UC-26 | View Tour Details → View Tour Details | Guest / Traveler / SHARED_WEB_MOBILE → Guest / Traveler / WEB_AND_MOBILE | §2.2.2; §3.5.3 |
| UC-27 | Book Tour → Book Tour | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.5.4 |
| UC-28 | Make Electronic Payment → Make Electronic Payment | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.5.5 |
| UC-29 | View QR E-ticket → View QR E-ticket | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.5.6 |
| UC-30 | View Commercial Service → View Commercial Service | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.6.1 |
| UC-31 | Book Commercial Service → Book Commercial Service | Traveler / MOBILE_ONLY → Traveler / MOBILE_ONLY | §2.2.2; §3.6.2 |
| UC-32 | View Trip History → View Trip History | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.7.1 |
| UC-33 | Submit Trip Review → Submit Trip Review | Traveler / SHARED_WEB_MOBILE → Traveler / WEB_AND_MOBILE | §2.2.2; §3.7.2 |
| UC-34 | Update Tour Operator Profile → Update Tour Operator Profile | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.1 |
| UC-35 | Create Tour Package → Create Tour Package | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.2.1 |
| UC-36 | Update Tour Package → Update Tour Package | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.2.2 |
| UC-37 | Submit Tour for Approval → Submit Tour for Approval | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.2.3 |
| UC-38 | Create Coupon → Create Coupon | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.3.1 |
| UC-39 | Update Coupon → Update Coupon | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.3.2 |
| UC-40 | View Customer Bookings → View Customer Bookings | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.4.1 |
| UC-41 | Cancel Customer Booking → Cancel Tour Booking | Tour Operator / SHARED_WEB_MOBILE → Traveler / Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.4.2 |
| UC-42 | Initiate Booking Refund → Confirm Booking Refund | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / Staff / WEB_AND_MOBILE | §2.2.2; §3.8.4.3 |
| UC-43 | Check In Traveler by QR Code → Check In Traveler by QR Code | Tour Operator / MOBILE_ONLY → Tour Operator / MOBILE_ONLY | §2.2.2; §3.8.4.4 |
| UC-44 | View Revenue Report → View Revenue Report | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / CONFLICT_REQUIRES_APPROVAL | §2.2.2; §3.8.5.1 |
| UC-45 | Export Revenue Report → Export Revenue Report | Tour Operator / SHARED_WEB_MOBILE → Tour Operator / CONFLICT_REQUIRES_APPROVAL | §2.2.2; §3.8.5.2 |
| UC-46 | Request Payout Settlement → View User Accounts | Tour Operator / SHARED_WEB_MOBILE → Staff/ Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.1.1 |
| UC-47 | View User Accounts → Lock User Account | Administrator / ADMIN_WEB_ONLY → Staff/ Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.1.2 |
| UC-48 | Lock User Account → Unlock User Account | Administrator / ADMIN_WEB_ONLY → Staff/ Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.1.3 |
| UC-49 | Unlock User Account → Approve Tour Operator Application | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.2.1 |
| UC-50 | Approve Tour Operator Application → Reject Tour Operator Application | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.2.2 |
| UC-51 | Reject Tour Operator Application → Create POI | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.3.1 |
| UC-52 | Create POI → Update POI | Staff / ADMIN_WEB_ONLY → Staff/ Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.3.2 |
| UC-53 | Update POI → Remove POI | Administrator / ADMIN_WEB_ONLY → Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.3.3 |
| UC-54 | Remove POI → Create Route | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.4.1 |
| UC-55 | Create Route → Update Route | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.4.2 |
| UC-56 | Update Route → Configure Algorithm Parameters | Administrator / ADMIN_WEB_ONLY → Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.5 |
| UC-57 | Configure Algorithm Parameters → View Active Trips | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.6.1 |
| UC-58 | View Active Trips → View Active Trip Details | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.6.2 |
| UC-59 | View Active Trip Details → Approve Tour Post | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.7.1 |
| UC-60 | Approve Tour Post → Reject Tour Post | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.7.2 |
| UC-61 | Reject Tour Post → View Platform Bookings | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.8 |
| UC-62 | View Platform Bookings → Update Landing Page Content | Administrator / ADMIN_WEB_ONLY → Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.10 |
| UC-63 | View Payout Records / DUPLICATE ID: Export Statistical Reports → Export Statistical Reports | Administrator / ADMIN_WEB_ONLY → Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.11 |
| UC-64 | View Payout Details → View Audit Logs | Administrator / ADMIN_WEB_ONLY → Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.12.1 |
| UC-65 | Confirm Payout Settlement → View Audit Log Details | Administrator / ADMIN_WEB_ONLY → Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.12.2 |
| UC-66 | Update Landing Page Content → Handle Weather Warning and Operator Cancellation | Administrator / ADMIN_WEB_ONLY → System / Tour Operator / Traveler / WEB_AND_MOBILE | §2.2.2; §3.10.1 |
| UC-67 | Absent (historical omission) → Process Refund to Traveler | Added: System / NON_SCREEN | §2.2.2; §3.10.2 |
| UC-68 | View Audit Logs → Submit Post-Trip Complaint | Administrator / ADMIN_WEB_ONLY → Traveler / WEB_AND_MOBILE | §2.2.2; §3.8.6.1 |
| UC-69 | View Audit Log Details → Respond to Post-Trip Complaint | Administrator / ADMIN_WEB_ONLY → Tour Operator / WEB_AND_MOBILE | §2.2.2; §3.8.6.2 |
| UC-70 | Handle Emergency Tour Cancellation → Synchronize Offline Trip Data | Traveler / Tour Operator / NON_SCREEN → Traveler / MOBILE_ONLY | §2.2.2; §3.10.3 |
| UC-71 | Process Automatic Refund → Schedule Payout Settlement | Traveler / NON_SCREEN → System / NON_SCREEN | §2.2.2; §3.10.4 |
| UC-72 | Synchronize Offline Trip Data → View Payout Records | Traveler / MOBILE_ONLY → Staff/ Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.9.1 |
| UC-73 | Absent (new catalog ID) → Review Failed Payout Settlement | Added: Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.10.6 |
| UC-74 | Absent (new catalog ID) → Process Payout Settlement | Added: System / NON_SCREEN | §2.2.2; §3.10.5 |
| UC-75 | Absent (new catalog ID) → Respond to Partial Refund Proposal | Added: Traveler / WEB_AND_MOBILE | §2.2.2; §3.8.6.3 |
| UC-76 | Absent (new catalog ID) → Create Staff Account | Added: Administrator / ADMIN_WEB_ONLY | §2.2.2; §3.9.1.4 |
| UC-77 | Absent (new catalog ID) → Create Service Provider Account | Added: Staff / ADMIN_WEB_ONLY | §2.2.2; §3.9.1.5 |
| UC-78 | Absent (new catalog ID) → View Service Booking Requests | Added: Service Provider / WEB_ONLY | §2.2.2; §3.6.3 |
| UC-79 | Absent (new catalog ID) → Respond to Service Booking Request | Added: Service Provider / WEB_ONLY | §2.2.2; §3.6.4 |
| UC-80 | Absent (new catalog ID) → Record Service Outcome | Added: Service Provider / WEB_ONLY | §2.2.2; §3.6.5 |
| UC-81 | Absent (new catalog ID) → Generate Commission Statement | Added: System / NON_SCREEN | §2.2.2; §3.10.7 |
| UC-82 | Absent (new catalog ID) → Pay Commission Statement | Added: Service Provider / WEB_ONLY | §2.2.2; §3.6.6 |
| UC-83 | Absent (new catalog ID) → Confirm Commission Receipt | Added: Staff / ADMIN_WEB_ONLY | §2.2.2; §3.6.7 |

No current SRS ID was removed or renumbered. Old UC46 payout request is now View User Accounts; current Create POI is UC51. Old UC70/71/72 weather/refund/offline meanings now belong to UC66/67/70. UC71/74 are daily settlement jobs, UC72 internal payout records, UC76–83 account/commercial-service additions. Staff and Provider grants remain distinct. The old matrix had no complete keyed screen/NSF inventory, so historical per-screen removal cannot be established from it; new 106 screens and 19 functions reproduce the current original. Current #102–106 and NSF18/19 trace to 12-Nov additions; current #35/36/37 trace to UC76/63. Old manual-payout screens are historical change-log entries and do not renumber today’s source IDs. Blanket no-integration/all-finance-disabled claims are replaced by source evidence, not backend compliance claims.

### Validation record

- **PASS:** exact anchored inventory counts/uniqueness, source names, six actors, all 19 functions, Table5 name joins/grants, UC/screen ID integrity, local paths/anchors and MSG identifier existence.
- **FAIL (source consistency, retained):** BR-definition traceability for BR-114/117: source Table6 cites them but §5.1 has no definition rows. Documented GAP-11; source left unchanged. Requirement consistency remains unresolved for GAP-01–11; documenting the failures is not claiming source approval.
- **PASS:** `npm install`; `npm test` (93 Node tests passed; 340 Vitest files passed, 3,713 tests passed, five existing tests skipped); `npm run lint`; `npm run typecheck`; `npm run build`. jsdom navigation-not-implemented warnings occurred; exit code was 0. Existing npm audit reports 17 dependency findings (7 moderate, 10 high); no audit fix/dependency changes made.
- **SKIPPED:** configured Markdown lint/format and external-link crawler: none configured; structural/local-link checks substituted. Browser/viewport/accessibility manual QA not run for this documentation-only change. Backend/Mobile/deployment/financial execution remain NOT_VERIFIED. Existing test skips unchanged.
- **Scope:** only `docs/WEB_SCOPE_MATRIX.md` changed. No Capstone_Docs, Jira, SRS, application/API, Mobile, database, environment or deployment changes. PR #155 contains the documentation update.

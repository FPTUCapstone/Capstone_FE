# Web booking and Admin fixes

Status: approved by the user in this conversation, 20 November 2026.

## Scope and acceptance

1. Booking email remains required as in the existing Web form. Reject malformed
   addresses after trimming, show the existing inline error and focus behaviour,
   and do not call createBooking. Do not change Mobile's optional email policy.
2. On successful cancellation, immediately mark the displayed ticket Cancelled,
   remove QR/refresh/cancel/print controls and invalidate/reload ticket data.
   A failed reload must never restore an apparently usable old ticket. Retain the
   cancellation/refund result message and the return-to-trips link. A ticket
   loaded as Cancelled also has no print button. No deletion of historical records.
3. Public/Traveler tour discovery must show only tours having at least one
   bookable departure. Exclude sold-out, registration-closed, expired/cancelled
   schedules and itineraries the booking authority rejects. Preserve a tour
   with another eligible departure. Apply eligibility before pagination/counts
   using BE authority; do not fetch every detail card or filter one page and
   misrepresent totals. Direct detail/booking URLs still handle unavailable data.
   If current search contract lacks full eligibility, make a scoped BE change
   with regression tests; no data edits or new booking rules.
   Compatibility implementation: add optional BE `BookableOnly` (default false)
   and force it true in the Web public search proxy. Existing generic search
   callers keep their contract. Apply the same eligibility to recommendations;
   detail schedule bookability must reflect canonical itinerary validation.
4. Control Center cards link to existing Admin destinations already allowed by
   its sidebar: User Governance, Statistical Reports, Commission Reconciliation,
   Refund Reconciliation, POI Master Data and Audit Logs. Remove obsolete pending
   cards for these implemented modules. Preserve existing analytics tab.
5. Remove Staff Workspace entry from Admin navigation/dashboard only. Preserve
   Staff's own workspace, routes and access rules. Keep the earlier requested
   Algorithm Parameters navigation removal.
6. Audit Log must accept and display Staff actors in list/detail responses and
   permit filtering by Staff. Keep Administrator-only access to the audit screen.
   Existing unknown/invalid roles still fail parsing. Regression uses a mixed
   response with Staff alongside the other supported roles.

No new routes, roles, financial rules, dependencies, redesign, commit or push.
Preserve all current dirty changes.

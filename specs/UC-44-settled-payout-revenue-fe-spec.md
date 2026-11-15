# UC-44 — Settled Payout Revenue Presentation (FE)

## Status

Approved implementation scope: 15/11/2026. This document records the FE contract implemented on
`fix/linhnv-confirm-booking-refund`. Final PR validation is still required.

## Scope

The Tour Operator's booking summary and Revenue & Analytics screens must distinguish booking
value from cash actually transferred to the operator. The Web client is read-only for financial
calculation: it renders backend-ledger values and never derives a payout from gross value,
commission, or a refund in the browser.

Affected screens:

- `/partner/bookings`: summary uses `totalSettledPayoutAmount` and labels it **Settled Payout**.
- `/partner/revenue`: `summary.netAmount`, chart `netAmount`, tour detail `netAmount`, and the
  settlement card all mean **Settled Payout**.

Out of scope: changing the payout/refund calculator, gateway transfer, database migration, export
file calculation, and any demo fixture's non-authoritative figures.

## Backend contract

`GET /api/operator/bookings` returns `summary.totalSettledPayoutAmount`.
`GET /api/operator/revenue/report` returns `summary.netAmount`, each chart point's `netAmount`,
and each tour detail's `netAmount`. The BFF forwards these values unchanged.

The browser must show a failed/empty state if the backend contract is unavailable; it must not
replace a missing live value with a locally calculated estimate.

## Financial display rules

1. A newly paid booking inside the 24-hour holding window contributes **0 VND** settled payout.
2. A settled Advance/Final/Cancellation payout increases settled payout by its persisted payout
   amount.
3. A Tour Operator return reduces settled payout only after Staff has recorded
   `ReturnReceivedAtUtc`.
4. A 10,000 VND payment, 5,000 VND traveler refund, 7,000 VND settled advance, 3,500 VND received
   operator return, and 1,000 VND settled cancellation true-up displays 4,500 VND settled payout.
5. Gross booking value, refunds, net sales, and projected platform commission remain explanatory
   accounting fields. They must not be presented as a formula for the settled-payout card.

## Acceptance criteria

1. New paid booking: booking summary and revenue settled payout remain 0 VND before settlement.
2. The UI renders the backend 4,500 VND value in the partial-refund example above, including chart
   and summary, without recalculation.
3. Refund amount is displayed as the full traveler refund; it is not mislabeled as the TO return
   share.
4. The settlement card explicitly states that only settled payouts less Staff-confirmed returns
   are included.
5. Chart hover content includes Gross, Net, and Commission without clipping; the accessible table
   exposes the same values.
6. Loading, unavailable, empty, and keyboard-accessible control states remain covered by the
   existing revenue-view tests.

## Tests

- `operatorRevenueService.test.ts`: live result preserves backend `netAmount` (the 4,500 VND
  partial-refund/true-up case) rather than recalculating it.
- `OperatorBookingListView.test.tsx` and `operatorBookingService.test.ts`: settled-payout summary
  field and parser contract.
- `SettlementDetailsCard.test.tsx`, `OperatorRevenueView.test.tsx`, and `RevenueChart` tests:
  labels, explanatory text, data-table fallback, and chart content.

# UC-38 Web Screen Specification: Create Coupon

## Scope

An approved, active Tour Operator creates a coupon for one or more of their
approved tours. This screen creates a coupon only; listing, editing,
deactivation, redemption, payment and booking-price calculation are outside
UC-38.

## Route and access

- Route: `/partner/coupons/create`.
- The client must require an authenticated Tour Operator with an approved
  application before rendering the form. The API remains authoritative.
- A user who is not eligible is redirected using the existing partner-route
  decision flow; a server-side `403` is displayed as an actionable message.

## UX principles

- **Start simple:** only show fields required for the selected discount type;
  advanced limits are collapsed by default.
- **Prevent costly mistakes:** make the applicable-tour choice visible before
  submission, show a live discount example, and preserve all input on errors.
- **Use operator language:** display VND formatting and plain labels such as
  “Each traveler may use this coupon” instead of implementation terms.
- **Fast repeat work:** retain the operator's selected tours after a successful
  submission only when they choose “Create another”; otherwise return them to
  their coupon workspace.

## Form

The page is a responsive form with a sticky submit area on wide screens and a
single-column scrolling layout on small screens.

| Field | Rules |
| --- | --- |
| Coupon code | Required, uppercased as the operator types, 3-30 ASCII letters/digits/hyphens. A compact “Generate code” action fills a readable random value which remains editable. |
| Discount type | Percentage or flat VND amount. |
| Discount value | Required, positive. Percentage is 1-100. |
| Maximum discount | Required positive VND amount only for percentage discounts; hidden and omitted for flat discounts. |
| Minimum order | Required non-negative VND amount. |
| Total / per-traveler limits | Optional positive integers; blank means unlimited. |
| Valid from / to | Required local date-times converted to ISO-8601 UTC. `to` must be later than `from`. |
| Applicable tours | Required searchable multi-select with tour name, destination and price. Only currently approved tours returned by the eligible-tours API are selectable. The form always shows the selected count. |

The layout has four visual groups: **Coupon identity**, **Discount**,
**Availability**, and **Applicable tours**. Total/per-traveler limits are under
an “Add usage limits” disclosure so the normal flow is not overwhelmed.

Before submitting, a read-only summary shows the selected tour count, validity
window in the operator’s local time, and a sample calculation such as “10% off,
up to ₫200,000”. The sample is explanatory only and never promises booking
eligibility or final price.

The UI does not promise that client-side filtering is authorization; the
Backend verifies operator ownership and approval state again.

## API contract

`GET /api/v1/operator/coupons/eligible-tours` returns the current approved
operator's eligible tours. `POST /api/v1/operator/coupons` creates a coupon.

```json
{
  "code": "SUMMER10",
  "discountType": "Percentage",
  "discountValue": 10,
  "maxDiscountAmount": 200000,
  "minOrderAmount": 0,
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "validFromUtc": "2026-10-05T01:00:00Z",
  "validToUtc": "2026-10-31T16:59:59Z",
  "applicableTourIds": [101, 102]
}
```

Success is `201` with `{ couponId, code }`; it shows a confirmation with the
canonical code, a primary “Done” action and secondary “Create another” action.
A `409 coupon.code_conflict` is shown as a clear duplicate-code message.
Validation (`400`), access (`401/403`), missing tour (`404`) and ineligible
tour (`422`) errors use safe product copy. Requests use the established Web
authentication client; no token, backend URL, or raw HTTP logic belongs in the
component.

## States and accessibility

- Loading eligible tours; empty state when the operator has no approved tours.
- Inline validation runs on submit, not on every keystroke;
  errors name the correction needed. Submit remains disabled only while pending,
  so the operator can correct values immediately.
- The date/time inputs reject an end before the start. Time-zone copy explains
  that the device-local selection is converted to UTC for the API.
- Tour search has a clear empty state (“No approved tours available yet”) and a
  link back to the operator tour workspace rather than an unusable form.
- A sticky, mobile-safe action footer exposes selected-tour count and the
  submit action while preserving accessible reading order.
- Each input has an explicit label, validation uses `aria-invalid`, and the
  selected-tour control is keyboard operable.
- No price preview, redemption statistics, or coupon sharing UI is added.

## Acceptance criteria

1. An approved operator can create a percentage or flat coupon for selected
   approved tours.
2. Invalid combinations cannot be submitted locally and are still rendered
   safely if rejected by the API.
3. Duplicate codes show a code-specific error without losing form input.
4. Unauthorized, unavailable and unexpected errors do not expose technical
   details.
5. The route supports direct navigation, refresh, keyboard use and narrow
   desktop/mobile browser layouts.

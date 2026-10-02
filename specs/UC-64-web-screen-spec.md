# UC-64 Payout Details Web Screen Specification

## Route and scope

- Route: `/admin/payouts/[id]` inside the existing Administrator console layout, reached from
  the now-enabled [View Details] action on each Payout Records row (UC-63 D11).
- Read-only verification screen (SRS §3.9.9.2). [Confirm Settlement] (UC-65) and
  [Export Payout Statement] (deferred, D10) render as **disabled** placeholders with explanatory
  titles; no navigation or mutation exists on this screen.
- Data comes only from the same-origin `/api/admin/payouts/[id]` proxy (admin cookie session;
  strict canonical-decimal ID validation at both boundaries, no `parseInt`/`Number`).
- Transfer information is omitted: no bank-account storage exists in the schema (BE spec D7,
  defect recorded). No placeholder card is invented.
- Maintainer approval to implement without a Stitch-generated UI is recorded by developer
  approval of this specification (Stitch is optional per `CODEBASE_RULES.md`).

## Layout

- Header: back link to `/admin/payouts` ([Back to List]), eyebrow `Administrator finance`,
  title `PO-{id}` (`payoutCode`), status badge + text, operator company name identity line, and
  a manual Refresh button (no auto-polling).
- Payout header card: Payout Code, Tour Operator, Settlement Period
  (`dd/MM/yyyy – dd/MM/yyyy`), Requested Date (`dd/MM/yyyy HH:mm` CR-07; "Not available" when
  null), Status.
- Amount breakdown card: Gross Revenue, Commission Rate (`10%`, `12.5%`), Commission Amount,
  Net Payout Amount — Net Payout visually emphasized; every value VND-formatted (BR-79).
- Contributing booking list: table in an explicitly scrollable container — Booking Code, Tour
  Name, Paid Amount, Refunded Amount, Net Amount (right-aligned numeric columns); empty list
  renders MSG128 (`No data is available for the selected criteria.`) instead of blank space.
- Action row: [Confirm Settlement] and [Export Payout Statement], both disabled with
  explanatory titles; at 320px the two buttons stack full-width.
- Responsive: 768px single column; 320px cards stack and the booking table scrolls inside its
  own accessible region, preventing page-level horizontal overflow.

## States

- Loading uses an accessible `role="status"`; no section pretends to hold data before load.
- Success renders every section above.
- `404` (record missing — SRS names MSG128 explicitly for this UC, D3) shows locked MSG128 text
  `No records found matching your criteria.` with a Back-to-List action (SRS 2.a1).
- Forbidden shows locked MSG126: `You do not have permission to access this function.`
- Unavailable (`503`/network) shows locked MSG127 with Retry:
  `TripMate is temporarily unable to process your request. Please check your connection and try
  again.`
- `400` renders the BE ProblemDetails message verbatim in an error alert without Retry
  (UC-63 amended pattern).
- A `401` redirects to `/admin/login?returnUrl=%2Fadmin%2Fpayouts%2F{id}`.

## Field mapping

| UI | API field |
| --- | --- |
| Header / header card | `payoutCode`, `operator.companyName`, `periodStart`–`periodEnd`, `requestedAtUtc`, `status` |
| Amount breakdown | `grossRevenue`, `commissionRate`, `commissionAmount`, `netAmount` |
| Contributing bookings | `bookings[]`: `bookingCode`, `tourName`, `paidAmount`, `refundedAmount`, `netAmount` |

- Money renders with `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`;
  Commission Rate renders as a percentage.
- Timestamps render with `Intl.DateTimeFormat` using `timeZone: 'Asia/Ho_Chi_Minh'`
  (CR-07); periods are calendar dates rendered `dd/MM/yyyy`.
- The ID validator is the shared canonical-decimal one (`^[1-9]\d*$`, signed 64-bit maximum,
  digit-string comparison, no `parseInt`/`Number`).

## Accessibility and styling

- One `h1` with per-section `h2` headings; landmarks for header/main; `<th scope>` and caption
  on the booking table; labeled controls; disabled buttons carry accessible names and titles;
  visible focus retained; status never conveyed by color alone.
- Tailwind CSS 4 with the existing Admin navy/teal/coral palette and shared components; no new
  dependency, CSS module, chart, or table library.

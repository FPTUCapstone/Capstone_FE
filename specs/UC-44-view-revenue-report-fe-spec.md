# UC-44 — View Revenue Report (Web Specification)

## Status

Approved design decision. This specification defines the Frontend (Next.js) contract, UX states, and integration for Tour Operator Revenue Reporting (UC-44).

## Scope

Provides the responsive web interface for Tour Operators at `/operator/revenue` to review their own financial performance, KPI summaries, time-series charts, and tour-level revenue breakdowns. UC-44 is Web-first; it does not create a Mobile implementation until the SRS platform scope is amended.

Included:
- Route: `/operator/revenue` within the Operator console shell.
- Period filter controls: Date Range (Start Date, End Date), Granularity (Daily, Weekly, Monthly), Tour Package selector.
- Summary metrics: Gross Revenue, Net Payout, Platform Commission (with rate badge), Total Bookings, Total Participants, and Refunded Amount. Payments Received, Discounts Given, and Net Sales appear in the settlement detail card.
- Time-series Chart: Interactive revenue visualization (Gross vs Net payout) across selected time buckets.
- Detail Table: Per-tour metrics (Tour Name, Bookings, Travelers, Gross, Discount, Commission, Net).
- Empty, loading, and error states using the canonical message catalog: MSG31, MSG126, MSG127, and MSG128.
- Wire bridge: Integration between `operatorRevenueService.ts` / BFF proxy and Backend `/api/v1/operator/revenue/report`.

Excluded:
- File export trigger execution (UC-45: Handled via `ExportRevenueDialog`).
- Payout request submission flow (UC-46: Handled via `/operator/payouts`).

## Screen Design & UX Alignment

Based on SRS §3.8.5.1 and `Report3_Screens_All.html` (Screen UC-44 `https://tripmate.vn/operator/revenue`):
1. **Header & Top Bar**:
   - Title: "Revenue Report"
   - Selected Period badge: e.g. `01/08/2026 – 26/08/2026`
   - [Export] button only routes to UC-45 when that use case is available; otherwise it is disabled with an explanatory tooltip.
2. **Filter Controls**:
   - Date range pickers (Start Date, End Date) with inline validation `MSG29` if invalid.
   - Granularity tabs/dropdown: Daily, Weekly, Monthly.
   - Tour Package dropdown populated from `/api/v1/operator/revenue/tours` with "All tours" option.
   - [Apply Filters] action button.
3. **Primary Summary KPI Cards (responsive 4 + 2 layout)**:
   - Gross Revenue (before discounts), Net Payout, Platform Commission (with the applied rate), and Total Bookings.
   - Total Participants and Refunded Amount occupy the second responsive row.
4. **Middle Section (Grid 2/3 + 1/3)**:
   - Left: Time-series revenue chart with dual series (`Gross` vs `Net Payout`) and period labels (`W31`, `W32`...).
   - Right: Settlement summary card showing `Payments Received - Refunds - Commission = Net Payout`, plus Gross Revenue and Discounts Given as supporting figures. [Request Payout] only routes to UC-46 when it is available; otherwise it is disabled with an explanatory tooltip.
5. **Bottom Section**:
   - Detail table breaking down performance by tour package.
   - Responsive horizontal scrolling for mobile/tablet screens.

## Business Rules & Client Validation

- **BR-105**: Operates in the authenticated operator context. If the session expires or lacks operator role, redirect to sign-in or display `MSG126`.
- **BR-109 / BR-112**: Displays only server-computed verified figures. The client never calculates or guesses payments, refunds, commissions, or buckets locally in production mode.
- **Reporting date**: Sales are reported by successful-payment date; refunds are reported by refund completion date. The UI labels those dates and does not interpret the selected range as booking or departure date.
- **CR-07**: All dates are sent as `YYYY-MM-DD`, displayed as `dd/MM/yyyy`, and interpreted in `Asia/Ho_Chi_Minh`. Weekly labels are ISO Monday–Sunday labels supplied by the server; the client does not regroup data.
- **Validation**:
- `startDate > endDate` displays `MSG31` ("End date must be on or after the start date.") inline under the date inputs and disables submit.
  - Empty response displays `MSG128` ("No records found matching your criteria.") instead of an empty broken table.
  - Server/network error displays `MSG127` with a [Retry] button.

## BFF & Service Integration

- BFF Route: `GET /api/operator/revenue/report` forwards bearer token to Backend `GET /api/v1/operator/revenue/report`.
- BFF Route: `GET /api/operator/revenue/tours` forwards bearer token to Backend `GET /api/v1/operator/revenue/tours`; it preserves historical owned options returned by the server.
- Service layer `operatorRevenueService.ts` switches from `PENDING_BE_INTEGRATION` to live BFF calls. A deterministic fixture may be used only in explicit Storybook/test demo mode and is never enabled in production.

## Message Catalog Decision

- Use `MSG31` for an invalid period range; `MSG29` is reserved for invalid latitude/longitude.
- Use `MSG126`, `MSG127`, and `MSG128` respectively for authorization, recoverable system failure, and no records.
- Do not use `MSG115` for report success; it is the operator-application rejection-reason modal. A successful filter refresh renders the returned report; an optional generic toast uses `MSG129`.

# UC-44 — View Revenue Report (Web Specification)

## Status

Draft for approval. This specification defines the Frontend (Next.js) contract, UX states, and integration for Tour Operator Revenue Reporting (UC-44).

## Scope

Provides the responsive web interface for Tour Operators at `/operator/revenue` to review their own financial performance, KPI summaries, time-series charts, and tour-level revenue breakdowns.

Included:
- Route: `/operator/revenue` within the Operator console shell.
- Period filter controls: Date Range (Start Date, End Date), Granularity (Daily, Weekly, Monthly), Tour Package selector.
- Summary Cards: Gross Revenue, Payments Received, Discounts Given, Platform Commission (with rate badge), Net Amount Due, Total Bookings, Total Participants.
- Time-series Chart: Interactive revenue visualization (Gross vs Net payout) across selected time buckets.
- Detail Table: Per-tour metrics (Tour Name, Bookings, Travelers, Gross, Discount, Commission, Net).
- Empty, loading, and error states conforming to SRS message standards (MSG29, MSG115, MSG126, MSG127, MSG128).
- Wire bridge: Integration between `operatorRevenueService.ts` / BFF proxy and Backend `/api/v1/operator/revenue/report`.

Excluded:
- File export trigger execution (UC-45: Handled via `ExportRevenueDialog`).
- Payout request submission flow (UC-46: Handled via `/operator/payouts`).

## Screen Design & UX Alignment

Based on SRS §3.8.5.1 and `Report3_Screens_All.html` (Screen UC-44 `https://tripmate.vn/operator/revenue`):
1. **Header & Top Bar**:
   - Title: "Revenue Report"
   - Selected Period badge: e.g. `01/08/2026 – 26/08/2026`
   - [Export] button (launches UC-45 export dialog)
2. **Filter Controls**:
   - Date range pickers (Start Date, End Date) with inline validation `MSG29` if invalid.
   - Granularity tabs/dropdown: Daily, Weekly, Monthly.
   - Tour Package dropdown populated from `/api/v1/operator/revenue/tours` with "All tours" option.
   - [Apply Filters] action button.
3. **Summary KPI Cards (4-column grid)**:
   - Gross Revenue (e.g. `248.6M ₫`)
   - Payments Received (with pending payment subtext)
   - Discounts Given (with coupon redemption count)
   - Platform Commission (with commission % subtext)
4. **Middle Section (Grid 2/3 + 1/3)**:
   - Left: Time-series revenue chart with dual series (`Gross` vs `Net Payout`) and period labels (`W31`, `W32`...).
   - Right: Settlement summary card (Gross - Discounts - Refunds - Commission = **Net payout due**) with quick link/button [Request Payout].
5. **Bottom Section**:
   - Detail table breaking down performance by tour package.
   - Responsive horizontal scrolling for mobile/tablet screens.

## Business Rules & Client Validation

- **BR-105**: Operates in the authenticated operator context. If the session expires or lacks operator role, redirect to sign-in or display `MSG126`.
- **BR-109 / BR-112**: Displays only server-computed verified figures. The client never calculates or guesses commissions locally in production mode.
- **CR-07**: All dates formatted as `dd/MM/yyyy` in `Asia/Ho_Chi_Minh` timezone.
- **Validation**:
  - `startDate > endDate` displays `MSG29` ("Invalid date range.") inline under the date inputs and disables submit.
  - Empty response displays `MSG128` ("No records found matching your criteria.") instead of an empty broken table.
  - Server/network error displays `MSG127` with a [Retry] button.

## BFF & Service Integration

- BFF Route: `GET /api/operator/revenue/report` forwards bearer token to Backend `GET /api/v1/operator/revenue/report`.
- BFF Route: `GET /api/operator/revenue/tours` forwards bearer token to Backend `GET /api/v1/operator/revenue/tours`.
- Service layer `operatorRevenueService.ts` switches from `PENDING_BE_INTEGRATION` to live BFF calls when running against backend, with fallback for standalone demo mode.

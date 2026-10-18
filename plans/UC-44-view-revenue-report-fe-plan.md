# UC-44 — View Revenue Report (Web Plan)

## Preconditions

- Approve `specs/UC-44-view-revenue-report-fe-spec.md`.
- Backend endpoints `/api/v1/operator/revenue/report` and `/api/v1/operator/revenue/tours` defined in `specs/UC-44-view-revenue-report-be-spec.md`.

## Task 1 — BFF API Proxy Routes

Create Next.js App Router API handlers:
- `app/api/operator/revenue/report/route.ts`
- `app/api/operator/revenue/tours/route.ts`
- Forward session credentials, query parameters (`startDate`, `endDate`, `granularity`, `tourId`), and map status codes faithfully.

**Done when:** Proxy route tests verify authentication header forwarding and proper error mapping.

## Task 2 — Service Layer Real-Mode Integration

Update `src/features/operator/finance/services/operatorRevenueService.ts`:
- Replace `PENDING_BE_INTEGRATION` in production mode with fetch calls to the BFF routes.
- Retain deterministic mock fallback for offline demo mode when `isDemo: true`.
- Handle error codes (`MSG29`, `MSG126`, `MSG127`, `MSG128`) and empty data transformations.

**Done when:** Service tests verify both live API parsing and demo fallback modes.

## Task 3 — View Components Alignment & Testing

Verify and enhance `OperatorRevenueView.tsx` and child components:
- Ensure filter controls bind to router query state or local state with instant validation for invalid dates (`MSG29`).
- Ensure `RevenueSummaryCards` and `RevenueChart` handle zero-booking responses truthfully (`MSG128`).
- Verify English resource copy and currency formatting (`VND` / `₫`).

**Done when:** Component tests in `OperatorRevenueView.test.tsx` assert loading, populated, empty, and error states.

## Task 4 — Verification

- Run `npm run lint`.
- Run `npm test`.
- Verify production build with `npm run build`.

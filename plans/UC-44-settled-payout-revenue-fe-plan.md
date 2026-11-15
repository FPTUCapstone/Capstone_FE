# UC-44 — Settled Payout Revenue Presentation (FE) Plan

Spec: `specs/UC-44-settled-payout-revenue-fe-spec.md`.

## Task 1 — Contract and terminology

- Keep `totalSettledPayoutAmount` in the operator-booking response type/parser.
- Keep `netAmount` as the backend-provided settled payout in the revenue response types.
- Replace ambiguous copy such as “Confirmed Revenue” or a net-sales formula with **Settled Payout**
  and explanatory text that identifies settled transfers and Staff-confirmed returns.

Definition of done: parser/service tests prove the values are passed through untouched.

## Task 2 — Revenue views

- Render the settled-payout value in summary cards, settlement breakdown, chart, and tour details.
- Keep gross value, refunds, net sales, and commission as separate accounting context.
- Keep the chart tooltip visible and the table fallback available to keyboard and screen-reader users.

Definition of done: component tests cover labels, all chart values, and the table fallback.

## Task 3 — Regression cases

- Add a live-contract test for a 10,000 VND payment / 5,000 VND traveler refund / 4,500 VND final
  settled payout result.
- Verify a newly paid booking exposes 0 VND settled payout until its backend settlement arrives.
- Verify a return is deducted only after it is Staff-confirmed, through BE unit/integration tests.

Definition of done: FE contract tests and BE settlement/refund tests are green.

## Task 4 — Final verification

Run on the final branch HEAD:

```text
FE: npm ci; npm test; npm run lint; npm run typecheck; npm run build
BE: dotnet restore; dotnet build -c Release; dotnet test; dotnet format --verify-no-changes
SQL: migration on fresh DB, upgrade DB, and second idempotent run
```

Manual evidence: confirm the five financial-display rules in the spec through the live BFF/API,
then capture desktop and mobile screenshots. Record commands, commit SHA, exit code, pass/fail,
and skips in the PR description.

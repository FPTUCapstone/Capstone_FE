# TO monthly commission Web plan

1. Tests first for list contract, safe payment URL, fixed-amount Mock completion and paid/ownership states; no positioning-only tests.
2. Add shared statement DTO/presentation helpers and BFF Mock completion; connect current list/detail to BE payload/provider/actions.
3. Add commission navigation/workspace/dashboard entry and retain legacy payout destination. Correct Admin list parser for paginated BE output.
4. Focused tests/lint/typecheck and two-pass self-review if agents unavailable. Run local routes after BE migrations. No full production build, commit, push or deployment without request.


## Completed verification — 27/11/2026

- 8 focused commission tests passed; ESLint and typecheck passed.
- Calculation breakdown includes original-rate refund credits, carried credits, held and ambiguous historical rows. Zero payable has no payment action or payment deadline.
- Independent review findings addressed; checkout expiry includes dd/MM/yyyy HH:mm.
- Correct native FE running at localhost:3001 against BE localhost:5022. Admin session/list/screen checks returned 200. No live statement issuance or real payment performed.

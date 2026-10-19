# PR #54 finance screen specification audit

Status: **approval pending / implementation blocked for financial mutations**

This audit records the traceability state for the operator revenue and payout UI. It does not represent Product, BA, UX, or Web Screen Specification approval.

## Source review

- Report 3 SRS V2 remains authoritative for business scope.
- `Capstone_Docs/docs/web-ui-coverage-matrix.md` records UC-44, UC-45, and UC-46 with **no Web Screen Specification** and assigns them to a later batch.
- `Capstone_Docs/TRIPMATE_WEB_SCREEN_WORK_ALLOCATION_DRAFT.md` is explicitly a draft and cannot be used as approved screen authority.
- No approved Web Screen Specification for the finance routes was found in the repository documentation reviewed on 2026-10-14.
- `SRS_FINANCIAL_FORMULA_DECISION_PENDING` remains unresolved. This change does not select or implement a financial formula.

## Audited surface

| Area | Current surface | State and limitation |
| --- | --- | --- |
| Revenue route | `/partner/revenue` | Read-only loading, empty, error, production-pending, and explicitly gated demo presentation exist. Export triggers are disabled with “Backend integration pending”. |
| Payout route | `/partner/payouts` | Read-only loading, empty, error, production-pending, and explicitly gated demo presentation exist. Payout request, cancellation, and bank editing triggers are disabled. |
| Revenue layout | Summary cards, chart, filters, detail table | Responsive grids and horizontal table overflow are retained. Financial values remain non-authoritative while backend integration and formula decisions are pending. |
| Payout layout | Settlement periods, beneficiary bank, request history | Responsive grids and horizontal table overflow are retained. No mutation is exposed as usable. |
| Dialog behavior | Request and cancellation dialogs | Initial focus, contained Tab/Shift+Tab navigation, Escape close when idle, body scroll lock, and focus restoration are implemented and tested for future contract-backed activation. |
| Unavailable actions | Export, payout request/cancel, bank Edit/Save | Disabled at the trigger. Visible and programmatic explanations state “Backend integration pending”. No fake financial operation is initiated. |

## Approval blocker

An approved Web Screen Specification must define the final screen ownership, route/state behavior, responsive breakpoints, accessibility acceptance criteria, and backend contracts before these financial mutations can be enabled. Until that approval and the corresponding backend contracts exist, this PR intentionally leaves the actions disabled.

# UC-75 Respond to Partial Refund Proposal — Web screen #97

Source: SRS §3.8.6.3, BR-143, BR-153, job #16; screen #97 is `WEB_AND_MOBILE` in `docs/WEB_SCOPE_MATRIX.md`.
Backend contract: Capstone_BE `specs/UC-75-respond-partial-refund-proposal-spec.md`
(branch `feature/phuctv-uc75-partial-refund-response`).

## Scope

In scope:

- Route `/account/complaints/{complaintId}/partial-refund-proposal` (`ROUTES.account.partialRefundProposal`),
  Traveler only (account shell guard), rendered without the account tab header like the e-ticket page.
- Proposal area: booking code, Proposed Amount (VND), Response Deadline (Asia/Ho_Chi_Minh), status.
- Buttons [Accept] and [Decline]; each opens a confirmation dialog (Normal Flow step 3 "confirms the choice").
- BFF routes `GET /api/v1/traveler/complaints/{id}/partial-refund-proposal` and
  `POST .../partial-refund-proposal/response` (`{ "decision": "Accept" | "Decline" }` only).

Out of scope (owned elsewhere): complaint form and complaint detail (UC-68, TM-222), the Operator response
(UC-69), refund confirmation and payment (UC-42, UC-67), notifications inbox (Web has none).
Entry point today is the direct link; the complaint detail link is added with UC-68.

## Messages

| Case | Shown |
|---|---|
| Response recorded | MSG164 (success alert; team decision G2) |
| Window closed, already answered, or late answer (G1, G5) | MSG165, buttons hidden, proposal reloaded |
| Not the booking owner | MSG126 |
| System or network failure | MSG127, status stays Awaiting Traveler Response, buttons stay |
| No proposal for the complaint (also until TM-222 lands) | "No partial refund proposal was found for this complaint." |

## Status display

| Status | Label | Note |
|---|---|---|
| AwaitingTravelerResponse | Awaiting your response | No response by the deadline counts as Decline (BR-153). |
| Approved | Accepted | Paid after the Tour Operator confirms it (BR-143). |
| Declined | Declined | Handled under the partnership contract. |

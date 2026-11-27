# TO monthly commission Web — approved scope

Use the monthly TO statement as the only payment amount source. Menu/dashboard entry Hoa hồng & Thanh toán opens /partner/commission-statements, with owned list and detail. Preserve old payout routes under a separate legacy entry. Show period, eligible revenue, commission rate, amount due, due date and paid status. Format dd/MM/yyyy in Vietnam time and right-align money.

PayOS opens only a validated HTTPS payOS checkout returned by the server. Pending links can be reopened/reused; never replace detail with a dead-end link screen. Returning/focusing refreshes payment status. Never mark Paid from redirect alone. Server-authorized Mock completion is explicitly marked test-only, requires confirmation and a paymentId matching the statement; no amount input. Completion refreshes authoritative statement. Role/origin/ownership checks remain at BFF/BE.

GET list contract is {items,totalCount,pageNumber,pageSize}, optionally wrapped in data. No silent empty list on invalid DTO. Loading, empty, errors, retry, filters/paging and immutable paid state must be readable. No browser credentials/secrets/raw backend URLs. No new provider calls during verification.

Carry-forward approved 27/11/2026: show revenue, refund commission reductions, prior credit applied and remaining next-period credit when supplied by BE. A zero payable statement shows that no payment is required; never display it as an unpaid debt or offer a payment button. Issued statements remain immutable; held entries are included later after resolution.

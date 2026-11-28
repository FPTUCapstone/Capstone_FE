# Direct refund lists

Requested replacement for Admin and TO case-ID lookup placeholders. Admin lists disputed cases and cases with a recorded dispute decision so resolved/reopened cases remain discoverable. TO lists own direct refunds, scoped on BE by booking/tour ownership. Status filter supports all existing case states, with no changes to state transitions or refund amounts.

Table columns: case, booking code, status, refund amount aligned right, opened date dd/mm/yyyy in Vietnam time, and Chi tiết link. Admin links to /admin/direct-refund-disputes/{caseId}; TO links to /partner/refunds/direct/{caseId}. Page size 20, stable descending creation/id order, previous/next pagination, refresh, loading, error/retry and empty states. Remove manual ID input. Existing detail screens and legacy refund handlers remain unchanged.

Endpoints GET /api/v1/admin/direct-refund-disputes and GET /api/v1/operator/direct-refunds take pageNumber/pageSize/status only. Response {items:[{caseId,bookingCode,status,refundAmountVnd,createdAtUtc}],totalCount,pageNumber,pageSize}. Never expose bank details, credentials, storage keys or another TO's data in lists. No DB migration required.

# Inline refund implementation

1. Add failing TripCard expand/collapse and flow-resolution tests.
2. Add InlineBookingRefund resolver; give existing DirectRefundCasePage/RefundProgressPage an embedded rendering option, preserving their action handlers. Switch the real booking refund link to an accessible disclosure button.
3. Run focused component tests, lint/typecheck and review; no BE/data changes, no push or deployment.

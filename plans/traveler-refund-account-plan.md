# Traveler default refund account implementation

1. BE entity/encrypted storage, owner-scoped query/command/controller and idempotent SQL migration, tests for authorization, validation and immutable case snapshots.
2. FE account tab/route and form, authenticated no-store BFF GET/PUT with CSRF origin checking and field allowlist; TDD form save/reload and proxy ownership boundaries.
3. Integrate shared direct-refund creation/manual-recipient path with saved default. Existing cases retain their original recipients.
4. Run focused tests/lint/typecheck/reviews, back up local DB then apply only additive migration and verify idempotence. Restart BE, read-only endpoint check. No real payment/refund, push or production change.

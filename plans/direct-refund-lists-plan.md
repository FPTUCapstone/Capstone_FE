# Direct refund lists implementation

1. Add paginated read-only Application query and thin Admin/TO list endpoints with ownership/role/status validation and focused isolation/count/order tests.
2. Add regression tests for both detail link routes, list response parsing, filter/reset/pagination and errors. Replace Admin placeholder and TO /partner/refunds page using existing visual language and shared scoped list component.
3. Add TO BFF list delegation and query allowlist; reuse existing Admin BFF session checks. Test authenticated forwarding without client-supplied ownership.
4. Run focused tests, lint/typecheck, two-pass review and restart local BE. Verify live read-only Admin list/details. No business data mutations, migration, push or deployment.

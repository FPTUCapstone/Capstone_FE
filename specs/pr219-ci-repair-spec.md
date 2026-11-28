# PR 219 CI repair

Scope authorized by the request to fix and push the failing PR: repair test fixtures and assertions that no longer match the approved commission navigation, refund modal, localized labels and contract workspace composition. Preserve production behavior and every test; do not skip tests or loosen business/security expectations.

Acceptance: tests provide their Next router/session and complaint-eligibility dependencies explicitly, verify current observable actions and labels, and the existing CI test, lint, typecheck and build commands pass. No product routes, API contracts, payment behavior or credentials change.

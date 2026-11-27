# payOS FE implementation slice — 25/11/2026

Approved implementation request follows `direct-operator-payment-refund-plan.md`, limited to supplied BE onboarding/payment/tour-gate endpoints. Screen spec: `../specs/payos-onboarding-web-screen-spec.md`.

1. Inspect BE controller/DTO/allowed actions, current guards/BFF/payment flow; run clean baseline. Baseline: Node 107 pass; Vitest 4605 pass, 5 existing skips. No BE edits.
2. Write failing tests for BFF role/CSRF/request bound/secret projection and TO submit-clear-verify; implement `src/features/operator/payment-settings/{paymentChannel,paymentChannelService,paymentChannelProxy,PaymentSettingsScreen}` and `app/api/operator/payment-channel/`.
3. Write failing Admin tests; implement `src/features/admin/operator-payment-channels/`, sealed-session page guard, `app/api/admin/operator-payment-channels/` allowlist. Include operation/version/reason and reload; never return keys.
4. Write failing gate/payment-error tests; add review blocker translation/link and safe Traveler `payment.channel_not_ready` propagation. Existing payment endpoints/canonical status remain; no invented beneficiary fields missing from BE DTO.
5. Add `/partner/payment-settings` and `/admin/operator-payment-channels` to central routes, nav/dashboard/breadcrumbs. Partner follows approved/contract guard. Draft editing remains available; backend gate is submit-review, not all-route lock.
6. Two-stage review per AGENTS: spec compliance then quality/security. Address with regression tests: empty later page keeps previous-page action; ignore aborted reads; Admin dialog suppresses unrelated legal footer, defaults unchanged elsewhere.
7. Focused/full npm tests, lint, typecheck/build; report actual results. No CSS-only assertion tests or real credential/payment submission in automation.

## Integration boundary

BE `PayOsChannelVerifier.cs` explicitly remains stub PendingAdminApproval, no provider call/webhook registration. Approve passes an unset WebhookUrl into a domain method requiring a non-empty URL. FE mocks do not fix these BE blockers: no real onboarding/payment E2E success is claimed. Admin list has masked account data and no technical-verification evidence field; PendingVerification alone is not verified ownership.

Refund/commission screens and BE/Mobile implementation are outside this slice. No push/PR/deploy requested.

## Final verification results

- `npm test -- --maxWorkers=4`: Node checks 107 pass; Vitest 4624 pass / 5 existing skips, 425 files. Earlier full run loaded two regression tests before their fixes; final full rerun passed without excluding them.
- `npm run lint`: pass. `npm run typecheck`: pass, including post-build generated routes.
- `npm run build`: pass with default Next/Turbopack configuration after removing only generated `.next/cache/turbopack` cache. Earlier cached builds failed spawning CSS loader processes; no source/build-config workaround was added.
- Focused regression set: 115 pass. Two-stage read-only spec and quality/security reviews completed; three findings fixed and re-reviewed.
- Isolated browser fixtures at 390/768/1440px: no document overflow, keyboard field order, reason-required approval and Escape dismissal pass; screenshots inspected. This was component fixture testing without Next layout fonts/authenticated BE integration, not a real provider E2E.
- `git diff --check`: pass. No BE/Mobile edits, secret submissions, money transfers, commit/push or deployment in this implementation slice.

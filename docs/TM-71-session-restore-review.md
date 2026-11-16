# TM-71 local session restoration fix

FE baseline is `594f6f0221549afda2143619b55ade2d1a3098ec`, branch `fix/tm71-session-restore`. Worktree is isolated. Current BE develop was read as `590a11f4a3b6377b9191d11f4b6adde003fe24cb`. No Backend code is changed.

## Verified cause

At the baseline, authSession starts with a null in-memory context. useWebSession asynchronously redeems the cookie with webRefresh. WebSessionProvider renders children immediately. ExploreToursPage's recommendation effect depends only on isDemo, while requestRecommendations synchronously requires AuthStorage.getAccessToken. A cold request fails locally with 401 and becomes MSG127. Restoring the session later cannot retrigger that effect.

## Change

SessionRecommendations observes the existing session hook. Only an Active Traveler mounts the recommendation state. Its React key is the user identity, so logout and account changes remove the previous list immediately. The child aborts its requests on unmount and ignores late resolutions before updating UI or pagination. Token replacement, locale and filters do not remount the child or trigger an automatic refresh. Explicit refresh uses the latest criteria and retains a successful list on genuine system errors. Demo remains subject to the existing production gate. Tokens remain in memory.

The service refresh single-flight is scoped by user ID and forgets an aborted refresh, preventing an in-flight response for one Traveler from being reused for another.

## Regression evidence

Before the fix the cold-start test failed because MSG127 was visible while the cookie refresh was still pending. Guest and non-Traveler tests failed for the same false error. After the fix eight integration tests pass through real webRefresh, AuthStorage and tourApi with controlled fetch promises. They cover delayed restore, rejected restore, non-Traveler roles, token rotation, delayed POST on logout, account switch and unmount. No fixed sleeps are used. Existing page/service tests now supply a valid session and assert request cancellation.

Verification on 2026-11-16: npm install completed (17 dependency audit findings, unchanged lockfile). Full npm test recorded 94 Node tests passed with zero skips and 4119 Vitest tests passed with five existing skips. The final focused recommendation/auth integration rerun passed 61/61. An existing bilingual label test intermittently read before the asynchronous locale update; it now awaits the label. The final ordered install/test/lint/typecheck/build sequence exited zero. JSDOM prints unsupported navigation warnings in existing tests.

## Reproducible test data

Reuse the existing Backend fixture in `tests/TripMate.Api.IntegrationTests/TourRecommendations/TourRecommendationSqlServerTests.cs`. Set `TRIPMATE_SQLSERVER_TEST_CONNECTION` outside source control to a disposable SQL Server master connection. Run:

```powershell
dotnet test tests/TripMate.Api.IntegrationTests/TripMate.Api.IntegrationTests.csproj --filter "FullyQualifiedName~TourRecommendationSqlServerTests"
```

The harness creates independent TripMate_Test databases, applies the canonical schema and migrations, seeds Active Travelers and approved/public/bookable Tours, and removes its own databases afterwards. Exact threshold test persists 80.00 as excluded and 80.01 as included. Pagination and availability tests verify ordering and counts. The large-catalogue fixture logs 250 candidates without a cap. Dates are relative to the fixture clock, which is controlled in the tests. This harness covers API/SQL behavior rather than browser rendering.

For a browser test with future real-clock dates, the existing delivery fixture `tm71-delivery/tm71-e2e-seed.sql` generates 23 tours with departure 30 days ahead, capacity 10 and 2 reserved. Its explicit database-name guard must remain pointed at a disposable database. Supply the test password hash through sqlcmd QaHash, never through a tracked file. Seed once in a fresh database with the schema and all existing migrations. Interest tag beach and no optional criteria produce the previously approved 100-point fixture. The threshold cases use the SQL integration fixture above. No fixture was written to a shared deployed database in this fix.

## Deployment boundary

Web dev alias returned HTTP 200. The observed x-vercel-id is a request identifier, not a verified deployment ID. FE/BE deployed SHAs and deployment ID remain NOT_VERIFIED. GitHub's successful Vercel/check result for a source SHA does not identify the alias content. Browser API base depends on NEXT_PUBLIC_API_URL; the local unset development default is http://localhost:5021/api/v1 and production fallback is /api/v1.

Source publication and CI validation do not establish deployed regression acceptance. That acceptance is pending a deployment containing this fix and isolated test data. Prior live acceptance does not establish acceptance for this new session fix. Keep TM-71 open pending that verification.

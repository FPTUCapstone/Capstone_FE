# TM-71 session restoration correction

The assigned fix waits for the existing Web session restore before requesting personalized tours, while public search continues. Active Traveler identity determines ownership of recommendation state. Logout, account changes and unmount invalidate pending requests. Token rotation, locale and search filters do not recompute snapshots. GET latest, initial missing-snapshot POST, explicit refresh, pagination and D1–D7 remain binding.

Implementation plan: reproduce the cold-start failure with controlled fetch promises through real webRefresh, AuthStorage and tourApi. Scope recommendation state to a mounted Traveler identity. Abort and ignore stale work, including explicit refresh and page requests. Partition refresh single-flight by session identity. Verify cold start, denied restore, roles, account changes, token replacement and unmount. Run npm install, test, lint, typecheck and build in order. The user's request authorizes this scope and plan.

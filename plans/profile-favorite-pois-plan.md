# Traveler Profile Favorite POIs Page (Frontend Plan)

## Task 1: Routes & Account Workspace Navigation (TDD)
- **Files:**
  - `src/features/account/common/__tests__/AccountWorkspaceNav.test.tsx` (update/add assertions for `favorites` tab first)
  - `src/features/account/common/__tests__/AccountWorkspaceShell.test.tsx` (add test for `/account/favorites` active tab & breadcrumb)
  - `src/lib/routes.ts` (add `account.favorites`)
  - `src/features/account/common/resources/en.ts` (add `tabs.favorites`)
  - `src/features/account/common/AccountWorkspaceNav.tsx` (add `'favorites'` tab)
  - `src/features/account/common/AccountWorkspaceShell.tsx` (add `TAB_METADATA.favorites` & `resolveAccountTab`)

## Task 2: Favorite POIs List API Client (TDD)
- **Files:**
  - `src/features/public/pois/services/poiFavoriteApi.test.ts` (add failing tests for `listFavoritePois` first)
  - `src/features/public/pois/services/poiFavoriteApi.ts` (add `FavoritePoiItem`, `PagedFavoritePois`, `listFavoritePois`)

## Task 3: Favorite POIs Page, Card & App Route (TDD)
- **Files:**
  - `src/features/account/favorites/__tests__/FavoritePoisPage.test.tsx` (write failing behavioral tests first: loading, list rendering, unfavorite + pagination backfill/step-back, unfavorite error recovery, empty state, load error + retry, pagination navigation)
  - `app/account/favorites/page.test.tsx` (route metadata & render test)
  - `src/features/account/favorites/FavoritePoiCard.tsx`
  - `src/features/account/favorites/FavoritePoisPage.tsx`
  - `app/account/favorites/page.tsx`

## Task 4: Pre-PR Validation Gate
- Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` inside `D:\CapStone\.worktrees\favorite-pois-fe`.

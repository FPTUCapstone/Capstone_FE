# Traveler Profile Favorite POIs Page (Frontend Spec)

## 1. Scope
- Add a dedicated Favorite POIs page under the Traveler Account workspace at `/account/favorites`.
- Add a navigation tab (`Favorite Places` in `AccountWorkspaceNav`, Vietnamese breadcrumb/header `Địa điểm yêu thích` in `AccountWorkspaceShell`) so signed-in Travelers can view and manage all POIs they favorited on `/pois/[id]`.
- Integrate directly with `GET /api/v1/pois/favorites` (list) and `DELETE /api/v1/pois/{poiId}/favorite` (remove favorite).

## 2. Routes & Access Control
- Route constant: `ROUTES.account.favorites = '/account/favorites'` in `src/lib/routes.ts`.
- App Router page: `app/account/favorites/page.tsx` (Server Component with metadata).
- Traveler-only guard inherited from `AccountWorkspaceShell` (and defensive standalone guard in `FavoritePoisPage`, matching `TravelerProfilePage` / `TripHistoryPage`):
  - Unauthenticated → redirect to `/sign-in?returnUrl=%2Faccount%2Ffavorites`.
  - Non-Traveler roles → redirect to their workspace.

## 3. UI & Behavior Requirements
- **Visual identity:** Coastal Heritage Vietnamese palette inside `AccountWorkspaceShell` (`#F7F5EF`, `#1C2928`, `#5B6E69`, `#174B4A`, `#103B39`, `#DCE2DD`), reusing `PoiImage`, `PoiCategoryIcon`, `getPoiCategoryVisual`, `formatDuration`, `formatReviewCount`, and `PoiPagination`.
- **Header:** Page title `Địa điểm yêu thích`, concise subtitle, saved count badge (when loaded), and secondary CTA `Khám phá địa điểm` linking to `/pois`.
- **Card content (`FavoritePoiCard`):**
  - Thumbnail with open/closed badge (`● Đang mở cửa` / `○ Đã đóng`).
  - Category badge + icon and rating pill (`★ X.X` when `averageRating !== null`).
  - POI name linked to `/pois/[id]`.
  - Address (fallback `Địa chỉ đang được cập nhật`).
  - Chips: visit duration, indoor/outdoor, shelter (if `hasShelter`), and saved date (`Đã lưu DD/MM/YYYY` in `Asia/Ho_Chi_Minh`).
  - Review count summary.
  - Actions: `Bỏ yêu thích` button (filled rose heart, accessible `aria-label`, disabled during request) and `Xem chi tiết →` link to `/pois/[id]`.
- **Unfavorite behavior:**
  - Calls `setPoiFavorite(poiId, false)`.
  - On success: removes item from view and refreshes pagination cleanly (if removing the last item on `page > 1`, navigates to `page - 1`; if more pages exist behind current page, reloads current page so items backfill smoothly).
  - On failure: keeps item in list and renders an inline `role="alert"` error message.
  - On `401`: redirects to `/sign-in?returnUrl=%2Faccount%2Ffavorites`.
- **States:**
  - Loading skeleton (`role="status"`, `aria-busy="true"`).
  - Error state (`role="alert"`) with `Thử lại` button.
  - Empty state with friendly guidance and CTA linking to `/pois`.
  - Pagination via `PoiPagination` when `totalPages > 1`.

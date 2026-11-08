# Spec: Bản đồ lộ trình web đi theo đường thật (WEB-ROAD-ROUTE) — v1.0, ĐÃ DUYỆT

Repo: Capstone_FE, base `origin/develop` @ feb3613 (local `Capstone_FE_DEVELOP` đang lùi 62 commit → dùng worktree mới cắt từ origin/develop).
Branch dự kiến: `feature/web-itinerary-road-route`. Không đụng BE/Mobile.

## 1. Hiện trạng (đã đọc trên origin/develop)
- `utils/mapGeometry.ts` `buildItineraryMapModel` → `route` = LineString thẳng: start → các stop có toạ độ → end.
- `components/maps/MapboxItineraryMap.tsx`: nguồn GeoJSON `itinerary-route` + layer `itinerary-route-line` (dashed `[2,1.5]`), `setData(model.route)` mỗi lần model đổi.
- `ViewSuggestedItineraryPage.tsx` ~dòng 942: "Đường nối thẳng theo thứ tự ghé, không phải đường đi thực tế." `mapModel` rebuild khi đổi tab ngày (`activeDayKey`).
- DTO đã có mode từng chặng: `items[].transportModeFromPrevious` + `itinerary.transportMode` (mặc định chuyến). Chưa cần BE thay đổi.
- Mobile: `mapbox_directions_repository_impl.dart` dùng `mapbox/walking` cho Walking; Motorbike/Car/PublicTransit/null → `mapbox/driving`; `geometries=geojson&overview=full`. Web làm cùng quy tắc.
- Web đã gọi `api.mapbox.com` từ client (`placeSearchApi.ts`, `fetch` + token `pk.`); FE không có CSP `connect-src` nên không cần đổi header.

## 2. Phạm vi
IN: vẽ đường theo đường bộ cho từng chặng; fallback từng chặng; cache; cập nhật chú thích; test.
OUT: turn-by-turn/steps, thời gian/khoảng cách lấy từ Mapbox (giữ số của BE), profile cycling, dependency mới, proxy qua BE, đổi UI marker/timeline, trang khác (POI map, radius map).

## 3. Thiết kế
**3.1 Model (`mapGeometry.ts`)** — thêm `legs: ItineraryRouteLeg[]` vào `ItineraryMapModel` (giữ nguyên `route` để fallback + test cũ):
`ItineraryRouteLeg { key: string; from: LngLat; to: LngLat; profile: 'walking' | 'driving' }`.
- Chặng = hai điểm liền kề trong `route`. Chặng bỏ qua nếu hai đầu trùng (`samePlace`).
- Mode của chặng vào stop X = `X.transportModeFromPrevious ?? itinerary.transportMode`; chặng vào end = `itinerary.transportMode`. `Walking` → walking; còn lại (Motorbike/Car/PublicTransit/null) → driving (Mapbox không có motorbike; trang đã ghi giờ xe máy là ước tính trên đường ô tô).
- `key` = `${profile}:${lng},${lat};${lng},${lat}` (làm tròn 5 chữ số) — dùng làm cache key.

**3.2 Client Directions (file mới `utils/mapboxDirections.ts`, thuần, không React)**
- `fetchRoadLeg(leg, token, signal): Promise<LngLat[] | null>` → `GET https://api.mapbox.com/directions/v5/mapbox/{profile}/{lng,lat;lng,lat}?geometries=geojson&overview=full&alternatives=false&access_token=…`.
- Trả `null` khi: lỗi mạng, HTTP không ok (401/403/422/429/5xx), `routes[0].geometry.coordinates` thiếu/không hợp lệ (<2 điểm, không phải số). Không throw (trừ AbortError → trả `null` và caller bỏ qua nhờ signal).
- Cache module-level `Map<key, Promise<LngLat[]>>` cho kết quả **thành công** (xem 3.2a/3.2b cho chặng lỗi và sessionStorage). Token không nằm trong key (một token mỗi phiên). Chặn tăng vô hạn: tối đa 200 key (xoá cũ nhất).
- Token `pk.` public hiện có; không log token.

**3.2a Nhớ chặng lỗi (v1.1, theo yêu cầu giảm số lần gọi)**
- Chặng lỗi được ghi nhớ `FAILURE_TTL_MS = 5 phút` (so với `Date.now()`; test dùng fake timers cho `Date`): trong thời gian đó `fetchRoadLeg` trả `null` mà không gọi Mapbox. Hết hạn → thử lại.
- HTTP 401/403 → cờ `refused` cho cả phiên trang: mọi chặng chưa có kết quả trả `null` ngay, không gọi nữa (giữ nét đứt thẳng); chặng đã có kết quả trong cache/sessionStorage vẫn dùng. Lỗi khác (422, 429, 5xx, mạng) chỉ ảnh hưởng chính chặng đó.
- Bảng chặng lỗi cũng giới hạn 200 key.

**3.2b Lưu chặng thành công qua các lần tải trang (v1.1)**
- `sessionStorage['tripmate:road-legs:v1']` = JSON `{ [legKey]: LngLat[] }`, key là profile + toạ độ làm tròn (cùng `leg.key`). Đọc một lần khi dùng lần đầu, kiểm tra từng entry bằng `isLine`; dữ liệu hỏng/không đúng dạng bị bỏ qua.
- Giới hạn: tối đa 100 chặng và 500 000 ký tự JSON; vượt thì bỏ chặng cũ nhất; một route đơn lẻ vượt ngân sách thì không lưu (vẫn dùng trong bộ nhớ). Chỉ lưu chặng thành công, không lưu lỗi/refusal.
- Mọi đọc/ghi/xoá storage bọc `try/catch` (private mode, quota, SSR); lỗi → chạy tiếp chỉ với cache bộ nhớ.
- `clearRoadLegCache()` (dùng trong test) xoá cả bộ nhớ, chặng lỗi, cờ refused và storage.

**3.3 Vẽ (`MapboxItineraryMap.tsx`)**
- Giữ `itinerary-route` + layer dashed như cũ → lập tức vẽ đường thẳng (hiển thị ngay, test cũ vẫn đúng).
- Thêm nguồn `itinerary-road` + layer `itinerary-road-line` (nét liền, `#103B39`, width 4, round join/cap) đặt dưới marker.
- Sau `setData` đường thẳng, gọi Directions cho mọi chặng song song (`Promise.allSettled`-style, mỗi chặng độc lập). Khi xong: `itinerary-road` = MultiLineString các chặng thành công; `itinerary-route` (dashed) = MultiLineString chỉ các chặng thất bại/bỏ sót. Nếu tất cả thành công → dashed rỗng.
- Cập nhật theo lô sau khi tất cả chặng xong (đơn giản, tránh nhấp nháy từng chặng). Nếu muốn cập nhật dần từng chặng: xem câu hỏi mở Q3.
- Huỷ: không abort fetch (để request vẫn nạp cache, tránh làm hỏng promise dùng chung); model đổi/unmount/đổi token → bỏ kết quả cũ bằng bộ đếm lần vẽ + guard `mapRef.current === map`.
- Directions lỗi KHÔNG gọi `onUnavailable` và không đổi trạng thái trang; chỉ chặng đó giữ nét đứt.
- Không có token → trang đã dùng thẻ fallback, không đổi.

**3.4 Chú thích (`ViewSuggestedItineraryPage.tsx`)**
Thay câu cũ bằng: "Nét liền: theo đường đi thực tế (Mapbox). Nét đứt: chỉ nối thẳng theo thứ tự ghé khi chưa lấy được đường đi thực tế." (câu về xe máy đã có sẵn trong timeline — `MOTORBIKE_ESTIMATE_NOTE` — nên không lặp lại ở legend). Thêm 2 mẫu nét liền/nét đứt nhỏ trong legend.

## 4. Tiêu chí chấp nhận
1. Với token hợp lệ, mỗi chặng được vẽ bằng geometry Directions; tab ngày chỉ vẽ chặng của ngày đó.
2. Walking → `mapbox/walking`; Motorbike/Car/PublicTransit/thiếu → `mapbox/driving`.
3. Một chặng lỗi → chỉ chặng đó nét đứt thẳng, các chặng khác vẫn nét liền, trang không báo lỗi/không chuyển sang fallback card.
4. Vẽ lại với cùng chặng (model mới cùng nội dung, đổi tab rồi quay lại) không gọi fetch lại cho chặng đã thành công.
5. Unmount/đổi model giữa chừng không setData muộn lên map cũ.
6. Chú thích nói đúng hành vi.
7. Không dependency mới; `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` qua.

## 5. Test (viết trước, đỏ → xanh)
- `mapGeometry.test.ts`: `legs` đúng số lượng, profile theo mode (kể cả null → driving, Walking → walking), bỏ chặng trùng điểm, trip khép vòng, 0 stop → `legs: []`.
- `mapboxDirections.test.ts` (mock `fetch`): URL/param/profile đúng; thành công; HTTP lỗi → null; geometry xấu → null; network reject → null; cache dùng lại (1 fetch cho 2 lần gọi); lỗi không bị cache.
- `maps.test.tsx` (mở rộng, mock `fetch`): thành công → `itinerary-road` setData có geometry Directions và dashed rỗng; 1 chặng fail → dashed chứa đúng chặng đó, road chứa các chặng còn lại, `onUnavailable` không gọi; rerender cùng model nội dung → fetch không tăng; unmount giữa chừng → không setData. FakeMap hiện có `addSource/addLayer/getSource` đủ dùng.
- Test trang (nếu có sẵn test chú thích cũ) cập nhật theo câu mới.

## 6. Rủi ro / đánh đổi
- Mỗi lần mở trang lần đầu = N+1 request Directions (N stop) → tốn quota token; cache bộ nhớ + sessionStorage + nhớ lỗi 5 phút + dừng khi 401/403 giảm lặp (reload và đổi tab ngày không gọi lại chặng đã có). Giới hạn Mapbox 300 req/phút/token — chuyến thường < 20 chặng/ngày nên đủ. YAGNI: chưa dùng Matrix/Map Matching (1 request nhiều waypoint) vì cần mode theo chặng.
- Token public bị giới hạn URL hoặc thiếu scope directions → mọi chặng nét đứt (đúng như hiện tại), không vỡ trang.
- Walking profile có giới hạn khoảng cách → chặng dài có thể 422 → fallback nét đứt.
- Giờ/km hiển thị vẫn từ BE, có thể lệch nhẹ so với đường vẽ.
- Đường vẽ ≠ đường tối ưu của BE (BE tính khoảng cách riêng); chỉ là hiển thị.

## 7. Quyết định đã chốt
- PublicTransit → driving như mobile.
- Dùng câu chú thích mới ở 3.4.
- Cập nhật đường một lần sau khi tất cả chặng xong.
- Commit không có trailer AI (ghi đè AGENTS.md).

## 8. Quy trình sau duyệt
Worktree `Capstone_FE_ROADROUTE` từ origin/develop → baseline `npm test/lint/typecheck` → plan ngắn (`plans/web-itinerary-road-route-plan.md`, chờ duyệt) → TDD từng task → review → `npm run lint && typecheck && build && test` → 1 commit local + `## Summary`. Không push. Spec/plan sẽ commit cùng (`specs/`, `plans/`) trừ khi bạn muốn để ngoài.

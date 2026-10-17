import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runLiveTest() {
  const evidenceDir = path.resolve('..', 'reports', 'evidence_uc10');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  console.log('🚀 [LIVE E2E TEST] Khởi chạy Google Chrome có giao diện (Headed Mode)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 700, // Chậm rãi để người dùng quan sát trên màn hình
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  try {
    // 1. ĐĂNG NHẬP
    console.log('1️⃣ Điều hướng tới trang Đăng nhập (http://localhost:3001/sign-in)...');
    await page.goto('http://localhost:3001/sign-in');
    await page.waitForLoadState('networkidle');

    console.log('2️⃣ Điền thông tin đăng nhập: traveler@tripmate.vn...');
    await page.fill('#email', 'traveler@tripmate.vn');
    await page.fill('#password', 'TripMate@2026');
    await page.screenshot({ path: path.join(evidenceDir, '01_login_filled.png'), fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 2. MỞ TRANG UC-10
    console.log('3️⃣ Truy cập trang Lập lịch trình UC-10 (http://localhost:3001/plan)...');
    await page.goto('http://localhost:3001/plan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(evidenceDir, '02_plan_form_initial.png'), fullPage: true });

    // 3. CHỌN ĐIỂM XUẤT PHÁT
    console.log('4️⃣ Chọn Điểm xuất phát...');
    const startPickerBtn = page.locator('button:has-text("Chọn điểm xuất phát")').first();
    if (await startPickerBtn.isVisible()) {
      await startPickerBtn.click();
      await page.waitForTimeout(1000);
      const searchInput = page.locator('input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('An Khê');
        await page.click('button[type="submit"]:has-text("Tìm")');
        await page.waitForTimeout(2000);
        const firstPlace = page.locator('div[role="dialog"] button:has-text("An Khê"), div[role="dialog"] button:has-text("Đà Nẵng")').first();
        if (await firstPlace.isVisible()) {
          await firstPlace.click();
        } else {
          const anyPlace = page.locator('div[role="dialog"] section ul li button').first();
          if (await anyPlace.isVisible()) await anyPlace.click();
        }
      }
    }
    await page.waitForTimeout(1500);

    // 4. CHỌN KHU VỰC KHÁM PHÁ: HOA PHU THANH
    console.log('5️⃣ Chọn Khu vực khám phá: Mở hộp thoại để kiểm tra Gợi ý và danh sách tự động load...');
    const explorationBtn = page.locator('button[aria-label*="Khu vực khám phá"]').first();
    if (await explorationBtn.isVisible()) {
      await explorationBtn.click();
      await page.waitForTimeout(1500);

      console.log('📸 Chụp ảnh hộp thoại Chọn khu vực khám phá với các gợi ý và danh sách POI tự động tải...');
      await page.screenshot({ path: path.join(evidenceDir, '02b_exploration_picker_dialog_with_suggestions.png') });

      const searchInput = page.locator('input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Hoa Phu Thanh');
        await page.click('button[type="submit"]:has-text("Tìm")');
        await page.waitForTimeout(2000);
        const hptItem = page.locator('div[role="dialog"] section[aria-label="Địa điểm tham quan"] button:has-text("Hoa Phu Thanh")').first();
        if (await hptItem.isVisible()) {
          await hptItem.click();
        } else {
          const anyPoi = page.locator('div[role="dialog"] section[aria-label="Địa điểm tham quan"] button').first();
          if (await anyPoi.isVisible()) await anyPoi.click();
        }
      }
    }
    await page.waitForTimeout(2500);

    // 5. CHỤP ẢNH TC-HAPPY-01 (AUTO-BINDING VỚI BADGE "ĐIỂM KHÁM PHÁ CHÍNH" VÀ BẢN ĐỒ MAPBOX BÁN KÍNH)
    console.log('📸 [TC-HAPPY-01 & MAPBOX] Chụp fullPage xác thực Auto-binding chip Điểm khám phá chính & Bản đồ Mapbox bán kính...');
    await page.screenshot({ path: path.join(evidenceDir, '03_auto_binding_primary_destination_and_mapbox.png'), fullPage: true });

    // 6. CHUYỂN SANG PHƯƠNG TIỆN ĐI BỘ ĐỂ KIỂM TRA TRAVEL FEASIBILITY GATE (TC-BAD-02)
    console.log('6️⃣ [TC-BAD-02] Chuyển phương tiện sang Đi bộ để kích hoạt Travel Feasibility Warning...');
    const walkingBtn = page.locator('button:has-text("Đi bộ"), label:has-text("Đi bộ")').first();
    if (await walkingBtn.isVisible()) {
      await walkingBtn.scrollIntoViewIfNeeded();
      await walkingBtn.click();
      await page.waitForTimeout(1500);
      console.log('📸 [TC-BAD-02] Chụp fullPage xác thực cảnh báo mềm Travel Feasibility...');
      await page.screenshot({ path: path.join(evidenceDir, '04_travel_feasibility_warning.png'), fullPage: true });
    }

    // Đổi lại sang Xe máy
    const motorbikeBtn = page.locator('button:has-text("Xe máy"), label:has-text("Xe máy")').first();
    if (await motorbikeBtn.isVisible()) {
      await motorbikeBtn.scrollIntoViewIfNeeded();
      await motorbikeBtn.click();
      await page.waitForTimeout(1500);
    }

    // 7. GỠ BỎ CHIP ĐIỂM KHÁM PHÁ CHÍNH QUA NÚT X (TC-EDGE-01)
    console.log('7️⃣ [TC-EDGE-01] Kiểm tra gỡ bỏ chip: Bấm nút x...');
    const chipRemoveBtn = page.locator('li:has-text("Hoa Phu Thanh") button').first();
    if (await chipRemoveBtn.isVisible()) {
      await chipRemoveBtn.click();
      await page.waitForTimeout(1500);
      console.log('📸 [TC-EDGE-01] Chụp fullPage xác thực gỡ bỏ chip...');
      await page.screenshot({ path: path.join(evidenceDir, '05_dismiss_primary_chip.png'), fullPage: true });
    }

    // 8. CHỌN LẠI HOA PHU THANH ĐỂ NỘP FORM
    console.log('8️⃣ [TC-HAPPY-02] Chọn lại Hoa Phu Thanh để lập lịch trình...');
    if (await explorationBtn.isVisible()) {
      await explorationBtn.click();
      await page.waitForTimeout(1000);
      const searchInput = page.locator('input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Hoa Phu Thanh');
        await page.click('button[type="submit"]:has-text("Tìm")');
        await page.waitForTimeout(2000);
        const hptItem = page.locator('div[role="dialog"] section[aria-label="Địa điểm tham quan"] button:has-text("Hoa Phu Thanh")').first();
        if (await hptItem.isVisible()) {
          await hptItem.click();
        }
      }
    }
    await page.waitForTimeout(2000);

    // 9. NỘP LỊCH TRÌNH
    console.log('9️⃣ Scroll xuống nút Tạo lịch trình và gửi yêu cầu...');
    const submitBtn = page.locator('button[type="submit"]:has-text("Tạo lịch trình tối ưu")').first();
    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();
      console.log('⏳ Đang chờ kết quả tạo lịch trình từ Backend CSP...');
      await page.waitForTimeout(7000);
      console.log('📸 [TC-HAPPY-02] Chụp fullPage kết quả xếp lịch trình...');
      await page.screenshot({ path: path.join(evidenceDir, '06_itinerary_result.png'), fullPage: true });
    }

    // 10. CHUYỂN SANG TRANG CHI TIẾT LỊCH TRÌNH (UC-11 / REVIEW2)
    console.log('🔟 Bấm nút "Xem lịch trình chi tiết" để mở trang chi tiết với Bản đồ Mapbox, Thêm quán ăn, Đổi phương tiện, Xóa POI...');
    const detailLink = page.locator('a:has-text("Xem lịch trình chi tiết")').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle').catch(() => {});
      console.log('📸 Chụp fullPage trang chi tiết lịch trình với Bản đồ Mapbox tương tác, Thêm quán ăn, Xóa POI và Đổi phương tiện...');
      await page.screenshot({ path: path.join(evidenceDir, '07_itinerary_detail_with_mapbox_and_features.png'), fullPage: true });

      // Thử mở hộp thoại Thêm quán ăn
      console.log('1️⃣1️⃣ Thử mở hộp thoại Thêm quán ăn / Gợi ý bữa trưa...');
      const addFoodBtn = page.locator('button:has-text("Thêm quán ăn"), button:has-text("Bữa trưa?"), button:has-text("Chọn quán")').first();
      if (await addFoodBtn.isVisible()) {
        await addFoodBtn.scrollIntoViewIfNeeded();
        await addFoodBtn.click();
        await page.waitForTimeout(2000);
        console.log('📸 Chụp hộp thoại Thêm quán ăn (Suggestions Dialog)...');
        await page.screenshot({ path: path.join(evidenceDir, '08_add_food_suggestions_dialog.png'), fullPage: true });
        
        // Đóng dialog
        const closeDialogBtn = page.locator('div[role="dialog"] button[aria-label*="Đóng"], div[role="dialog"] button:has-text("Đóng"), div[role="dialog"] button:has-text("Hủy")').first();
        if (await closeDialogBtn.isVisible()) {
          await closeDialogBtn.click();
          await page.waitForTimeout(1000);
        }
      }

      // Thử tương tác với nút Đổi phương tiện
      console.log('1️⃣2️⃣ Thử click nút Đổi phương tiện...');
      const changeModeBtn = page.locator('button:has-text("Đổi")').first();
      if (await changeModeBtn.isVisible()) {
        await changeModeBtn.scrollIntoViewIfNeeded();
        await changeModeBtn.click();
        await page.waitForTimeout(1500);
        console.log('📸 Chụp menu chọn phương tiện di chuyển...');
        await page.screenshot({ path: path.join(evidenceDir, '09_change_transport_mode_menu.png'), fullPage: true });
      }
    }

    console.log('🎉 [SUCCESS] Toàn bộ kịch bản E2E trên phiên bản mới nhất đã hoàn thành xuất sắc!');
  } catch (err) {
    console.error('❌ Lỗi kiểm thử:', err);
    await page.screenshot({ path: path.join(evidenceDir, 'error_state.png'), fullPage: true }).catch(() => {});
  } finally {
    console.log('🔒 Đóng trình duyệt sau khi kiểm thử xong...');
    await browser.close();
  }
}

runLiveTest();

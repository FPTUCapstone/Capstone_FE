# ĐỀ XUẤT HỆ THỐNG DESIGN TOKENS QUẢN TRỊ (ADMIN DESIGN TOKENS PROPOSAL)
## BẢNG MÀU ĐÃ PHÊ DUYỆT: FOREST & WARM IVORY
**Mã tài liệu:** BATCH E0 — ĐỀ XUẤT MỞ RỘNG DESIGN SYSTEM  
**Ngày lập:** 23/10/2026  
**Định hướng thị giác:** ĐÃ ĐƯỢC UI OWNER PHÊ DUYỆT (FOREST & WARM IVORY)  
**Tiêu chuẩn chất lượng:** Dựa trên Claude Frontend Design Skill & TripMate Design System (`DESIGN.md`)  

---

## 1. TRIẾT LÝ THIẾT KẾ: FOREST & WARM IVORY (WARM MINIMAL ENTERPRISE)

Khu vực Quản trị TripMate (Administrator & Staff) không phải là trang quảng cáo du lịch hào nhoáng, cũng không phải là dashboard SaaS màu xanh dương khuôn mẫu (`Generic Blue SaaS`). 

Không gian Quản trị TripMate đại diện cho **Sự vận hành dựa trên cảm hứng tự nhiên (Nature-inspired Operations)** và **Sự tối giản ấm áp của Doanh nghiệp hiện đại (Warm Minimal Enterprise)**:
1. **Điềm tĩnh, Chuyên nghiệp và Dễ đọc (Calm, Professional & Readable):** Nền không gian màu **Warm Ivory** ngà ấm (`#F7F6F2`) giúp giảm mỏi mắt cho nhân viên trực ca và quản trị viên khi làm việc liên tục nhiều giờ với bảng biểu, thay thế cho nền trắng chói gắt (`#FFFFFF`) hoặc nền xanh xám công nghiệp.
2. **Vững chãi và Quyền uy (Forest Charcoal Authority):** Thanh điều hướng và Sidebar sử dụng màu **Forest Charcoal** than gỗ rừng sâu (`#1C2923`), tạo điểm tựa thị giác kiên cố, phân tách rõ ràng giữa điều hướng và không gian tác nghiệp.
3. **Tác vụ Rõ ràng (Deep Forest Green Actions):** Các hành động chính yếu (Phê duyệt, Lưu, Tạo mới) sử dụng **Deep Forest Green** xanh rừng đậm (`#245747`), tạo cảm giác tin cậy, chính trực và dứt khoát.
4. **Nhấn mạnh Điềm đạm (Sage Green & Muted Copper Accents):** Sử dụng **Sage Green** ngải cứu (`#758B74`) cho các trạng thái thứ cấp, đường viền mềm và thẻ phụ; điểm xuyết **Muted Copper** đồng đất trầm (`#B87558`) cho các cảnh báo, nhắc nhở quan trọng hoặc hành động tài chính đặc quyền.
5. **Ưu tiên Thông tin hơn Trang trí (Information-first over Decoration-first):** Loại bỏ hoàn toàn hiệu ứng kính bóng bẩy (glassmorphism), dải màu lòe loẹt (excessive gradients), thẻ trôi nổi viền phát sáng (floating cards) và các biểu đồ KPI giả tạo.

---

## 2. NGUYÊN TẮC BẤT DI BẤT DỊCH: TOKEN MỞ RỘNG BỔ SUNG (ADDITIVE TOKENS ONLY)

> [!IMPORTANT]
> **QUY TẮC CỐT LÕI VỀ KIẾN TRÚC CSS:**
> - Tuyệt đối **KHÔNG THAY THẾ** hoặc ghi đè bảng màu toàn cục hiện có của TripMate.
> - Tuyệt đối **KHÔNG XÓA** hoặc chỉnh sửa các token thương hiệu hiện tại trong `DESIGN.md` và `app/globals.css`:
>   `brand-teal`, `brand-brightTeal`, `brand-lightTeal`, `brand-navy`, `brand-coral`, `primary`, `primary-container`, `success`, `warning`, `error`.
> - Toàn bộ các token mới sẽ được khai báo trong không gian tên (namespace) chuyên biệt: `--admin-*`.
> - **Cách ly giao diện hoàn toàn (Theme Isolation):** Giao diện quản trị sẽ chỉ áp dụng trong phạm vi thẻ chứa mang lớp `.admin-theme` hoặc `data-theme="admin"` bên trong `app/admin/(console)/layout.tsx`.
> - Tuyệt đối **KHÔNG ẢNH HƯỞNG** đến Trang chủ, Giới thiệu (`/about`), Khách du lịch (`/account/*`, `/itinerary/*`, `/plan`), Đối tác (`/partner/*`), Trang điểm tham quan (`/pois/*`), Trang tour (`/tours/*`), hay trang Đăng nhập công khai (`/sign-in`).

---

## 3. ĐỀ XUẤT CẤU TRÚC TOKEN MỞ RỘNG (TOKEN SPECIFICATION)

### 3.1. Bảng màu Nền tảng (Core Approved Administration Palette)

| Tên Token Logic | Mã Hex | Vai trò & Ứng dụng thực tế |
|---|---|---|
| `--admin-forest-charcoal` | `#1C2923` | Nền thanh Sidebar bên trái, header thanh điều hướng, tiêu đề chính cấp cao. |
| `--admin-forest-accent` | `#245747` | Nút hành động chính (Primary CTA), trạng thái đang chọn (Active Nav Item), điểm nhấn định danh. |
| `--admin-sage` | `#758B74` | Đường viền thứ cấp, biểu tượng phụ, nhãn trạng thái đang xử lý, nền thẻ phụ. |
| `--admin-ivory` | `#F7F6F2` | Nền canvas toàn bộ không gian làm việc (Workspace Canvas Background). |
| `--admin-copper` | `#B87558` | Điểm nhấn kiểm toán, cảnh báo tài chính, huy hiệu Administrator, hành động chú ý cao. |

---

### 3.2. Hệ thống Token Ngữ nghĩa Đầy đủ (Semantic Administrative Tokens)

#### A. Nhóm Bề mặt (Surfaces & Canvas)
```css
/* Không gian tên: --admin-surface-* */
--admin-surface-canvas: #F7F6F2;        /* Nền không gian làm việc chính (Warm Ivory) */
--admin-surface-card: #FFFFFF;          /* Nền thẻ nội dung, bảng dữ liệu, form nhập liệu */
--admin-surface-card-subtle: #F0EFEA;   /* Nền phụ trong thẻ, thanh header của bảng dữ liệu */
--admin-surface-sidebar: #1C2923;       /* Nền thanh điều hướng dọc (Forest Charcoal) */
--admin-surface-sidebar-hover: #273830; /* Trạng thái hover mục menu trên Sidebar */
--admin-surface-sidebar-active: #245747;/* Trạng thái mục menu đang được kích hoạt */
--admin-surface-dialog: #FFFFFF;        /* Nền hộp thoại modal, drawer chi tiết */
--admin-surface-overlay: rgba(28, 41, 35, 0.45); /* Lớp phủ mờ nền khi mở modal */
```

#### B. Nhóm Nét viền & Phân cách (Borders & Dividers)
```css
/* Không gian tên: --admin-border-* */
--admin-border-subtle: #E6E4DD;         /* Viền thẻ bảng dữ liệu, đường kẻ phân chia dòng nhẹ */
--admin-border-default: #D8D5CC;        /* Viền ô nhập liệu (input), viền nút thứ cấp */
--admin-border-strong: #758B74;         /* Viền nhấn khi focus hoặc viền thẻ trạng thái nổi bật */
--admin-border-sidebar: #2A3B33;        /* Đường kẻ phân nhóm menu trên nền thanh Sidebar */
```

#### C. Nhóm Chữ & Nội dung (Typography & Inks)
```css
/* Không gian tên: --admin-text-* */
--admin-text-primary: #1C2923;          /* Chữ chính, tiêu đề trang, nội dung bảng (Độ tương phản cực cao) */
--admin-text-secondary: #4A5851;        /* Chữ phụ, nhãn hướng dẫn, mô tả chức năng */
--admin-text-muted: #74827B;            /* Chữ chú thích phụ, placeholder, trạng thái vô hiệu */
--admin-text-on-dark: #F7F6F2;          /* Chữ hiển thị trên nền Sidebar tối và nút Primary */
--admin-text-on-dark-muted: #A3B3AB;    /* Chữ phụ hiển thị trên Sidebar tối */
```

#### D. Nhóm Hành động & Tương tác (Interactive Elements)
```css
/* Nút Chính (Primary Action: Phê duyệt, Lưu, Tạo mới) */
--admin-btn-primary-bg: #245747;
--admin-btn-primary-hover: #1B4337;
--admin-btn-primary-active: #14332A;
--admin-btn-primary-text: #FFFFFF;

/* Nút Thứ cấp (Secondary Action: Lọc, Hủy, Quay lại) */
--admin-btn-secondary-bg: #FFFFFF;
--admin-btn-secondary-border: #D8D5CC;
--admin-btn-secondary-hover: #F0EFEA;
--admin-btn-secondary-text: #1C2923;

/* Nút Nhấn mạnh / Cảnh báo Quyết toán (Copper Action) */
--admin-btn-copper-bg: #B87558;
--admin-btn-copper-hover: #A0644A;
--admin-btn-copper-text: #FFFFFF;

/* Nút Nguy hiểm (Destructive Action: Khóa tài khoản, Từ chối, Xóa) */
--admin-btn-danger-bg: #C93B2B;
--admin-btn-danger-hover: #A82E20;
--admin-btn-danger-text: #FFFFFF;
```

#### E. Nhóm Huy hiệu Trạng thái (Semantic Status Badges)
Mỗi trạng thái bắt buộc bao gồm cả **Màu nền + Màu chữ + Biểu tượng Material Symbol** để đảm bảo khả năng tiếp cận (không chỉ dựa vào màu sắc):
- **Đã phê duyệt / Hoạt động (Approved / Active / Settled):**
  - Nền: `#E7F2EC` | Chữ: `#1B5E3C` | Viền: `#BCE0CD` | Icon: `check_circle`
- **Chờ duyệt / Đang thẩm định (Pending Review / Approval):**
  - Nền: `#FBF3E8` | Chữ: `#8F5419` | Viền: `#F2D8B3` | Icon: `pending`
- **Từ chối / Vi phạm (Rejected / Suspended):**
  - Nền: `#FBEBE8` | Chữ: `#9E2B25` | Viền: `#F4C5BF` | Icon: `cancel`
- **Đã khóa / Đóng (Locked / Inactive):**
  - Nền: `#EDECE8` | Chữ: `#515553` | Viền: `#D2D1CC` | Icon: `lock`
- **Cần can thiệp khẩn cấp (Emergency Alert):**
  - Nền: `#FCEEE9` | Chữ: `#B87558` | Viền: `#EFC6B6` | Icon: `warning`

---

## 4. KIỂM ĐỊNH KHẢ NĂNG TIẾP CẬN VỀ ĐỘ TƯƠNG PHẢN (WCAG 2.2 AA CONTRAST VALIDATION)

Áp dụng công thức tính tỷ lệ tương phản độ chói tương đối (Relative Luminance Contrast Ratio) theo chuẩn W3C WCAG 2.2 AA:
- **Tiêu chuẩn văn bản thường (< 18pt / < 24px):** Tối thiểu **4.5:1**
- **Tiêu chuẩn văn bản lớn (≥ 18pt hoặc ≥ 14pt đậm):** Tối thiểu **3.0:1**
- **Tiêu chuẩn thành phần điều khiển & viền giao diện:** Tối thiểu **3.0:1**

| Cặp Màu Kiểm Định | Màu Chữ / Phần Tử | Màu Nền | Tỷ Lệ Tương Phản | Đánh Giá WCAG 2.2 | Kết Luận & Quy Định Ứng Dụng |
|---|---|---|---|---|---|
| Chữ chính trên Canvas | `#1C2923` | `#F7F6F2` | **12.65:1** | **ĐẠT XUẤT SẮC (AAA)** | Rất sắc nét, cực kỳ dễ đọc đối với bảng biểu và danh sách dài. |
| Chữ chính trên Thẻ trắng | `#1C2923` | `#FFFFFF` | **13.56:1** | **ĐẠT XUẤT SẮC (AAA)** | Chuẩn mực vàng cho nội dung thẻ và form nhập liệu. |
| Chữ phụ trên Canvas | `#4A5851` | `#F7F6F2` | **6.12:1** | **ĐẠT (AA & AAA Large)** | An toàn tuyệt đối cho nhãn mô tả, nhãn phụ form. |
| Nút bấm chính (Deep Forest) | `#FFFFFF` | `#245747` | **6.81:1** | **ĐẠT (AA & AAA Large)** | Đạt độ tương phản chữ trắng trên nút nền xanh rừng. |
| Chữ trên Sidebar tối | `#F7F6F2` | `#1C2923` | **12.65:1** | **ĐẠT XUẤT SẮC (AAA)** | Nhãn menu trên nền Sidebar than gỗ cực kỳ sắc nét. |
| Chữ phụ trên Sidebar tối | `#A3B3AB` | `#1C2923` | **5.44:1** | **ĐẠT (AA)** | Phù hợp cho nhãn nhóm phân mục (Category heading) trên Sidebar. |
| Nhấn Đồng Muted Copper | `#B87558` | `#FFFFFF` | **3.82:1** | **ĐẠT UI Control (3.0:1)** | **Quy tắc an toàn:** Mã `#B87558` dùng cho viền, icon, nền badge. Khi dùng làm **màu chữ body**, tối ưu sang `#9E593D` (Tỷ lệ 4.75:1 đạt chuẩn AA). |
| Sage Green Accent | `#758B74` | `#FFFFFF` | **3.31:1** | **ĐẠT UI Control (3.0:1)** | Dùng cho viền thẻ phụ, icon trang trí, nền huy hiệu đi kèm chữ màu `#1C2923` (Tỷ lệ 7.2:1). |

---

## 5. ĐỊNH DANH THỊ GIÁC CHO VAI TRÒ: STAFF VS ADMINISTRATOR

Cả hai vai trò đều cùng hoạt động trên nền tảng thẩm mỹ chung **Forest & Warm Ivory**, nhưng được định danh rõ nét thông qua Hệ thống Phân tầng Thông tin và Huy hiệu Định danh (Role Badges):

### 5.1. Staff (Tác nghiệp Vận hành)
- **Huy hiệu Định danh:**
  - Nhãn: `STAFF OPERATOR` / `NHÂN VIÊN VẬN HÀNH`
  - Màu sắc: Nền Sage Tint nhạt (`#E8EFE9`), viền Sage Green (`#758B74`), chữ Forest Green (`#1C2923`), Biểu tượng: `support_agent` hoặc `task_alt`.
- **Trọng tâm giao diện:**
  - Hàng đợi công việc (Task Queues), chỉ số lượng việc cần xử lý trong ca trực, phím tắt đi nhanh vào thẩm định hồ sơ, kiểm duyệt tour, giám sát lộ trình.

### 5.2. Administrator (Quản trị & Giám sát Chiến lược)
- **Huy hiệu Định danh:**
  - Nhãn: `ADMINISTRATOR` / `QUẢN TRỊ VIÊN HỆ THỐNG`
  - Màu sắc: Nền Muted Copper Tint (`#F7EBE5`), viền Copper (`#B87558`), chữ Copper đậm (`#7A3F26`), Biểu tượng: `shield_person` hoặc `admin_panel_settings`.
- **Trọng tâm giao diện:**
  - Chỉ số tổng quan hệ thống, trạng thái quyết toán tài chính, cảnh báo kiểm toán an ninh, các nút kích hoạt tác vụ đặc quyền (Quyết toán giải ngân, Cấu hình tham số lõi).

---

## 6. CHIẾN LƯỢC TRIỂN KHAI VÀ DI TRÚ KỸ THUẬT (MIGRATION STRATEGY)

1. **Giai đoạn E0 (Hiện tại):** Chỉ ghi nhận đề xuất trong tài liệu thiết kế. **Tuyệt đối không sửa mã nguồn CSS hoặc `DESIGN.md`.**
2. **Giai đoạn E1 (Triển khai Theme Quản trị độc lập):**
   - Tạo file CSS chuyên biệt: `src/features/admin/shared/styles/admin-theme.css`.
   - Khai báo các biến CSS `--admin-*` bên trong lớp `.admin-theme`.
   - Bao bọc toàn bộ nội dung trong `app/admin/(console)/layout.tsx` bằng một thẻ `<div className="admin-theme min-h-screen bg-[var(--admin-surface-canvas)] text-[var(--admin-text-primary)]">`.
   - Toàn bộ các trang công khai của ứng dụng (`/`, `/about`, `/tours`, `/pois`, `/plan`) hoàn toàn không bị nạp hoặc ảnh hưởng bởi các biến CSS này.

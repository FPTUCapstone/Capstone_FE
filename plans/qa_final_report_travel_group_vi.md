# Báo cáo cuối QA Travel Group & Messaging — 24/11/2026

## A. Phạm vi
Chat nhóm, chat riêng 1–1, quyền truy cập, cập nhật SignalR, lịch sử, poll, thông báo, điểm danh, chia tiền và VietQR trên Backend, Web, Mobile.

## B. Trạng thái mã nguồn
Ba nhánh feature vẫn có thay đổi local chưa commit/push. Các tệp Coupon/TM-76 không thuộc phạm vi chat và cần loại khỏi commit. Đối chiếu Git: Backend lệch develop 3 commit riêng/127 commit mới, Web 4/17, Mobile 3/10. FE có xung đột ở MyItinerariesPage.tsx khi ghép develop.

## C. Lỗi đã sửa
TG-E2E-002..005 được sửa trong Backend (quyền, dữ liệu chia tiền, thông tin trả về); TG-E2E-006..007 trong Web (đường trở lại sau đăng nhập, VietQR); Mobile đã thay trang chat dữ liệu mẫu bằng kết nối thật, Cubit, SignalR, màn hình hội thoại và quyền định tuyến. Phát hiện thêm Web nút Gửi chữ trắng/nền trắng trên màn hình nhỏ và đã sửa.

## D. Cơ sở dữ liệu
Docker SQL Server và Redis chạy. Một môi trường test chat riêng có user/group/tin kiểm thử tạo bằng SQL ngoài mã sản phẩm. Lần test SQL Server cuối cho ca poll cũ đạt 1/1 sau khi sửa fixture thành 3 lựa chọn. Các bài kiểm tra nhóm/DM đã từng đạt 43/44 trước sửa fixture; toàn bộ 44 bài chưa được chạy lại sau sửa.

## E. SignalR và E2E Web
Đã kiểm tra bằng trình duyệt: tải 60 tin cũ, gửi/reload, hai tài khoản gửi nhận chat riêng qua SignalR, vote/chuyển/hủy vote, thông báo/đã đọc, điểm danh, chia tiền 100001 VND và xác nhận chuyển tiền sau reload, 503 giữ draft, mất response không gửi trùng, người ngoài nhóm bị 403/404, màn hình 390px không tràn, giữ draft hơn 70 giây qua token refresh. Bằng chứng ảnh local: messenger-web-narrow-final.png, messenger-web-desktop-final.png trong TEMP. Báo cáo QA E2E 9/9 của lượt kiểm thử khác được người dùng cung cấp, chưa tái xác minh đủ 9 trace trong lượt này.

## F. Mobile
APK debug build và cài thành công trên Pixel_8; đăng nhập tài khoản QA bằng Backend local thành công. Hộp thư tải đúng một hội thoại riêng và hai nhóm từ SQL Server. Gửi tin `MobileDirectQA1525` qua màn riêng và `MobileGroupQA1526` qua màn nhóm; truy vấn SQL xác nhận lần lượt `social.DirectMessages.message_id=5` và `social.GroupMessages.message_id=68`. 18/18 test messaging đạt, `flutter analyze --no-pub` không có issue. Phát hiện tin mới trong nhóm dài nằm ngoài khung nhìn; đã chỉnh cuộn xuống sau khi widget cập nhật và cuộn đến cuối khi mở hội thoại. Chưa kiểm tra đầy đủ nhận SignalR Web → Mobile, VietQR trên thiết bị và việc mở lại app sau bản sửa cuộn; các ca đó vẫn là PARTIAL.

## G. Kiểm tra toàn repo còn đỏ
Web full npm test: 107 Node test đạt; Vitest 4470 đạt, 29 lỗi, 5 skip, 3 lỗi ngoài test; nhóm lỗi chủ yếu Tour/Coupon và một số timeout khác. Lint đạt. Backend build Release 0 warning, 0 error. Chưa đủ căn cứ merge ba nhánh.

## H. Rủi ro và việc cần làm
Hoàn thành các ca Mobile còn PARTIAL và build lại APK sau sửa cuộn, chạy lại 44 SQL tests, giải quyết full Web tests, kiểm tra baseline của các lỗi Tour/Coupon, đồng bộ develop và xung đột FE, chạy lại toàn bộ cổng CI. Không báo ready to merge trước các bước này. Bàn phím emulator đã được tạm vô hiệu để tránh Telex làm sai email/mật khẩu QA và cần bật lại sau kiểm thử.

## I. Liên kết bằng chứng
Log local tại TEMP: messenger-mobile-current-test.log, messenger-mobile-current-analyze.log, messenger-mobile-final-apk.log, messenger-sql-one-final.log, messenger-be-final-build.log, messenger-fe-full-tests.log, messenger-fe-final-lint.log. Ảnh Mobile tại TEMP: messenger-mobile-direct-sent.png, messenger-mobile-group-sent.png. Test và mã tương ứng ở [BE group SQL](../../Capstone_BE/tests/TripMate.Api.IntegrationTests/TravelGroups/GroupMessagesSqlServerTests.cs), [BE direct SQL](../../Capstone_BE/tests/TripMate.Api.IntegrationTests/DirectChat/DirectChatSqlServerTests.cs), [FE workflow](../src/features/traveler/groups/__tests__/GroupChatWorkflow.test.tsx), [Mobile messaging tests](../../Capstone_Mobile/test/features/messaging). Git diff/status của ba repo là nguồn đối chiếu thay đổi.

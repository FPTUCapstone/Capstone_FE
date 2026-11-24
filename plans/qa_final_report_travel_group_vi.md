# Báo cáo cuối QA Travel Group & Messaging — 24/11/2026

## A. Phạm vi
Chat nhóm, chat riêng 1–1, quyền truy cập, cập nhật SignalR, lịch sử, poll, thông báo, điểm danh, chia tiền và VietQR trên Backend, Web, Mobile.

## B. Trạng thái mã nguồn
Mã chat của ba repo đã được commit vào các nhánh feature và ghép với `origin/develop` ngày 24/11/2026. Xung đột Web ở `MyItinerariesPage.tsx` được giải quyết bằng cách giữ cả thiết kế thư viện chuyến đi mới và luồng tham gia nhóm/tin nhắn; 14/14 test trang này đạt sau khi ghép. Xung đột Backend ở test `ConfirmPasswordResetFlowTests.cs` giữ cả các DbSet mới. Các tệp Coupon/TM-76 không thuộc phạm vi chat được loại khỏi commit. Cần đối chiếu trạng thái remote sau khi push.

## C. Lỗi đã sửa
TG-E2E-002..005 được sửa trong Backend (quyền, dữ liệu chia tiền, thông tin trả về); TG-E2E-006..007 trong Web (đường trở lại sau đăng nhập, VietQR); Mobile đã thay trang chat dữ liệu mẫu bằng kết nối thật, Cubit, SignalR, màn hình hội thoại và quyền định tuyến. Phát hiện thêm Web nút Gửi chữ trắng/nền trắng trên màn hình nhỏ và đã sửa.

## D. Cơ sở dữ liệu
Docker SQL Server và Redis chạy. Một môi trường test chat riêng có user/group/tin kiểm thử tạo bằng SQL ngoài mã sản phẩm. Sau khi ghép `develop`, bộ SQL Server lọc DirectChat/TravelGroups đạt 55/55, không skip.

## E. SignalR và E2E Web
Đã kiểm tra bằng trình duyệt: tải 60 tin cũ, gửi/reload, hai tài khoản gửi nhận chat riêng qua SignalR, vote/chuyển/hủy vote, thông báo/đã đọc, điểm danh, chia tiền 100001 VND và xác nhận chuyển tiền sau reload, 503 giữ draft, mất response không gửi trùng, người ngoài nhóm bị 403/404, màn hình 390px không tràn, giữ draft hơn 70 giây qua token refresh. Bằng chứng ảnh local: messenger-web-narrow-final.png, messenger-web-desktop-final.png trong TEMP. Báo cáo QA E2E 9/9 của lượt kiểm thử khác được người dùng cung cấp, chưa tái xác minh đủ 9 trace trong lượt này.

## F. Mobile
APK debug build và cài thành công trên Pixel_8; đăng nhập tài khoản QA bằng Backend local thành công. Hộp thư tải đúng một hội thoại riêng và hai nhóm từ SQL Server. Gửi tin `MobileDirectQA1525` qua màn riêng và `MobileGroupQA1526` qua màn nhóm; truy vấn SQL xác nhận lần lượt `social.DirectMessages.message_id=5` và `social.GroupMessages.message_id=68`. 18/18 test messaging đạt, `flutter analyze --no-pub` không có issue. Sau khi khởi động lại app, phiên đăng nhập và tin riêng vẫn hiện. Sheet VietQR hiển thị đúng tài khoản của người tạo chia tiền và phần của thành viên là 50.001đ trên tổng 100.001đ; giao diện nói rõ TripMate không tự chuyển tiền. Phát hiện tin mới trong nhóm dài nằm ngoài khung nhìn; đã chỉnh cuộn xuống sau khi widget cập nhật và cuộn đến cuối khi mở hội thoại. Chưa kiểm tra nhận SignalR Web → Mobile trên cùng phiên và chưa cài lại APK sau bản sửa cuộn; hai ca đó vẫn là PARTIAL.

## G. Kiểm tra toàn repo còn đỏ
Web full npm test trước khi ghép develop: 107 Node test đạt; Vitest 4470 đạt, 29 lỗi, 5 skip, 3 lỗi ngoài test; nhóm lỗi chủ yếu Tour/Coupon và một số timeout khác. Tệp test Coupon gây lỗi là thay đổi local chưa commit, không thuộc nhánh chat. Sau ghép develop, Web typecheck, lint, MyItinerariesPage 14/14 và build đạt. Lệnh Vitest chạy trực tiếp (không dùng script `npm test`) với test Coupon local được loại trừ có 4518 đạt, 1 lỗi ở POI favorite và 5 skip; 14 tệp Node test bị Vitest nhận nhầm nên báo `No test suite found`, vì các tệp này cần chạy bằng `node --test` như script chuẩn. Backend build Release sau ghép develop: 0 warning, 0 error; 55/55 SQL Server test liên quan đạt. Cần đối chiếu full test chuẩn và CI trước khi kết luận merge.

## H. Rủi ro và việc cần làm
Hoàn thành các ca Mobile còn PARTIAL và build lại APK sau sửa cuộn, kiểm tra lỗi POI favorite ngoài phạm vi chat trong full Web tests, chạy lại toàn bộ cổng CI. Không báo ready to merge trước các bước này. Bàn phím emulator đã được bật lại sau kiểm thử.

## I. Liên kết bằng chứng
Log local tại TEMP: messenger-mobile-current-test.log, messenger-mobile-current-analyze.log, messenger-mobile-final-apk.log, messenger-sql-one-final.log, messenger-be-merged-build.log, messenger-fe-full-tests.log, messenger-fe-merged-lint.log. Ảnh Mobile tại TEMP: messenger-mobile-direct-sent.png, messenger-mobile-group-sent.png, messenger-mobile-qr.png, messenger-mobile-reopen-message.png. Mã/test: [BE group SQL](https://github.com/FPTUCapstone/Capstone_BE/blob/feature/khanhpq-travel-group-backend/tests/TripMate.Api.IntegrationTests/TravelGroups/GroupMessagesSqlServerTests.cs), [BE direct SQL](https://github.com/FPTUCapstone/Capstone_BE/blob/feature/khanhpq-travel-group-backend/tests/TripMate.Api.IntegrationTests/DirectChat/DirectChatSqlServerTests.cs), [FE workflow](../src/features/traveler/groups/__tests__/GroupChatWorkflow.test.tsx), [Mobile messaging tests](https://github.com/FPTUCapstone/Capstone_Mobile/tree/feature/khanhpq-travel-group-refactor/test/features/messaging). Git diff/status của ba repo là nguồn đối chiếu thay đổi.

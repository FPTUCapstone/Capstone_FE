export const adminUserAccountsVi = {
  directory: {
    eyebrow: 'Quản trị Tài khoản',
    title: 'Quản lý Tài khoản Người dùng',
    description:
      'Tìm kiếm tài khoản du khách và đối tác, xem xét quyền truy cập tài khoản và quản lý trạng thái khóa từ một không gian quản trị tập trung.',
    pendingBadge: 'Đang chờ tích hợp Backend',
    pendingTitle: 'Các nghiệp vụ tài khoản người dùng chưa được kết nối',
    pendingDescription:
      'Danh mục tài khoản và các thao tác trạng thái tài khoản sẽ khả dụng sau khi hợp đồng Backend được triển khai.',
    searchLabel: 'Tìm kiếm tài khoản',
    searchPlaceholder: 'Tìm kiếm chưa khả dụng cho đến khi tích hợp Backend',
    statusFilterLabel: 'Bộ lọc trạng thái tài khoản',
    statusFilterPlaceholder: 'Tất cả trạng thái tài khoản',
    operationsLabel: 'Thao tác tài khoản chưa khả dụng',
    lockUnavailableLabel: 'Khóa tài khoản chưa khả dụng',
    unlockUnavailableLabel: 'Mở khóa tài khoản chưa khả dụng',
    returnToDashboardLabel: 'Quay lại Bảng điều khiển Quản trị',
  },
  detail: {
    eyebrow: 'Quản trị Tài khoản',
    title: 'Chi tiết tài khoản chưa khả dụng',
    pendingBadge: 'Đang chờ tích hợp Backend',
    pendingDescription:
      'Chi tiết tài khoản và các thao tác trạng thái tài khoản sẽ khả dụng sau khi hợp đồng danh mục Backend được triển khai.',
    requestedAccountIdLabel: 'ID tài khoản được yêu cầu',
    operationsLabel: 'Thao tác trạng thái tài khoản chưa khả dụng',
    backToDirectoryLabel: 'Quay lại Quản lý Tài khoản Người dùng',
  },
} as const;

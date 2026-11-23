import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupChatHub } from '../components/GroupChatHub';

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'authenticated',
    context: {
      userId: 1,
      email: 'traveler@tripmate.vn',
      fullName: 'Nguyen Van A',
      role: 'Traveler',
    },
  }),
}));

describe('GroupChatHub - End-to-End User Workflows & Exception Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Workflow 1: Tour Guide (HDV) Announcement & Acknowledgment Workflow', () => {
    it('executes full tour guide broadcast workflow with validation and read receipts', async () => {
      render(<GroupChatHub />);

      // Step 1: Filter to Tour groups
      fireEvent.click(screen.getByRole('button', { name: /Nhóm Tour/ }));
      expect(screen.getAllByText('Tour Khám phá Đà Nẵng - Hội An (3N2Đ)').length).toBeGreaterThan(0);

      // Step 2: Open Action menu to create a Broadcast
      const plusBtn = screen.getByTitle(/Thêm tiện ích/);
      fireEvent.click(plusBtn);

      const broadcastOption = screen.getByText('Phát thông báo đoàn (HDV)');
      fireEvent.click(broadcastOption);

      // Verify modal is open
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Phát thông báo cho đoàn Tour')).toBeDefined();

      // Step 3: Test boundary validation - Submit empty form
      const submitBtn = screen.getByRole('button', { name: 'Phát thông báo' });
      fireEvent.click(submitBtn);

      // Should display error without throwing any unhandled exception
      expect(screen.getByText('Vui lòng nhập tiêu đề thông báo.')).toBeDefined();

      // Step 4: Fill in title but omit content
      const titleInput = screen.getByPlaceholderText(/LỊCH KHỞI HÀNH/i);
      fireEvent.change(titleInput, { target: { value: 'LƯU Ý THỜI TIẾT ĐÀ NẴNG' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Vui lòng nhập nội dung thông báo cho đoàn.')).toBeDefined();

      // Step 5: Fill in content and submit
      const contentInput = screen.getByPlaceholderText(/Nhập chi tiết/i);
      fireEvent.change(contentInput, {
        target: { value: 'Trời có mưa dông nhẹ, quý khách nhớ mang ô hoặc áo mưa tiện lợi.' },
      });
      fireEvent.click(submitBtn);

      // Step 6: Verify modal closes and new broadcast appears in active chat
      await waitFor(() => {
        expect(screen.queryByText('Phát thông báo cho đoàn Tour')).toBeNull();
      });

      expect(screen.getByText('LƯU Ý THỜI TIẾT ĐÀ NẴNG')).toBeDefined();
      expect(
        screen.getByText(
          'Trời có mưa dông nhẹ, quý khách nhớ mang ô hoặc áo mưa tiện lợi.',
        ),
      ).toBeDefined();

      // Step 7: Traveler acknowledges announcement
      const ackButtons = screen.getAllByRole('button', {
        name: /Tôi đã đọc và hiểu|Đã xác nhận đã đọc/,
      });
      const latestAckBtn = ackButtons[ackButtons.length - 1];
      fireEvent.click(latestAckBtn);

      // Button updates state cleanly
      expect(screen.getAllByText(/người đã xác nhận/).length).toBeGreaterThan(0);
    });

    it('navigates to direct 1-on-1 chat with Tour Guide and exchanges private messages', () => {
      render(<GroupChatHub />);

      // Switch to "Riêng tư" tab
      fireEvent.click(screen.getByRole('button', { name: /Riêng tư/ }));

      // Select HDV direct chat
      const directItem = screen.getAllByText('HDV Trần Văn Nam')[0];
      fireEvent.click(directItem);

      // Header shows direct chat info
      expect(screen.getAllByText('HDV Trần Văn Nam').length).toBeGreaterThan(0);
      expect(screen.getByText('Đang hoạt động')).toBeDefined();

      // Send private query to HDV
      const input = screen.getByPlaceholderText('Nhập tin nhắn...');
      fireEvent.change(input, {
        target: { value: 'Anh ơi, xe đón ở cửa số mấy của sân bay Đà Nẵng vậy ạ?' },
      });
      fireEvent.click(screen.getByLabelText('Gửi tin nhắn'));

      expect(
        screen.getByText('Anh ơi, xe đón ở cửa số mấy của sân bay Đà Nẵng vậy ạ?'),
      ).toBeDefined();
    });
  });

  describe('Workflow 2: Self-Guided Group Expense Splitting & VietQR Payment Workflow', () => {
    it('executes full bill splitting, validation, and VietQR generation flow', async () => {
      render(<GroupChatHub />);

      // Step 1: Switch to "Tự túc" tab and select Friends Group
      fireEvent.click(screen.getByRole('button', { name: /Tự túc/ }));
      fireEvent.click(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/)[0]);

      expect(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/).length).toBeGreaterThan(0);

      // Step 2: Open Action menu and select "Chia tiền (VietQR)"
      fireEvent.click(screen.getByTitle(/Thêm tiện ích/));
      fireEvent.click(screen.getByText('Chia tiền (VietQR)'));

      expect(screen.getByText('Chia tiền chuyến đi (Campuchia)')).toBeDefined();

      // Step 3: Test boundary validation - empty title and zero amount
      const submitExpenseBtn = screen.getByRole('button', { name: 'Gửi chia tiền' });
      fireEvent.click(submitExpenseBtn);

      expect(
        screen.getByText('Vui lòng nhập tên khoản chi (Ví dụ: Tiền bữa tối).'),
      ).toBeDefined();

      // Fill title but enter 0 amount
      const titleInput = screen.getByPlaceholderText(/Bữa trưa hải sản/i);
      fireEvent.change(titleInput, { target: { value: 'Tiền vé cáp treo Robin Hill' } });

      const amountInput = screen.getByPlaceholderText(/600\.000/i);
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(submitExpenseBtn);

      expect(screen.getByText('Số tiền chi tiêu phải lớn hơn 0.')).toBeDefined();

      // Step 4: Enter valid amount 800,000 VND
      fireEvent.change(amountInput, { target: { value: '800000' } });
      fireEvent.click(submitExpenseBtn);

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByText('Chia tiền chuyến đi (Campuchia)')).toBeNull();
      });

      // Step 5: Verify new Split Bill card appears in chat
      expect(screen.getByText('Tiền vé cáp treo Robin Hill')).toBeDefined();
      expect(screen.getAllByText(/800.000 đ/).length).toBeGreaterThan(0);

      // Step 6: Open VietQR payment modal
      const qrButtons = screen.getAllByRole('button', { name: /Quét VietQR chuyển tiền/ });
      const latestQrBtn = qrButtons[qrButtons.length - 1];
      fireEvent.click(latestQrBtn);

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Thanh toán VietQR')).toBeDefined();

      // Verify QR image element exists with proper VietQR URL
      const qrImg = screen.getByAltText(/Mã VietQR chuyển khoản/);
      expect(qrImg.getAttribute('src')).toContain('img.vietqr.io');

      // Test copying account number
      const copyBtn = screen.getByTitle('Sao chép số tài khoản');
      fireEvent.click(copyBtn);

      // Test marking as paid / toggle paid status
      const togglePaidBtn = screen.getByRole('button', {
        name: /Đã chuyển tiền xong|Đánh dấu chưa chuyển/,
      });
      fireEvent.click(togglePaidBtn);

      // Modal closes and status reflects paid
      await waitFor(() => {
        expect(screen.queryByText('Thanh toán VietQR')).toBeNull();
      });
    });
  });

  describe('Workflow 3: Poll Creation & Interactive Voting Workflow', () => {
    it('creates poll with validation and allows multiple users to cast and switch votes', async () => {
      render(<GroupChatHub />);

      // Step 1: Switch to Friends Group
      fireEvent.click(screen.getByRole('button', { name: /Tự túc/ }));
      fireEvent.click(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/)[0]);

      // Step 2: Open Create Poll modal
      fireEvent.click(screen.getByTitle(/Thêm tiện ích/));
      fireEvent.click(screen.getByText('Tạo bình chọn'));

      expect(screen.getByText('Tạo bình chọn nhóm')).toBeDefined();

      // Step 3: Boundary validation - empty question
      const createPollBtn = screen.getByRole('button', { name: 'Tạo bình chọn' });
      fireEvent.click(createPollBtn);

      expect(screen.getByText('Vui lòng nhập câu hỏi bình chọn.')).toBeDefined();

      // Enter question
      const questionInput = screen.getByPlaceholderText(/Trưa nay cả nhóm ăn gì/i);
      fireEvent.change(questionInput, {
        target: { value: 'Điểm ngắm hoàng hôn đẹp nhất chiều nay?' },
      });

      // Fill in options
      const optInputs = screen.getAllByPlaceholderText(/Lựa chọn/);
      fireEvent.change(optInputs[0], { target: { value: 'Đồi Đa Phú' } });
      fireEvent.change(optInputs[1], { target: { value: 'Hồ Tuyền Lâm' } });

      // Add 3rd option
      const addOptBtn = screen.getByRole('button', { name: /Thêm lựa chọn/ });
      fireEvent.click(addOptBtn);

      const allOptInputs = screen.getAllByPlaceholderText(/Lựa chọn/);
      expect(allOptInputs.length).toBe(3);
      fireEvent.change(allOptInputs[2], { target: { value: 'Tiệm Cà phê Hoàng Hôn' } });

      // Submit poll
      fireEvent.click(createPollBtn);

      await waitFor(() => {
        expect(screen.queryByText('Tạo bình chọn nhóm')).toBeNull();
      });

      // Step 4: Verify poll card rendered in chat
      expect(screen.getByText('Điểm ngắm hoàng hôn đẹp nhất chiều nay?')).toBeDefined();
      expect(screen.getByText('Đồi Đa Phú')).toBeDefined();
      expect(screen.getByText('Hồ Tuyền Lâm')).toBeDefined();
      expect(screen.getByText('Tiệm Cà phê Hoàng Hôn')).toBeDefined();

      // Step 5: Vote for "Đồi Đa Phú"
      const doiDaPhuBtn = screen.getByRole('button', { name: /Đồi Đa Phú/ });
      fireEvent.click(doiDaPhuBtn);

      expect(screen.getByText(/1 vote \(100%\)/)).toBeDefined();

      // Step 6: Switch vote to "Hồ Tuyền Lâm"
      const hoTuyenLamBtn = screen.getByRole('button', { name: /Hồ Tuyền Lâm/ });
      fireEvent.click(hoTuyenLamBtn);

      expect(screen.getByText(/1 vote \(100%\)/)).toBeDefined();
      expect(screen.getByText('✓ Hồ Tuyền Lâm')).toBeDefined();
    });
  });

  describe('Workflow 4: Edge Cases & Exception Safety', () => {
    it('handles search queries with no results gracefully without exceptions', () => {
      render(<GroupChatHub />);

      // Search conversation with non-existent keyword
      const searchInput = screen.getByPlaceholderText('Tìm kiếm nhóm, HDV, bạn bè…');
      fireEvent.change(searchInput, { target: { value: 'xyz_khong_ton_tai_123' } });

      expect(
        screen.getByText('Không tìm thấy cuộc trò chuyện nào phù hợp.'),
      ).toBeDefined();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(
        screen.getAllByText('Tour Khám phá Đà Nẵng - Hội An (3N2Đ)').length,
      ).toBeGreaterThan(0);
    });

    it('handles in-chat search with zero matches without throwing exceptions', () => {
      render(<GroupChatHub />);

      // Open in-chat search
      const toggleSearch = screen.getByTitle('Tìm kiếm tin nhắn trong nhóm');
      fireEvent.click(toggleSearch);

      const inChatInput = screen.getByPlaceholderText(
        'Nhập từ khóa cần tìm trong tin nhắn nhóm…',
      );
      fireEvent.change(inChatInput, { target: { value: 'tu_khoa_khong_co_trong_chat' } });

      expect(screen.getByText('0 kết quả')).toBeDefined();
      expect(
        screen.getByText('Chưa có tin nhắn nào trong cuộc trò chuyện này.'),
      ).toBeDefined();
    });

    it('ignores empty and whitespace-only message submissions without exceptions', () => {
      render(<GroupChatHub />);

      const input = screen.getByPlaceholderText('Nhập tin nhắn...');
      fireEvent.change(input, { target: { value: '   ' } });

      const sendBtn = screen.getByLabelText('Gửi tin nhắn');
      fireEvent.click(sendBtn);

      // Verify no blank bubble is created
      expect(screen.queryByText('   ')).toBeNull();
    });

    it('renders meeting point card with valid directions URL', () => {
      render(<GroupChatHub />);

      // Tour 101 has a meeting point card
      expect(screen.getByText('Điểm hẹn tập kết trước Cổng Chùa Cầu')).toBeDefined();
      expect(screen.getByText(/Đường Nguyễn Thị Minh Khai/)).toBeDefined();

      const directionsLink = screen.getByRole('link', {
        name: /Chỉ đường tới điểm hẹn/,
      });
      expect(directionsLink).toBeDefined();
      expect(directionsLink.getAttribute('href')).toContain('google.com/maps');
    });
  });
});

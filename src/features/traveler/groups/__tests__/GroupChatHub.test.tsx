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

describe('GroupChatHub Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders conversations list with Tour and Self-guided groups', () => {
    render(<GroupChatHub />);

    expect(screen.getByText('Trò chuyện nhóm')).toBeDefined();
    expect(screen.getAllByText('Tour Khám phá Đà Nẵng - Hội An (3N2Đ)').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/).length).toBeGreaterThan(0);
    expect(screen.getByText('HDV Trần Văn Nam')).toBeDefined();
  });

  it('filters conversations by tab and keyword', () => {
    render(<GroupChatHub />);

    // Click "Nhóm Tour" tab
    fireEvent.click(screen.getByRole('button', { name: /Nhóm Tour/ }));
    expect(screen.getAllByText('Tour Khám phá Đà Nẵng - Hội An (3N2Đ)').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Hội Bạn Thân Vi Vu Đà Lạt/)).toBeNull();

    // Click "Tất cả" tab
    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    expect(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/).length).toBeGreaterThan(0);

    // Type search keyword
    const searchInput = screen.getByPlaceholderText('Tìm kiếm nhóm, HDV, bạn bè…');
    fireEvent.change(searchInput, { target: { value: 'Đà Lạt' } });
    expect(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/).length).toBeGreaterThan(0);
  });

  it('selects a conversation and displays its interactive messages', () => {
    render(<GroupChatHub />);

    // Active conversation default is Tour 101
    expect(screen.getByText('LỊCH KHỞI HÀNH NGÀY 1 & GIẤY TỜ TÙY THÂN')).toBeDefined();
    expect(screen.getByText('ĐIỂM DANH LÊN XE KHỞI HÀNH')).toBeDefined();
    expect(screen.getByText('Điểm hẹn tập kết trước Cổng Chùa Cầu')).toBeDefined();
  });

  it('allows acknowledging HDV broadcast announcement', () => {
    render(<GroupChatHub />);

    const ackBtn = screen.getByRole('button', { name: /Tôi đã đọc và hiểu|Đã xác nhận đã đọc/ });
    fireEvent.click(ackBtn);

    // Button state toggles
    expect(screen.getByText(/người đã xác nhận/)).toBeDefined();
  });

  it('allows checking in to roll call', () => {
    render(<GroupChatHub />);

    const rollCallBtn = screen.getByRole('button', { name: /Xác nhận có mặt|Đã có mặt/ });
    fireEvent.click(rollCallBtn);

    expect(screen.getByText(/thành viên có mặt/)).toBeDefined();
  });

  it('switches to self-guided group and votes in poll', () => {
    render(<GroupChatHub />);

    // Click Friends Group in sidebar
    fireEvent.click(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/)[0]);

    expect(screen.getByText('Tối nay nhóm mình ăn món gì ở Đà Lạt?')).toBeDefined();

    // Vote on poll option
    const pollButtons = screen.getAllByRole('button', { name: /Lẩu gà lá é/ });
    const pollOpt = pollButtons[pollButtons.length - 1]; // Pick the poll option button
    fireEvent.click(pollOpt);

    expect(screen.getByText(/Tổng số phiếu:/)).toBeDefined();
  });

  it('opens VietQR modal when clicking Quét VietQR chuyển tiền', async () => {
    render(<GroupChatHub />);

    // Click Friends Group in sidebar
    fireEvent.click(screen.getAllByText(/Hội Bạn Thân Vi Vu Đà Lạt/)[0]);

    // Find and click VietQR button
    const qrBtn = screen.getByRole('button', { name: /Quét VietQR chuyển tiền/ });
    fireEvent.click(qrBtn);

    // Modal dialog is displayed
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Thanh toán VietQR')).toBeDefined();
    expect(screen.getAllByText('150.000 đ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nguyễn Hoàng Long').length).toBeGreaterThan(0);

    // Close modal
    fireEvent.click(screen.getAllByRole('button', { name: 'Đóng' })[0]);
    await waitFor(() => {
      expect(screen.queryByText('Thanh toán VietQR')).toBeNull();
    });
  });

  it('sends a new text message', () => {
    render(<GroupChatHub />);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    fireEvent.change(input, { target: { value: 'Xin chào mọi người!' } });

    const sendBtn = screen.getByLabelText('Gửi tin nhắn');
    fireEvent.click(sendBtn);

    expect(screen.getByText('Xin chào mọi người!')).toBeDefined();
  });

  it('toggles in-chat search bar', () => {
    render(<GroupChatHub />);

    const searchToggleBtn = screen.getByTitle('Tìm kiếm tin nhắn trong nhóm');
    fireEvent.click(searchToggleBtn);

    const inChatSearchInput = screen.getByPlaceholderText(
      'Nhập từ khóa cần tìm trong tin nhắn nhóm…',
    );
    expect(inChatSearchInput).toBeDefined();

    fireEvent.change(inChatSearchInput, { target: { value: 'CCCD' } });
    expect(screen.getByText(/kết quả/)).toBeDefined();
  });
});

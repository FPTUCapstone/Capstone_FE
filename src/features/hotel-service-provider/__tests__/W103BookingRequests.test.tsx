import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ServiceBookingRequestsView } from '../components/w103/ServiceBookingRequestsView';
import { ToastProvider } from '../components/common/Toast';
import { ProviderBookingService } from '../services/providerBookingService';

const mockSearchParams = new URLSearchParams();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('Screen W103: Service Booking Requests (Service Provider Workspace, UC-78)', () => {
  beforeEach(() => {
    ProviderBookingService.resetState();
    mockSearchParams.delete('status');
    mockSearchParams.delete('keyword');
    mockSearchParams.delete('page');
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <ServiceBookingRequestsView />
      </ToastProvider>
    );

  it('renders operational table with all mandatory columns in Vietnamese', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Yêu cầu đặt dịch vụ')).toBeDefined();
    });

    // Check mandatory table headers
    expect(screen.getByText('Mã yêu cầu')).toBeDefined();
    expect(screen.getByText('Cơ sở lưu trú')).toBeDefined();
    expect(screen.getByText('Gói phòng / Dịch vụ')).toBeDefined();
    expect(screen.getByText('Ngày nhận')).toBeDefined();
    expect(screen.getByText('Giờ nhận')).toBeDefined();
    expect(screen.getByText('Số lượng')).toBeDefined();
    expect(screen.getByText('Du khách')).toBeDefined();
    expect(screen.getByText('Trạng thái')).toBeDefined();
    expect(screen.getByText('Thời gian gửi')).toBeDefined();
    expect(screen.getByText('Thao tác')).toBeDefined();

    // Verify representative booking rows exist
    expect(screen.getByText('HBR-20261113-082')).toBeDefined();
    expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    expect(screen.getAllByText('Deluxe Riverside Suite').length).toBeGreaterThan(0);
  });

  it('displays sorting notice prioritizing Pending Confirmation requests', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Các yêu cầu ở trạng thái Chờ xác nhận được ưu tiên hiển thị trước/i)
      ).toBeDefined();
    });
  });

  it('enforces search-on-submit behavior', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('HBR-20261113-082')).toBeDefined();
      expect(screen.getByText('HBR-20261113-083')).toBeDefined();
    });

    const searchInput = screen.getByLabelText(/Tìm kiếm/i);
    fireEvent.change(searchInput, { target: { value: 'Tâm' } });

    // Before submit, both still present
    expect(screen.getByText('HBR-20261113-082')).toBeDefined();

    // Click Search button
    const searchBtn = screen.getByRole('button', { name: /^Tìm kiếm$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      // Only Tran Minh Tam should remain
      expect(screen.getByText('HBR-20261113-083')).toBeDefined();
      expect(screen.queryByText('HBR-20261113-082')).toBeNull();
    });
  });

  it('displays empty state when no requests match filter criteria', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('HBR-20261113-082')).toBeDefined();
    });

    const searchInput = screen.getByLabelText(/Tìm kiếm/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_KEYWORD_XYZ' } });

    const searchBtn = screen.getByRole('button', { name: /^Tìm kiếm$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Không tìm thấy yêu cầu đặt phòng nào/i)).toBeDefined();
      expect(
        screen.getByText(/Không có yêu cầu đặt phòng nào phù hợp với điều kiện tìm kiếm/i)
      ).toBeDefined();
    });
  });

  it('renders pagination details with Vietnamese formatting', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/10 yêu cầu trên hệ thống/i)).toBeDefined();
      expect(screen.getByText(/1 \/ 1/)).toBeDefined();
      expect(screen.getByRole('button', { name: /Trang trước/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Trang sau/i })).toBeDefined();
    });
  });
});

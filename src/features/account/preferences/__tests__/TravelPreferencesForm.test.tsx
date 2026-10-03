import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TravelPreferencesForm } from '../TravelPreferencesForm';
import * as api from '../travelPreferencesApi';
import { LocalPreferencesStorageError } from '../travelPreferencesStorage';
import { DEFAULT_PREFERENCES } from '../travelPreferencesTypes';

vi.mock('../travelPreferencesApi', () => ({
  getTravelPreferences: vi.fn(),
  updateTravelPreferences: vi.fn(),
  resetTravelPreferences: vi.fn(),
}));

describe('TravelPreferencesForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.resetTravelPreferences).mockReturnValue(DEFAULT_PREFERENCES);
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({
      success: true,
      messageCode: 'LOCAL_DEVICE_PREFERENCES',
      message: 'Sở thích du lịch đã được lưu trên thiết bị này.',
      notice: 'Đồng bộ sở thích du lịch với máy chủ đang chờ tích hợp.',
      preferences: DEFAULT_PREFERENCES,
      storageMode: 'LOCAL_DEVICE_PREFERENCES',
      integrationStatus: 'PENDING_BE_INTEGRATION',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all preference categories, interest options, travel styles, and budget tiers', () => {
    render(<TravelPreferencesForm initialPreferences={DEFAULT_PREFERENCES} />);

    expect(screen.getByRole('heading', { name: /1\. Sở thích trải nghiệm nổi bật/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: /2\. Phong cách chuyến đi/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: /3\. Mức ngân sách dự kiến/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: /4\. Tùy chọn di chuyển & Nhịp độ/ })).toBeDefined();

    // Check specific options
    expect(screen.getByText('Văn hóa & Di sản')).toBeDefined();
    expect(screen.getByText('Thiên nhiên & Sinh thái')).toBeDefined();
    expect(screen.getByText('Ẩm thực & Chợ đêm')).toBeDefined();
    expect(screen.getByText('Cặp đôi (Couple)')).toBeDefined();
    expect(screen.getByText('Tiêu chuẩn (Standard)')).toBeDefined();
    expect(screen.getByRole('button', { name: /Lưu sở thích/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Đặt lại mặc định/ })).toBeDefined();
  });

  it('allows toggling interest tags on and off', () => {
    render(<TravelPreferencesForm initialPreferences={DEFAULT_PREFERENCES} />);

    // Initially 3 selected in defaults: nature, food, culture
    expect(screen.getByText('Đã chọn: 3 / 8')).toBeDefined();

    // Click Adventure to add it
    const adventureBtn = screen.getByRole('button', { name: /Phiêu lưu & Khám phá/ });
    expect(adventureBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(adventureBtn);
    expect(adventureBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Đã chọn: 4 / 8')).toBeDefined();

    // Click Culture to remove it
    const cultureBtn = screen.getByRole('button', { name: /Văn hóa & Di sản/ });
    expect(cultureBtn.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(cultureBtn);
    expect(cultureBtn.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Đã chọn: 3 / 8')).toBeDefined();
  });

  it('validates required travel style and budget level (MSG22)', async () => {
    render(
      <TravelPreferencesForm
        initialPreferences={{
          ...DEFAULT_PREFERENCES,
          travelStyle: null,
          budgetLevel: null,
        }}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Lưu sở thích/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng chọn phong cách du lịch và mức ngân sách dự kiến/)).toBeDefined();
    });
    expect(api.updateTravelPreferences).not.toHaveBeenCalled();
  });

  it('submits form successfully and displays local device preferences feedback and notice', async () => {
    const onSaved = vi.fn();
    render(<TravelPreferencesForm initialPreferences={DEFAULT_PREFERENCES} onSaved={onSaved} />);

    const submitBtn = screen.getByRole('button', { name: /Lưu sở thích/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.updateTravelPreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          travelStyle: 'couple',
          budgetLevel: 'standard',
        }),
        expect.any(Object),
      );
      expect(screen.getByText('Sở thích du lịch đã được lưu trên thiết bị này.')).toBeDefined();
      expect(screen.getByText(/Chờ tích hợp máy chủ/)).toBeDefined();
      expect(onSaved).toHaveBeenCalledWith(DEFAULT_PREFERENCES);
    });
  });

  it('handles save failure without reporting false success and does not call onSaved', async () => {
    const onSaved = vi.fn();
    vi.mocked(api.updateTravelPreferences).mockRejectedValueOnce(
      new LocalPreferencesStorageError(
        'Không thể lưu sở thích trên thiết bị này. Vui lòng kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt rồi thử lại.',
      ),
    );

    render(<TravelPreferencesForm initialPreferences={DEFAULT_PREFERENCES} onSaved={onSaved} />);

    const submitBtn = screen.getByRole('button', { name: /Lưu sở thích/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Không thể lưu sở thích')).toBeDefined();
      expect(
        screen.getByText(
          'Không thể lưu sở thích trên thiết bị này. Vui lòng kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt rồi thử lại.',
        ),
      ).toBeDefined();
      expect(screen.queryByText('Đã lưu trên thiết bị')).toBeNull();
      expect(screen.queryByText('Sở thích du lịch đã được lưu trên thiết bị này.')).toBeNull();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });

  it('resets preferences to default values when reset button is clicked and succeeds', () => {
    render(
      <TravelPreferencesForm
        initialPreferences={{
          ...DEFAULT_PREFERENCES,
          interests: ['adventure'],
          travelStyle: 'solo',
        }}
      />,
    );

    const resetBtn = screen.getByRole('button', { name: /Đặt lại mặc định/ });
    fireEvent.click(resetBtn);

    expect(api.resetTravelPreferences).toHaveBeenCalled();
    expect(screen.getByText('Đã đặt lại mặc định')).toBeDefined();
    expect(
      screen.getByText('Các tùy chọn sở thích đã được khôi phục về giá trị khuyến nghị ban đầu.'),
    ).toBeDefined();
  });

  it('handles reset failure gracefully without updating state or reporting false success', () => {
    vi.mocked(api.resetTravelPreferences).mockImplementationOnce(() => {
      throw new LocalPreferencesStorageError();
    });

    render(
      <TravelPreferencesForm
        initialPreferences={{
          ...DEFAULT_PREFERENCES,
          interests: ['adventure'],
          travelStyle: 'solo',
        }}
      />,
    );

    const resetBtn = screen.getByRole('button', { name: /Đặt lại mặc định/ });
    fireEvent.click(resetBtn);

    expect(api.resetTravelPreferences).toHaveBeenCalled();
    // Must NOT show success
    expect(screen.queryByText('Đã đặt lại mặc định')).toBeNull();
    // Must show explicit error
    expect(screen.getByText('Không thể đặt lại sở thích')).toBeDefined();
    expect(
      screen.getByText(
        'Không thể lưu cài đặt mặc định trên thiết bị này. Vui lòng kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt rồi thử lại.',
      ),
    ).toBeDefined();
    // Reset button must not be stuck in resetting state
    expect(resetBtn.hasAttribute('disabled')).toBe(false);
  });
});

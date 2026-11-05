import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getWeatherSafetyReviewBadgeCount } from '@/features/operator/weather-safety/weatherSafetyApi';
import { PartnerWorkspaceLayout } from '../PartnerWorkspaceLayout';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const realtime = vi.hoisted(() => ({
  options: undefined as undefined | { onRefreshHint?: () => void; enabled?: boolean },
}));

vi.mock('@/features/operator/weather-safety/realtime/useWeatherSafetyRealtime', () => ({
  useWeatherSafetyRealtime: (options: { onRefreshHint?: () => void; enabled?: boolean }) => {
    realtime.options = options;
    return { isConnected: false, connectionState: 'Disconnected' };
  },
}));

vi.mock('@/features/operator/weather-safety/weatherSafetyApi', () => ({
  getWeatherSafetyReviewBadgeCount: vi.fn().mockResolvedValue(0),
}));

describe('PartnerWorkspaceLayout', () => {
  it('shows the safety alert count read from the server', async () => {
    vi.mocked(getWeatherSafetyReviewBadgeCount).mockResolvedValueOnce(4);

    render(
      <PartnerWorkspaceLayout activeTab="tours">
        <div>Content</div>
      </PartnerWorkspaceLayout>
    );

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Cảnh báo an toàn/i }).textContent).toMatch(/4/)
    );
    expect(getWeatherSafetyReviewBadgeCount).toHaveBeenCalledTimes(1);
  });

  it('updates the safety alert count without a page reload', async () => {
    vi.mocked(getWeatherSafetyReviewBadgeCount).mockResolvedValueOnce(4).mockResolvedValueOnce(3);

    render(
      <PartnerWorkspaceLayout activeTab="tours">
        <div>Content</div>
      </PartnerWorkspaceLayout>
    );
    const link = () => screen.getByRole('link', { name: /Cảnh báo an toàn/i });
    await waitFor(() => expect(link().textContent).toMatch(/4/));

    realtime.options?.onRefreshHint?.();

    await waitFor(() => expect(link().textContent).toMatch(/3/));
  });

  it('keeps demo pages off the realtime connection', () => {
    render(
      <PartnerWorkspaceLayout activeTab="tours" isDemo={true}>
        <div>Content</div>
      </PartnerWorkspaceLayout>
    );

    expect(realtime.options?.enabled).toBe(false);
  });

  it('does not read safety alerts for demo data', () => {
    vi.mocked(getWeatherSafetyReviewBadgeCount).mockClear();

    render(
      <PartnerWorkspaceLayout activeTab="tours" isDemo={true}>
        <div>Content</div>
      </PartnerWorkspaceLayout>
    );

    expect(getWeatherSafetyReviewBadgeCount).not.toHaveBeenCalled();
  });

  it('renders children within the unified workspace layout', () => {
    render(
      <PartnerWorkspaceLayout activeTab="dashboard" operatorName="Han River Travel Co.">
        <div data-testid="workspace-content">Nội dung bảng điều khiển</div>
      </PartnerWorkspaceLayout>
    );

    expect(screen.getByTestId('workspace-content')).toBeDefined();
    expect(screen.getAllByText('Han River Travel Co.').length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation', { name: /Điều hướng không gian làm việc đối tác/i })).toBeDefined();
  });

  it('manages mobile drawer visibility on mobile toggle button click', () => {
    render(
      <PartnerWorkspaceLayout activeTab="dashboard">
        <div>Content</div>
      </PartnerWorkspaceLayout>
    );

    const toggleBtn = screen.getByRole('button', { name: 'Mở menu quản lý' });
    fireEvent.click(toggleBtn);

    // After clicking toggle, menu drawer backdrop or close button is available
    const closeButtons = screen.getAllByRole('button', { name: /Đóng menu/i });
    expect(closeButtons.length).toBeGreaterThan(0);

    // Press Escape to close
    fireEvent.keyDown(document, { key: 'Escape' });
  });
});

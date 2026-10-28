import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PartnerWorkspaceLayout } from '../PartnerWorkspaceLayout';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('PartnerWorkspaceLayout', () => {
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

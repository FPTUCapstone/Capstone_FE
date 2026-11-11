import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from '../PageHeader';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('PageHeader', () => {
  it('renders title and description properly', () => {
    render(
      <PageHeader
        title="Quản lý gói tour"
        description="Danh sách toàn bộ các chương trình tour du lịch của doanh nghiệp."
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Quản lý gói tour' })).toBeDefined();
    expect(screen.getByText('Danh sách toàn bộ các chương trình tour du lịch của doanh nghiệp.')).toBeDefined();
  });

  it('renders action button slot', () => {
    render(
      <PageHeader
        title="Quản lý gói tour"
        actionSlot={<button type="button">Tạo tour mới</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Tạo tour mới' })).toBeDefined();
  });

  it('renders back button and triggers onBack callback when clicked', () => {
    const handleBack = vi.fn();
    render(
      <PageHeader
        title="Tạo gói tour mới"
        onBack={handleBack}
      />
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders optional status badge', () => {
    render(
      <PageHeader
        title="Chi tiết gói tour"
        badge={<span data-testid="status-badge">Đã duyệt</span>}
      />
    );

    expect(screen.getByTestId('status-badge')).toBeDefined();
  });
});

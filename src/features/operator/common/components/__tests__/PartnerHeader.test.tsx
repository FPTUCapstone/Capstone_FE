import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PartnerHeader } from '../PartnerHeader';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('PartnerHeader', () => {
  it('renders breadcrumb indicating current active tab', () => {
    render(<PartnerHeader activeTab="tours" />);

    expect(screen.getByText('Quản lý đối tác')).toBeDefined();
    expect(screen.getByText('Gói tour')).toBeDefined();
  });

  it('renders custom breadcrumbs when supplied', () => {
    render(
      <PartnerHeader
        activeTab="tours"
        breadcrumbs={[
          { label: 'Gói tour', href: '/partner/tours' },
          { label: 'Tạo tour mới' },
        ]}
      />
    );

    expect(screen.getByText('Tạo tour mới')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Gói tour' })).toBeDefined();
  });

  it('toggles mobile menu on button click and provides accessible labels', () => {
    const handleToggle = vi.fn();
    render(<PartnerHeader activeTab="dashboard" mobileOpen={false} onToggleMobileMenu={handleToggle} />);

    const menuButton = screen.getByRole('button', { name: 'Mở menu quản lý' });
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(menuButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('renders demo badge when isDemo is true', () => {
    render(<PartnerHeader activeTab="dashboard" isDemo={true} />);

    expect(screen.getByText(/Chế độ thử nghiệm/i)).toBeDefined();
  });

  it('renders operator name when supplied', () => {
    render(<PartnerHeader activeTab="dashboard" operatorName="Han River Travel Co." />);

    expect(screen.getByText('Han River Travel Co.')).toBeDefined();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OperatorStatusBadge } from '../OperatorStatusBadge';

describe('OperatorStatusBadge', () => {
  it('renders Approved status with emerald styling and Vietnamese label', () => {
    render(<OperatorStatusBadge status="Approved" />);

    expect(screen.getByText('Đã duyệt')).toBeDefined();
    const badge = screen.getByTestId('operator-status-badge');
    expect(badge.className).toContain('text-emerald-700');
  });

  it('renders Confirmed status with emerald styling and Vietnamese label', () => {
    render(<OperatorStatusBadge status="Confirmed" />);

    expect(screen.getByText('Đã xác nhận')).toBeDefined();
    const badge = screen.getByTestId('operator-status-badge');
    expect(badge.className).toContain('text-emerald-700');
  });

  it('renders Pending status with amber styling and Vietnamese label', () => {
    render(<OperatorStatusBadge status="Pending" />);

    expect(screen.getByText('Chờ duyệt')).toBeDefined();
    const badge = screen.getByTestId('operator-status-badge');
    expect(badge.className).toContain('text-amber-700');
  });

  it('renders Draft status with slate styling and Vietnamese label', () => {
    render(<OperatorStatusBadge status="Draft" />);

    expect(screen.getByText('Bản nháp')).toBeDefined();
    const badge = screen.getByTestId('operator-status-badge');
    expect(badge.className).toContain('text-slate-600');
  });

  it('renders Rejected and Cancelled status with rose styling', () => {
    const { rerender } = render(<OperatorStatusBadge status="Rejected" />);
    expect(screen.getByText('Bị từ chối')).toBeDefined();
    expect(screen.getByTestId('operator-status-badge').className).toContain('text-rose-700');

    rerender(<OperatorStatusBadge status="Cancelled" />);
    expect(screen.getByText('Đã hủy')).toBeDefined();
    expect(screen.getByTestId('operator-status-badge').className).toContain('text-rose-700');
  });

  it('supports custom label override while preserving semantic color', () => {
    render(<OperatorStatusBadge status="Approved" label="Đang hoạt động" />);

    expect(screen.getByText('Đang hoạt động')).toBeDefined();
    expect(screen.getByTestId('operator-status-badge').className).toContain('text-emerald-700');
  });
});

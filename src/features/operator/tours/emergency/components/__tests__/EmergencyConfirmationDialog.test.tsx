import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmergencyConfirmationDialog } from '../EmergencyConfirmationDialog';

describe('EmergencyConfirmationDialog', () => {
  it('renders confirmation content and handles confirm/cancel events', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <EmergencyConfirmationDialog
        isOpen={true}
        title="Bạn có chắc chắn muốn hủy lịch khởi hành này?"
        actionType="CancelBeforeDeparture"
        affectedBookings={10}
        affectedPassengers={25}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText(/Bạn có chắc chắn muốn hủy lịch khởi hành này\?/i)).toBeDefined();
    expect(screen.getByText(/10 đơn/i)).toBeDefined();
    expect(screen.getByText(/25 hành khách/i)).toBeDefined();
    expect(screen.getByText(/được xử lý riêng theo chính sách hủy booking áp dụng/i)).toBeDefined();
    expect(screen.queryByText(/VND|Quy trình hoàn tiền/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Đồng ý hủy/i }));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Hủy bỏ/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EmergencyConfirmationDialog
        isOpen={false}
        title="Test"
        actionType="CancelBeforeDeparture"
        affectedBookings={5}
        affectedPassengers={10}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

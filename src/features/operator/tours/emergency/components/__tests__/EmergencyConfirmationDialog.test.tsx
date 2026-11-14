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
    expect(
      screen.getByText(
        'Mỗi booking đã thanh toán sẽ được hoàn 100% số tiền đã trả. Booking chưa thanh toán không phát sinh hoàn tiền.'
      )
    ).toBeDefined();
    expect(screen.queryByText(/chính sách hủy booking/i)).toBeNull();
    expect(screen.queryByText(/VND|Quy trình hoàn tiền/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Đồng ý hủy/i }));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Hủy bỏ/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('tells the Operator that TripMate reviews refunds for an emergency stop', () => {
    render(
      <EmergencyConfirmationDialog
        isOpen={true}
        title="Dừng tour?"
        actionType="EmergencyStopActive"
        affectedBookings={3}
        affectedPassengers={6}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText('Booking đã thanh toán sẽ được TripMate xem xét hoàn phần dịch vụ chưa thực hiện.')
    ).toBeDefined();
    expect(screen.queryByText(/hoàn 100%/i)).toBeNull();
    expect(screen.queryByText(/chính sách hủy booking/i)).toBeNull();
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

import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InitiateRefundDialog } from './InitiateRefundDialog';
import { INITIAL_DEMO_BOOKINGS } from '../data/operatorBookingDemoFixtures';
import type { InitiateRefundPayload } from '../types/bookingLifecycle';

const sampleBooking = INITIAL_DEMO_BOOKINGS[0]; // BK-20260919-0141

function TestHarness({
  onConfirm = vi.fn(),
  initialOpen = true,
}: {
  onConfirm?: (payload: InitiateRefundPayload) => void;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div>
      <button data-testid="open-refund-btn" onClick={() => setOpen(true)}>
        Mở hoàn tiền
      </button>
      <InitiateRefundDialog
        open={open}
        booking={sampleBooking}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
      />
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe('InitiateRefundDialog (UC-42 Accessibility & Behavior)', () => {
  it('renders modal dialog with aria-modal="true" and accessible title/description', () => {
    render(<TestHarness />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('heading', { level: 2, name: /Khởi tạo hoàn tiền đơn/i })).toBeDefined();
  });

  it('sets initial focus to close button and restores trigger focus on close', () => {
    render(<TestHarness initialOpen={false} />);

    const trigger = screen.getByTestId('open-refund-btn');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);

    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    expect(document.activeElement).toBe(closeBtn);

    fireEvent.click(closeBtn);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes dialog upon Escape key press and restores trigger focus', () => {
    render(<TestHarness initialOpen={false} />);

    const trigger = screen.getByTestId('open-refund-btn');
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('wraps focus when pressing Tab on the last element and Shift+Tab on the first element', () => {
    render(<TestHarness initialOpen={true} />);

    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    first.focus();
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('submits valid refund payload when initiate button is clicked', () => {
    const handleConfirm = vi.fn();
    render(<TestHarness onConfirm={handleConfirm} />);

    const textarea = screen.getByLabelText(/Ghi chú hoàn tiền/i);
    fireEvent.change(textarea, { target: { value: 'Hoàn tiền đối soát tự động' } });

    const submitBtn = screen.getByRole('button', { name: /Khởi tạo hoàn tiền/i });
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      notes: 'Hoàn tiền đối soát tự động',
    });
  });
});

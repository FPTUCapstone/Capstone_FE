import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CancelBookingDialog } from './CancelBookingDialog';
import { INITIAL_DEMO_BOOKINGS } from '../data/operatorBookingDemoFixtures';
import { bookingEn } from '../resources/en';
import type { CancelBookingPayload } from '../types/bookingLifecycle';

const sampleBooking = INITIAL_DEMO_BOOKINGS[0]; // BK-20260919-0141

function TestHarness({
  onConfirm = vi.fn(),
  initialOpen = true,
}: {
  onConfirm?: (payload: CancelBookingPayload) => void;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div>
      <button data-testid="open-trigger-btn" onClick={() => setOpen(true)}>
        Open Dialog
      </button>
      <CancelBookingDialog
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

describe('CancelBookingDialog (UC-41 Accessibility & Behavior)', () => {
  it('renders modal dialog with aria-modal="true" and accessible title/description in English', () => {
    render(<TestHarness />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(
      screen.getByRole('heading', { level: 2, name: new RegExp(bookingEn.cancelDialog.title, 'i') })
    ).toBeDefined();
  });

  it('sets initial focus to the close button inside the dialog and restores trigger focus on close', () => {
    render(<TestHarness initialOpen={false} />);

    const trigger = screen.getByTestId('open-trigger-btn');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);

    // Initial focus enters dialog (Close button)
    const closeBtn = screen.getByRole('button', { name: bookingEn.cancelDialog.closeBtn });
    expect(document.activeElement).toBe(closeBtn);

    // Click close to test focus restoration
    fireEvent.click(closeBtn);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes dialog upon Escape key press and restores trigger focus', () => {
    render(<TestHarness initialOpen={false} />);

    const trigger = screen.getByTestId('open-trigger-btn');
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toBeDefined();

    // Press Escape
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

    // Focus last element and press Tab -> should wrap to first
    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    // Focus first element and press Shift+Tab -> should wrap to last
    first.focus();
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('validates empty reason and surfaces MSG123 inline error (CR-04)', () => {
    const handleConfirm = vi.fn();
    render(<TestHarness onConfirm={handleConfirm} />);

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(bookingEn.cancelDialog.confirmBtn, 'i'),
    });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(bookingEn.messages.MSG123)).toBeDefined();
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('submits valid payload when reason is provided', () => {
    const handleConfirm = vi.fn();
    render(<TestHarness onConfirm={handleConfirm} />);

    const textarea = screen.getByLabelText(new RegExp(bookingEn.cancelDialog.reasonDetailLabel, 'i'));
    fireEvent.change(textarea, { target: { value: 'Customer requested cancellation due to personal reasons' } });

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(bookingEn.cancelDialog.confirmBtn, 'i'),
    });
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      reasonType: 'CUSTOMER_REQUEST',
      reasonDetail: 'Customer requested cancellation due to personal reasons',
    });
  });

  it('1. Dialog: selects TOUR_ITINERARY_CHANGE, enters detail, submits -> payload includes exact reasonType and reasonDetail', () => {
    const handleConfirm = vi.fn();
    render(<TestHarness onConfirm={handleConfirm} />);

    const select = screen.getByLabelText(new RegExp(bookingEn.cancelDialog.reasonTypeLabel, 'i'));
    fireEvent.change(select, { target: { value: 'TOUR_ITINERARY_CHANGE' } });

    const textarea = screen.getByLabelText(new RegExp(bookingEn.cancelDialog.reasonDetailLabel, 'i'));
    fireEvent.change(textarea, { target: { value: 'Tour schedule changed due to route closure' } });

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(bookingEn.cancelDialog.confirmBtn, 'i'),
    });
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      reasonType: 'TOUR_ITINERARY_CHANGE',
      reasonDetail: 'Tour schedule changed due to route closure',
    });
  });
});

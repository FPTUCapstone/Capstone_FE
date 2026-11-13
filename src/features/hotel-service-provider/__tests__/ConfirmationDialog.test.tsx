import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

describe('ConfirmationDialog Component (CR-05)', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmationDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Action"
        message="Are you sure?"
      />
    );

    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('renders modal dialog with accessible labels when isOpen is true', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Acceptance"
        message="Do you want to confirm booking HBR-001?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeDefined();
    expect(screen.getByText('Confirm Acceptance')).toBeDefined();
    expect(screen.getByText('Do you want to confirm booking HBR-001?')).toBeDefined();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Confirm Acceptance"
        message="Do you want to confirm booking HBR-001?"
        confirmLabel="Yes, Confirm"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Yes, Confirm/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Confirm Acceptance"
        message="Do you want to confirm booking HBR-001?"
        cancelLabel="Dismiss"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Confirm Acceptance"
        message="Do you want to confirm booking HBR-001?"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

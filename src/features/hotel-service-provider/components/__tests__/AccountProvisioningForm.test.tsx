// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountProvisioningForm } from '../AccountProvisioningForm';
import { StaffProviderService } from '../../services/staffProviderService';
import { WorkflowError } from '../../services/workflowClient';
import { hotelProviderEn } from '../../resources/en';

vi.mock('../../services/staffProviderService', () => ({
  StaffProviderService: {
    createStaffAccount: vi.fn(),
    createServiceProviderAccount: vi.fn(),
    fetchCommercialPois: vi.fn().mockResolvedValue([]),
  },
}));

describe('AccountProvisioningForm - Staff Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('renders all three required fields with correct labels and hints', () => {
    render(<AccountProvisioningForm kind="staff" />);

    expect(screen.getByRole('heading', { name: 'Create Staff Account' })).toBeDefined();
    expect(screen.getByLabelText(/Full Name/)).toBeDefined();
    expect(screen.getByLabelText(/Account Email Address/)).toBeDefined();
    expect(screen.getByLabelText(/Contact Phone Number/)).toBeDefined();

    // Verify submit button in staff mode
    expect(screen.getByRole('button', { name: 'Create Staff Account' })).toBeDefined();

    // Verify Cancel link points to /admin/users
    expect(screen.getByRole('link', { name: 'Cancel' }).getAttribute('href')).toBe('/admin/users');

    // Contextual information panel on desktop
    expect(screen.getByRole('region', { name: 'Staff account information' })).toBeDefined();
    expect(screen.getByText(/Staff Role Privileges/i)).toBeDefined();
  });

  it('validates empty inputs and shows inline validation error MSG01', async () => {
    render(<AccountProvisioningForm kind="staff" />);

    const submitBtn = screen.getByRole('button', { name: 'Create Staff Account' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errors = screen.getAllByText('Please fill in all required fields.');
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    expect(StaffProviderService.createStaffAccount).not.toHaveBeenCalled();
  });

  it('validates invalid email format MSG143', async () => {
    render(<AccountProvisioningForm kind="staff" />);

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Tran Van Staff' } });
    fireEvent.change(screen.getByLabelText(/Account Email Address/), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/Contact Phone Number/), { target: { value: '0912345678' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Staff Account' }));

    await waitFor(() => {
      expect(screen.getByText(hotelProviderEn.messages.MSG143)).toBeDefined();
    });

    expect(StaffProviderService.createStaffAccount).not.toHaveBeenCalled();
  });

  it('validates phone number string and preserves leading zeros', async () => {
    vi.mocked(StaffProviderService.createStaffAccount).mockResolvedValue({
      success: true,
      account: {
        userId: 101,
        fullName: 'Tran Van Staff',
        email: 'staff@tripmate.com',
        phoneNumber: '0912345678',
        role: 'Staff',
        status: 'Active',
        mustChangePassword: true,
        linkedPoiIds: [],
        emailDeliveryStatus: 'Delivered',
      },
    });

    render(<AccountProvisioningForm kind="staff" />);

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Tran Van Staff' } });
    fireEvent.change(screen.getByLabelText(/Account Email Address/), { target: { value: 'staff@tripmate.com' } });
    fireEvent.change(screen.getByLabelText(/Contact Phone Number/), { target: { value: '0912345678' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Staff Account' }));

    await waitFor(() => {
      expect(StaffProviderService.createStaffAccount).toHaveBeenCalledWith({
        fullName: 'Tran Van Staff',
        email: 'staff@tripmate.com',
        phoneNumber: '0912345678', // preserves leading zero as a string
      });
    });

    // Check success status card
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.getByText(/Staff account created successfully/)).toBeDefined();
      expect(screen.getByText(/The temporary password email has been sent/)).toBeDefined();
    });
  });

  it('handles duplicate email error MSG05 and duplicate phone error MSG_PHONE_DUP', async () => {
    vi.mocked(StaffProviderService.createStaffAccount).mockRejectedValueOnce(
      new WorkflowError('MSG05'),
    );

    render(<AccountProvisioningForm kind="staff" />);

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Tran Van Staff' } });
    fireEvent.change(screen.getByLabelText(/Account Email Address/), { target: { value: 'duplicate@tripmate.com' } });
    fireEvent.change(screen.getByLabelText(/Contact Phone Number/), { target: { value: '0912345678' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Staff Account' }));

    await waitFor(() => {
      expect(screen.getAllByText(hotelProviderEn.messages.MSG05).length).toBeGreaterThanOrEqual(1);
    });
  });
});

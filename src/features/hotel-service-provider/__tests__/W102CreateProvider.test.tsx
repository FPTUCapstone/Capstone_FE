import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CreateServiceProviderView } from '../components/w102/CreateServiceProviderView';
import { ToastProvider } from '../components/common/Toast';
import { StaffProviderService } from '../services/staffProviderService';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Screen W102: Create Service Provider Account (Staff Workspace, UC-77)', () => {
  beforeEach(() => {
    StaffProviderService.resetState();
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <CreateServiceProviderView />
      </ToastProvider>
    );

  it('renders 65/35 split layout with all official fields and operational guidance', async () => {
    renderComponent();

    // Verify Title & Staff Role Boundary
    expect(screen.getByRole('heading', { name: /Create Service Provider Account/i })).toBeDefined();
    expect(screen.getByText(/Staff Role Boundary/i)).toBeDefined();

    // Verify Official SRS Form Fields
    expect(screen.getByLabelText(/Business \/ Property Name/i)).toBeDefined();
    expect(screen.getByText(/Service Category/i)).toBeDefined();
    expect(screen.getByLabelText(/Representative Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Account Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Contact Phone Number/i)).toBeDefined();

    // Verify POI Selector after loading
    await waitFor(() => {
      expect(screen.getByText(/Select Active Commercial POI/i)).toBeDefined();
    });

    // Verify Operational Guidance on Right Panel
    expect(screen.getByText(/Operational Provisioning Guidance/i)).toBeDefined();
    expect(screen.getByText(/Staff Authorization Authority/i)).toBeDefined();
    expect(screen.getByText(/No Plaintext Password Exposure/i)).toBeDefined();

    // Crucial SRS §3.9.1.5 Requirement: No password input must be rendered
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });

  it('validates mandatory fields and shows MSG01 when submitting blank form', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', {
      name: /Create Provider Account & Send Credentials/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Inline errors
      const errorMsgs = screen.getAllByText(/Please fill in all required fields/i);
      expect(errorMsgs.length).toBeGreaterThan(0);
    });
  });

  it('validates email format with MSG143 on invalid email', async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/Account Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitBtn = screen.getByRole('button', {
      name: /Create Provider Account & Send Credentials/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/The entered value is out of the allowed range or is not valid/i)
      ).toBeDefined();
    });
  });

  it('successfully provisions provider account and displays MSG201', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Loading commercial points of interest/i)).toBeNull();
    });

    // Fill valid details
    fireEvent.change(screen.getByLabelText(/Business \/ Property Name/i), {
      target: { value: 'Hội An Riverside Heritage Resort' },
    });
    fireEvent.change(screen.getByLabelText(/Representative Full Name/i), {
      target: { value: 'Trần Thị Lan' },
    });
    fireEvent.change(screen.getByLabelText(/Account Email Address/i), {
      target: { value: 'lan.tran@hoianriverside.vn' },
    });
    fireEvent.change(screen.getByLabelText(/Contact Phone Number/i), {
      target: { value: '0905 123 456' },
    });

    const submitBtn = screen.getByRole('button', {
      name: /Create Provider Account & Send Credentials/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Account Provisioned Successfully/i)).toBeDefined();
      expect(
        screen.getAllByText(/Service Provider account created\. A temporary password has been sent/i).length
      ).toBeGreaterThan(0);
    });
  });
});

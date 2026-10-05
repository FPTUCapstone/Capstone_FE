import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OperatorRegistrationForm } from './OperatorRegistrationForm';
import { OperatorRegistrationError } from './registerOperator';

const auth = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(), sendEmailVerification: vi.fn(),
  user: { getIdToken: vi.fn(), delete: vi.fn() },
}));
const api = vi.hoisted(() => ({ registerOperator: vi.fn() }));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: auth.createUserWithEmailAndPassword,
  sendEmailVerification: auth.sendEmailVerification,
}));
vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: () => ({}) }));
vi.mock('./registerOperator', async (original) => ({
  ...(await original<typeof import('./registerOperator')>()), registerOperator: api.registerOperator,
}));

function complete() {
  fireEvent.change(screen.getByRole('textbox', { name: 'Email Address' }), { target: { value: 'operator@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1!' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password1!' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Company Name' }), { target: { value: 'Travel Co' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Business Licence Number' }), { target: { value: 'LIC-1' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Tax Code' }), { target: { value: 'TAX-1' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Contact Person' }), { target: { value: 'Operator Name' } });
  fireEvent.change(screen.getByLabelText(/Business Licence \(required/), {
    target: { files: [new File(['%PDF-1'], 'licence.pdf', { type: 'application/pdf' })] },
  });
  fireEvent.click(screen.getByRole('checkbox'));
}

describe('OperatorRegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user.getIdToken.mockResolvedValue('token');
    auth.user.delete.mockResolvedValue(undefined);
    auth.createUserWithEmailAndPassword.mockResolvedValue({ user: auth.user });
    auth.sendEmailVerification.mockResolvedValue(undefined);
    api.registerOperator.mockResolvedValue({ userId: 42, applicationStatus: 'PendingApproval', messageCode: 'MSG08' });
  });

  it('blocks invalid files before creating a Firebase account', () => {
    render(<OperatorRegistrationForm />);
    complete();
    fireEvent.change(screen.getByLabelText(/Business Licence \(required/), {
      target: { files: [new File(['bad'], 'bad.txt', { type: 'text/plain' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    expect(screen.getByText('The uploaded file type is not supported or the file exceeds the size limit.')).toBeDefined();
    expect(auth.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('registers before emailing and does not auto-login', async () => {
    render(<OperatorRegistrationForm />);
    complete();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    await screen.findByText('Your application is under review.');
    expect(api.registerOperator).toHaveBeenCalledWith(expect.objectContaining({
      firebaseIdToken: 'token', email: 'operator@example.com', businessLicenseNo: 'LIC-1',
      businessAddress: '', contactPhone: '',
    }));
    expect(auth.sendEmailVerification).toHaveBeenCalledWith(auth.user, expect.objectContaining({
      url: expect.stringContaining('/verify-email?flow=operator'),
    }));
    expect(api.registerOperator.mock.invocationCallOrder[0]).toBeLessThan(auth.sendEmailVerification.mock.invocationCallOrder[0]);
  });

  it('deletes a new Firebase identity after a confirmed backend rejection', async () => {
    api.registerOperator.mockRejectedValue(new OperatorRegistrationError(409, 'MSG159', {}));
    render(<OperatorRegistrationForm />);
    complete();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    expect(await screen.findByText('This business licence number or tax code is already registered.')).toBeDefined();
    await waitFor(() => expect(auth.user.delete).toHaveBeenCalledOnce());
  });

  it('retains the Firebase identity when the backend rejects its token', async () => {
    api.registerOperator.mockRejectedValue(new OperatorRegistrationError(401, 'AUTH_TOKEN_INVALID', {}));
    render(<OperatorRegistrationForm />);
    complete();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    expect(await screen.findByText('Your registration session has expired. Please sign in with the same email and try again.')).toBeDefined();
    expect(auth.user.delete).not.toHaveBeenCalled();
  });

  it('keeps and reuses Firebase identity after an ambiguous response', async () => {
    api.registerOperator.mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce({
      userId: 42, applicationStatus: 'PendingApproval', messageCode: 'MSG08',
    });
    render(<OperatorRegistrationForm />);
    complete();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    await screen.findByText('TripMate is temporarily unable to process your request. Please check your connection and try again.');
    expect(auth.user.delete).not.toHaveBeenCalled();
    expect((screen.getByRole('textbox', { name: 'Company Name' }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    await screen.findByText('Your application is under review.');
    expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledOnce();
    expect(api.registerOperator).toHaveBeenCalledTimes(2);
  });

  it('keeps the committed application if verification email delivery fails', async () => {
    auth.sendEmailVerification.mockRejectedValue(new Error('mail unavailable'));
    render(<OperatorRegistrationForm />);
    complete();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    expect(await screen.findByText('Your application is under review.')).toBeDefined();
    expect(await screen.findByText(/application was saved, but the verification email/)).toBeDefined();
    expect(api.registerOperator).toHaveBeenCalledOnce();
    expect(auth.user.delete).not.toHaveBeenCalled();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../travelerProfileApi';
import { TravelerProfileForm } from '../TravelerProfileForm';

vi.mock('../travelerProfileApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../travelerProfileApi')>();
  return { ...actual, getTravelerProfile: vi.fn(), updateTravelerProfile: vi.fn() };
});

const profile = { userId: 7, fullName: 'Nguyễn An', email: 'an@example.com',
  phoneNumber: null, dateOfBirth: null, avatarUrl: null };

describe('TravelerProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getTravelerProfile).mockResolvedValue(profile);
  });
  afterEach(() => cleanup());

  it('renders server data and read-only email without discarded fields', async () => {
    render(<TravelerProfileForm />);
    await waitFor(() => expect(screen.getByLabelText(/Họ và tên/)).toBeDefined());
    expect((screen.getByLabelText(/Họ và tên/) as HTMLInputElement).value).toBe('Nguyễn An');
    expect((screen.getByRole('textbox', { name: /Địa chỉ Email/ }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByLabelText('Giới tính')).toBeNull();
    expect(screen.queryByLabelText('Địa chỉ cư trú')).toBeNull();
  });

  it('shows a terminal error when GET fails', async () => {
    vi.mocked(api.getTravelerProfile).mockRejectedValue(new api.TravelerProfileApiError(503, 'MSG127'));
    render(<TravelerProfileForm />);
    await waitFor(() => expect(screen.getByText('Không thể tải hồ sơ')).toBeDefined());
    expect(screen.queryByRole('button', { name: 'Lưu thay đổi' })).toBeNull();
  });

  it('shows success only after the server accepts update', async () => {
    vi.mocked(api.updateTravelerProfile).mockResolvedValue({ messageCode: 'MSG20',
      message: 'Saved', profile });
    render(<TravelerProfileForm />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(screen.getByText('Cập nhật hồ sơ thành công')).toBeDefined());
  });
});

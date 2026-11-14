import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWebSession } from '@/features/auth/session/useWebSession';
import * as tourApi from '@/features/public/tours/services/tourApi';
import { DEMO_TOUR_DETAIL_HOI_AN } from '@/features/public/tours/data/tourDemoFixtures';
import { TourBookingPage } from './TourBookingPage';

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: vi.fn(),
}));

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('TourBookingPage (UC-27 Route & Role Guards)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('demo');
    mockSearchParams.delete('scheduleId');
    mockSearchParams.delete('adults');
  });

  it('redirects unauthenticated users to sign-in with returnUrl when demo is inactive', async () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/sign-in?returnUrl=%2Ftours%2F9007199254740995%2Fbook'),
      );
    });
  });

  it('renders 403 Forbidden screen when authenticated user is a TourOperator', async () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 2,
        email: 'operator@partner.vn',
        fullName: 'Đối Tác Tour',
        role: 'TourOperator',
        status: 'Active',
        applicationStatus: 'Approved',
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByText('Tài khoản không thuộc phạm vi Đặt tour')).toBeTruthy();
      expect(screen.getAllByText(/TourOperator/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/chỉ dành riêng cho tài khoản Du khách/)).toBeTruthy();
    });
  });

  it('renders 403 Forbidden screen when authenticated user is an Administrator', async () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 99,
        email: 'admin@tripmate.vn',
        fullName: 'Admin Quản Trị',
        role: 'Administrator',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByText('Tài khoản không thuộc phạm vi Đặt tour')).toBeTruthy();
      expect(screen.getAllByText(/Administrator/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders booking form in demo mode when demo=1 is enabled in non-production', async () => {
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    mockSearchParams.set('demo', '1');

    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'traveler@tripmate.vn',
        fullName: 'Nguyễn Minh Phúc',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByText('Xác nhận đặt tour')).toBeTruthy();
      expect(
        screen.getAllByText(/Hành Trình Di Sản Phố Cổ Hội An/).length,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});


describe('assisted booking handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    for (const key of [...mockSearchParams.keys()]) mockSearchParams.delete(key);
    mockSearchParams.set('demo', '1');
    mockSearchParams.set('scheduleId', '9007199254740997');
    vi.mocked(useWebSession).mockReturnValue({ status: 'unauthenticated', context: null });
  });

  it.each([['1', '1'], ['3', '3'], ['50', '50'], ['0', '2'], ['51', '2'], ['-1', '2'], ['2.5', '2'], ['3e0', '2'], [' 3', '2'], ['3\n', '2'], ['9007199254740992', '2'], ['', '2']])('initializes adults=%s as %s in the actual form', async (value, expected) => {
    mockSearchParams.set('adults', value);
    render(<TourBookingPage id="9007199254740995" />);
    const increase = await screen.findByLabelText('Tăng 1 người lớn');
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe(expected);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });

  it('ignores duplicate adult arguments', async () => {
    mockSearchParams.append('adults', '3');
    mockSearchParams.append('adults', '4');
    render(<TourBookingPage id="9007199254740995" />);
    const increase = await screen.findByLabelText('Tăng 1 người lớn');
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe('2');
  });

  it('preserves adults, children and infants from a chatbot handoff', async () => {
    mockSearchParams.set('adults', '2');
    mockSearchParams.set('children', '1');
    mockSearchParams.set('infants', '1');
    render(<TourBookingPage id="9007199254740995" />);
    const adult = await screen.findByLabelText('Tăng 1 người lớn');
    expect(adult.parentElement?.querySelector('span')?.textContent).toBe('2');
    expect(screen.getByLabelText('Tăng 1 trẻ em').parentElement?.querySelector('span')?.textContent).toBe('1');
    expect(screen.getByLabelText('Tăng 1 em bé').parentElement?.querySelector('span')?.textContent).toBe('1');
  });

  it('preserves edits for the same handoff and applies a newly requested composition', async () => {
    mockSearchParams.set('adults', '3');
    const view = render(<TourBookingPage id="9007199254740995" />);
    const increase = await screen.findByLabelText('Tăng 1 người lớn');
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe('3');
    fireEvent.click(increase);
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe('4');
    view.rerender(<TourBookingPage id="9007199254740995" />);
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe('4');
    mockSearchParams.set('adults', '2');
    mockSearchParams.set('children', '1');
    mockSearchParams.set('infants', '0');
    view.rerender(<TourBookingPage id="9007199254740995" />);
    const newAdult = await screen.findByLabelText('Tăng 1 người lớn');
    expect(newAdult.parentElement?.querySelector('span')?.textContent).toBe('2');
    expect(screen.getByLabelText('Tăng 1 trẻ em').parentElement?.querySelector('span')?.textContent).toBe('1');
  });

  it('retains authoritative capacity checks for a bounded prefill', async () => {
    mockSearchParams.set('adults', '50');
    render(<TourBookingPage id="9007199254740995" />);
    const increase = await screen.findByLabelText('Tăng 1 người lớn');
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe('50');
    expect(increase.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Tổng số khách vượt quá số chỗ trống/)).toBeDefined();
  });
});


it('resets the booking form on new-tour navigation while preserving same-tour edits', async () => {
  setNodeEnv('development');
  process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
  mockSearchParams.set('demo', '1');
  mockSearchParams.set('adults', '2');
  vi.mocked(useWebSession).mockReturnValue({ status: 'unauthenticated', context: null });
  const detail = vi.spyOn(tourApi, 'getTourDetail').mockResolvedValueOnce(DEMO_TOUR_DETAIL_HOI_AN)
    .mockResolvedValueOnce({ ...DEMO_TOUR_DETAIL_HOI_AN, tourId: '123', title: 'Another tour' });
  try {
    const view = render(<TourBookingPage id="9007199254740995" />);
    const increase = await screen.findByLabelText('Tăng 1 người lớn');
    fireEvent.click(increase);
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe('3');
    view.rerender(<TourBookingPage id="9007199254740995" />);
    expect(increase.parentElement?.querySelector('span')?.textContent).toBe('3');
    expect(detail).toHaveBeenCalledTimes(1);
    view.rerender(<TourBookingPage id="123" />);
    await screen.findByRole('heading', { name: 'Another tour' });
    const nextIncrease = screen.getByLabelText('Tăng 1 người lớn');
    expect(nextIncrease.parentElement?.querySelector('span')?.textContent).toBe('2');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  } finally { detail.mockRestore(); }
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTourPackageView } from './CreateTourPackageView';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createTourPackage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
}));

vi.mock('./useTourCatalogues', () => ({
  useTourCatalogues: () => ({
    categories: [{ categoryId: 3, code: 'NATURE', name: 'Nature' }],
    destinations: [
      { destinationId: 1, name: 'Đà Nẵng' },
      { destinationId: 2, name: 'Quảng Nam' },
    ],
    policies: [{ id: 7, name: 'Standard scheduled departure', description: null, rules: [] }],
    pois: [{ id: 11, name: 'Bà Nà Hills', categoryName: 'Nature', address: null, averageVisitDurationMinutes: 120 }],
    loading: false,
    error: null,
  }),
}));

vi.mock('../services/operatorTourService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/operatorTourService')>()),
  createTourPackage: mocks.createTourPackage,
  // The default departure date is a fixed future date; keep this test independent of the wall clock.
  validateCreateTourPackage: () => ({}),
}));

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Tên gói tour/i), { target: { value: 'Tour thật' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Đà Nẵng' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Quảng Nam' }));
  fireEvent.change(screen.getByLabelText(/Mô tả chi tiết gói tour/i), { target: { value: 'Mô tả' } });
  fireEvent.change(screen.getByLabelText(/Chính sách hủy tour/i), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Điểm tham quan'), { target: { value: '11' } });
}

describe('CreateTourPackageView in real mode (UC-35 backend contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the selected destinations in order and the chosen policy id', async () => {
    mocks.createTourPackage.mockResolvedValue({ status: 'SUCCESS', data: { id: '42' }, isDemo: false });
    render(<CreateTourPackageView isDemo={false} />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /Lưu bản nháp/i }));

    await waitFor(() => expect(mocks.createTourPackage).toHaveBeenCalledTimes(1));
    const [payload] = mocks.createTourPackage.mock.calls[0];
    expect(payload.destinationIds).toEqual([1, 2]);
    expect(payload.destination).toBe('Đà Nẵng, Quảng Nam');
    expect(payload.cancellationPolicy).toBe('7');
    expect(payload.mediaFiles).toEqual([]);
  });

  it('reuses the idempotency key when the same payload is retried after a failure, and rotates it after an edit', async () => {
    mocks.createTourPackage.mockRejectedValue(new Error('network'));
    render(<CreateTourPackageView isDemo={false} />);
    fillValidForm();
    const save = screen.getByRole('button', { name: /Lưu bản nháp/i });

    fireEvent.click(save);
    await waitFor(() => expect(mocks.createTourPackage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect((save as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(save);
    await waitFor(() => expect(mocks.createTourPackage).toHaveBeenCalledTimes(2));
    const firstKey = mocks.createTourPackage.mock.calls[0][1].idempotencyKey;
    expect(typeof firstKey).toBe('string');
    expect(mocks.createTourPackage.mock.calls[1][1].idempotencyKey).toBe(firstKey);

    fireEvent.change(screen.getByLabelText(/Tên gói tour/i), { target: { value: 'Tour thật (đã sửa)' } });
    await waitFor(() => expect((save as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(save);
    await waitFor(() => expect(mocks.createTourPackage).toHaveBeenCalledTimes(3));
    expect(mocks.createTourPackage.mock.calls[2][1].idempotencyKey).not.toBe(firstKey);
  });
});

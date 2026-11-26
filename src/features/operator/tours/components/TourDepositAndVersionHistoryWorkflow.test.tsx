import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTourPackageView } from './CreateTourPackageView';
import { UpdateTourPackageView } from './UpdateTourPackageView';
import type { TourPackageDto } from '../types/tourLifecycle';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  createTourPackage: vi.fn(),
  updateTourPackage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

vi.mock('./useTourCatalogues', () => ({
  useTourCatalogues: () => ({
    categories: [{ categoryId: 3, code: 'NATURE', name: 'Thiên nhiên' }],
    destinations: [{ destinationId: 1, name: 'Đà Nẵng' }],
    policies: [{ id: 7, name: 'Standard policy', description: null, rules: [] }],
    pois: [{ id: 11, name: 'Bà Nà Hills', categoryName: 'Nature', address: null, averageVisitDurationMinutes: 120 }],
    loading: false,
    error: null,
  }),
}));

vi.mock('../services/operatorTourService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/operatorTourService')>()),
  createTourPackage: mocks.createTourPackage,
  updateTourPackage: mocks.updateTourPackage,
  validateCreateTourPackage: () => ({}),
  validateUpdateTourPackage: () => ({}),
}));

describe('Tour Deposit Setup, Quick Packing Tags & Version History UI Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends quick packing checklist and deposit setup from CreateTourPackageView and previews them', async () => {
    mocks.createTourPackage.mockResolvedValue({
      status: 'SUCCESS',
      data: { id: '101' },
      isDemo: false,
    });

    render(<CreateTourPackageView isDemo={false} />);

    fireEvent.change(screen.getByLabelText(/Tên gói tour/i), {
      target: { value: 'Tour Bà Nà 2N1Đ Có Cọc' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Đà Nẵng' }));
    fireEvent.change(screen.getByLabelText(/Mô tả chi tiết gói tour/i), {
      target: { value: 'Mô tả tour đầy đủ' },
    });
    fireEvent.change(screen.getByLabelText(/Chính sách hủy tour/i), {
      target: { value: '7' },
    });
    fireEvent.change(screen.getByLabelText('Điểm tham quan'), { target: { value: '11' } });
    fireEvent.change(screen.getByLabelText(/Giá người lớn/i), { target: { value: '4000000' } });

    // Enable deposit & choose 50% + 14 days
    fireEvent.click(screen.getByRole('button', { name: /Cho phép đặt cọc giữ chỗ/ }));
    fireEvent.click(screen.getByRole('button', { name: /50% · Lễ Tết/ }));
    fireEvent.click(screen.getByRole('button', { name: /14 ngày/ }));

    // Click packing quick tags
    fireEvent.click(screen.getByRole('button', { name: /Giày thể thao/ }));
    fireEvent.click(screen.getByRole('button', { name: /Áo mưa \/ Dù che nắng/ }));

    // Preview modal renders both deposit policy and packing items
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/i }));
    const previewDialog = screen.getByRole('dialog', { name: /Xem trước hiển thị trên trang Du khách/i });
    expect(within(previewDialog).getByText(/Cho phép đặt cọc 50% khi đăng ký/i)).toBeDefined();
    expect(within(previewDialog).getByText(/- Giày thể thao/)).toBeDefined();
    fireEvent.click(within(previewDialog).getAllByRole('button', { name: /Đóng xem trước/i })[0]);

    // Save draft sends exact deposit + checklist fields to backend service
    fireEvent.click(screen.getByRole('button', { name: /^Lưu bản nháp$/ }));

    await waitFor(() => expect(mocks.createTourPackage).toHaveBeenCalledTimes(1));
    expect(mocks.createTourPackage.mock.calls[0][0]).toMatchObject({
      title: 'Tour Bà Nà 2N1Đ Có Cọc',
      allowDeposit: true,
      depositPercent: 50,
      balanceDueDaysBeforeDeparture: 14,
      travellerRequirements: '- Giày thể thao\n- Áo mưa / Dù che nắng',
    });
  });

  it('clones Approved v1 into v2 with updated deposit and renders clickable Version History across v2 and archived v1', async () => {
    const v1Approved: TourPackageDto = {
      id: '101',
      tourCode: 'TP-101',
      operatorUserId: 1,
      title: 'Tour Bà Nà v1',
      destination: 'Đà Nẵng',
      destinationIds: [1],
      category: '3',
      durationDays: 2,
      basePrice: 4000000,
      maxCapacity: 20,
      description: 'Mô tả v1',
      travellerRequirements: '- Giày thể thao',
      allowDeposit: true,
      depositPercent: 30,
      balanceDueDaysBeforeDeparture: 7,
      cancellationPolicy: '7',
      status: 'Approved',
      version: 1,
      versions: [
        { tourId: '101', versionNo: 1, status: 'Approved', createdAtUtc: '2026-10-10T00:00:00Z' },
      ],
      itinerary: [
        {
          dayNo: 1,
          title: 'Ngày 1',
          activities: [{ id: 'a1', time: '08:00', poiId: 11, poiName: 'Bà Nà Hills', stayDurationMinutes: 90, transport: 'Xe du lịch' }],
        },
      ],
      schedules: [
        {
          id: 's1',
          departureDate: '2099-12-20',
          returnDate: '2099-12-21',
          totalCapacity: 20,
          reservedCapacity: 0,
          meetingPoint: 'Đà Nẵng',
          status: 'Scheduled',
        },
      ],
      media: [{ id: 'm1', url: 'https://cdn.example.test/cover.jpg', isPrimary: true }],
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    };

    mocks.updateTourPackage.mockResolvedValue({
      status: 'SUCCESS',
      data: { ...v1Approved, id: '102', version: 2, status: 'Draft', depositPercent: 50, balanceDueDaysBeforeDeparture: 14 },
      isDemo: false,
    });

    const { unmount } = render(<UpdateTourPackageView initialTour={v1Approved} isDemo={false} />);

    fireEvent.click(screen.getByRole('button', { name: /50% · Lễ Tết/ }));
    fireEvent.click(screen.getByRole('button', { name: /14 ngày/ }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu thành bản nháp mới/i }));

    await waitFor(() => expect(mocks.updateTourPackage).toHaveBeenCalledTimes(1));
    expect(mocks.updateTourPackage.mock.calls[0][0]).toMatchObject({
      allowDeposit: true,
      depositPercent: 50,
      balanceDueDaysBeforeDeparture: 14,
    });
    expect(mocks.push).toHaveBeenCalledWith('/partner/tours/102/edit');
    unmount();

    // Render v2 Approved with full version history pointing to archived v1
    const v2Approved: TourPackageDto = {
      ...v1Approved,
      id: '102',
      tourCode: 'TP-102',
      version: 2,
      status: 'Approved',
      depositPercent: 50,
      balanceDueDaysBeforeDeparture: 14,
      versions: [
        { tourId: '102', versionNo: 2, status: 'Approved', createdAtUtc: '2026-10-20T00:00:00Z' },
        { tourId: '101', versionNo: 1, status: 'Inactive', createdAtUtc: '2026-10-10T00:00:00Z' },
      ],
    };

    const v2Render = render(<UpdateTourPackageView initialTour={v2Approved} isDemo={false} />);
    expect(screen.getByText('v2 · Đã duyệt')).toBeDefined();
    const v1Link = screen.getByRole('link', { name: 'Xem lại' });
    expect(v1Link.getAttribute('href')).toBe('/partner/tours/101/edit');
    v2Render.unmount();

    // Clicking Xem lại opens v1 Inactive read-only with its original 30% / 7 days and link back to v2
    const v1Archived: TourPackageDto = {
      ...v1Approved,
      status: 'Inactive',
      versions: v2Approved.versions,
    };
    render(<UpdateTourPackageView initialTour={v1Archived} isDemo={false} />);
    expect((screen.getByLabelText(/Tỉ lệ đặt cọc/i) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/Tỉ lệ đặt cọc/i) as HTMLInputElement).value).toBe('30');
    expect(screen.getByRole('link', { name: 'Xem lại' }).getAttribute('href')).toBe('/partner/tours/102/edit');
  });
});

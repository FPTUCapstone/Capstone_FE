import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DepartureTermsFields, TourDepositFields, TourReadinessPanel, TourTermsFields } from './TourExtraFields';
import type { TourDepartureSchedule } from '../types/tourLifecycle';

const schedule: TourDepartureSchedule = {
  id: 's1',
  departureDate: '2026-11-20',
  returnDate: '2026-11-20',
  totalCapacity: 30,
  reservedCapacity: 0,
  status: 'Scheduled',
  minimumCapacity: 4,
  adultPrice: 1200000,
  childPrice: 800000,
  infantPrice: null,
  registrationDeadlineDate: '2026-11-18',
};

describe('TourReadinessPanel', () => {
  it('lists review blockers and itinerary warnings in Vietnamese, with the stop they refer to', () => {
    render(
      <TourReadinessPanel
        blockers={['primary_image_missing', 'future_departure_missing']}
        warnings={[{ code: 'outside_opening_hours', dayNo: 2, sequenceNo: 3, poiId: 11 }]}
      />,
    );

    expect(screen.getByText(/Cần có ảnh đại diện đang hoạt động/)).toBeDefined();
    expect(screen.getByText(/lịch khởi hành trong tương lai/)).toBeDefined();
    expect(screen.getByText(/Ngày 2, điểm dừng 3: .*ngoài giờ mở cửa/)).toBeDefined();
  });

  it('renders nothing when there is nothing to report', () => {
    const { container } = render(<TourReadinessPanel blockers={[]} warnings={[]} />);

    expect(container.firstChild).toBeNull();
  });
});

describe('DepartureTermsFields', () => {
  it('shows the departure terms and reports edits, mapping a cleared price to null', () => {
    const onChange = vi.fn();
    render(<DepartureTermsFields schedule={schedule} onChange={onChange} />);

    expect((screen.getByLabelText(/Số khách tối thiểu/) as HTMLInputElement).value).toBe('4');
    expect((screen.getByLabelText(/Hạn đăng ký/) as HTMLInputElement).value).toBe('2026-11-18');
    fireEvent.click(screen.getByText(/Thiết lập giá riêng cho lịch này/));
    fireEvent.change(screen.getByLabelText(/trẻ em/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/người lớn/i), { target: { value: '1500000' } });

    expect(onChange).toHaveBeenCalledWith({ childPrice: null });
    expect(onChange).toHaveBeenCalledWith({ adultPrice: 1500000 });
  });
});

describe('TourTermsFields', () => {
  it('edits highlights and traveller requirements', () => {
    const props = {
      highlights: '',
      travellerRequirements: '',
      onHighlights: vi.fn(),
      onTravellerRequirements: vi.fn(),
    };
    render(<TourTermsFields {...props} />);

    fireEvent.change(screen.getByLabelText(/Điểm nổi bật/), { target: { value: 'Cáp treo' } });
    fireEvent.change(screen.getByLabelText(/Yêu cầu đối với du khách/), { target: { value: 'Hộ chiếu' } });

    expect(props.onHighlights).toHaveBeenCalledWith('Cáp treo');
    expect(props.onTravellerRequirements).toHaveBeenCalledWith('Hộ chiếu');
  });

  it('inserts and toggles packing checklist quick tags cleanly', () => {
    const onTravellerRequirements = vi.fn();
    const { rerender } = render(
      <TourTermsFields
        highlights=""
        travellerRequirements=""
        onHighlights={vi.fn()}
        onTravellerRequirements={onTravellerRequirements}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Giày thể thao/ }));
    expect(onTravellerRequirements).toHaveBeenLastCalledWith('- Giày thể thao');

    rerender(
      <TourTermsFields
        highlights=""
        travellerRequirements="- Giày thể thao"
        onHighlights={vi.fn()}
        onTravellerRequirements={onTravellerRequirements}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Áo mưa \/ Dù che nắng/ }));
    expect(onTravellerRequirements).toHaveBeenLastCalledWith('- Giày thể thao\n- Áo mưa / Dù che nắng');

    fireEvent.click(screen.getByRole('button', { name: /Giày thể thao/ }));
    expect(onTravellerRequirements).toHaveBeenLastCalledWith('');
  });
});

describe('TourDepositFields', () => {
  it('switches between full payment and deposit with presets and preview', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TourDepositFields
        allowDeposit={false}
        depositPercent={null}
        balanceDueDaysBeforeDeparture={null}
        basePrice={5000000}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Cho phép đặt cọc giữ chỗ/ }));
    expect(onChange).toHaveBeenCalledWith({
      allowDeposit: true,
      depositPercent: 30,
      balanceDueDaysBeforeDeparture: 7,
    });

    rerender(
      <TourDepositFields
        allowDeposit={true}
        depositPercent={30}
        balanceDueDaysBeforeDeparture={7}
        basePrice={5000000}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/1\.500\.000 đ\/khách/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /50% · Lễ Tết/ }));
    expect(onChange).toHaveBeenCalledWith({ depositPercent: 50 });

    fireEvent.click(screen.getByRole('button', { name: /14 ngày/ }));
    expect(onChange).toHaveBeenCalledWith({ balanceDueDaysBeforeDeparture: 14 });
  });
});

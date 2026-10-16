import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DepartureTermsFields, TourReadinessPanel, TourTermsFields } from './TourExtraFields';
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
    fireEvent.change(screen.getByLabelText(/trẻ em/), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/người lớn/), { target: { value: '1500000' } });

    expect(onChange).toHaveBeenCalledWith({ childPrice: null });
    expect(onChange).toHaveBeenCalledWith({ adultPrice: 1500000 });
  });
});

describe('TourTermsFields', () => {
  it('edits highlights, requirements and the time zone', () => {
    const props = {
      highlights: '',
      travellerRequirements: '',
      timeZoneId: 'Asia/Ho_Chi_Minh',
      onHighlights: vi.fn(),
      onTravellerRequirements: vi.fn(),
      onTimeZoneId: vi.fn(),
    };
    render(<TourTermsFields {...props} />);

    fireEvent.change(screen.getByLabelText(/Điểm nổi bật/), { target: { value: 'Cáp treo' } });
    fireEvent.change(screen.getByLabelText(/Yêu cầu đối với du khách/), { target: { value: 'Hộ chiếu' } });
    fireEvent.change(screen.getByLabelText(/Múi giờ/), { target: { value: 'Asia/Bangkok' } });

    expect(props.onHighlights).toHaveBeenCalledWith('Cáp treo');
    expect(props.onTravellerRequirements).toHaveBeenCalledWith('Hộ chiếu');
    expect(props.onTimeZoneId).toHaveBeenCalledWith('Asia/Bangkok');
  });

  it('keeps a stored time zone that is not in the shortlist selectable', () => {
    render(
      <TourTermsFields
        highlights="" travellerRequirements="" timeZoneId="Asia/Seoul"
        onHighlights={vi.fn()} onTravellerRequirements={vi.fn()} onTimeZoneId={vi.fn()}
      />,
    );

    expect((screen.getByLabelText(/Múi giờ/) as HTMLSelectElement).value).toBe('Asia/Seoul');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateTourCompleteness,
  getOperatorTourById,
  resetDemoToursStore,
  submitTourForApproval,
  validateCreateTourPackage,
  validateUpdateTourPackage,
} from './operatorTourService';
import { OPERATOR_TOUR_MESSAGES } from '../types/tourLifecycle';
import type { CreateTourPackagePayload, TourPackageDto } from '../types/tourLifecycle';

describe('operatorTourService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T00:00:00Z'));
    resetDemoToursStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const validPayload: CreateTourPackagePayload = {
    title: 'Tour Ngũ Hành Sơn - Hội An',
    destination: 'Đà Nẵng',
    category: 'Văn hóa & Lịch sử',
    durationDays: 1,
    basePrice: 650000,
    childPrice: 450000,
    maxCapacity: 25,
    description: 'Chuyến đi khám phá vẻ đẹp danh thắng Ngũ Hành Sơn và phố cổ Hội An về đêm.',
    cancellationPolicy: 'Hoàn tiền 100% khi hủy trước ngày khởi hành 24h.',
    inclusions: 'Xe đưa đón, hướng dẫn viên, vé tham quan, bữa tối đặc sản.',
    exclusions: 'Chi phí cá nhân, đồ uống gọi thêm.',
    itinerary: [
      {
        dayNo: 1,
        title: 'Ngày 1: Ngũ Hành Sơn & Hội An',
        activities: [
          {
            id: 'act-1',
            time: '14:30',
            poiName: 'Ngũ Hành Sơn',
            stayDurationMinutes: 120,
            transport: 'Xe du lịch',
          },
          {
            id: 'act-2',
            time: '17:30',
            poiName: 'Phố cổ Hội An',
            stayDurationMinutes: 180,
            transport: 'Xe du lịch',
          },
        ],
      },
    ],
    schedules: [
      {
        id: 'sch-1',
        departureDate: '2026-11-20',
        returnDate: '2026-11-20',
        totalCapacity: 25,
        reservedCapacity: 0,
        meetingPoint: 'Khách sạn trung tâm Đà Nẵng',
        status: 'Scheduled',
      },
    ],
  };

  describe('validateCreateTourPackage (BR-101, BR-22, BR-79, BR-16)', () => {
    it('flags missing required fields per BR-101', () => {
      const emptyPayload: CreateTourPackagePayload = {
        title: '',
        destination: '',
        durationDays: 0,
        basePrice: 0,
        maxCapacity: 0,
        description: '',
        cancellationPolicy: '',
        itinerary: [],
        schedules: [],
      };

      const errors = validateCreateTourPackage(emptyPayload);
      expect(errors.title).toBe(OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD);
      expect(errors.destination).toBe(OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD);
      expect(errors.description).toBe(OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD);
      expect(errors.cancellationPolicy).toBe(OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD);
      expect(errors.durationDays).toBe(OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC);
      expect(errors.basePrice).toBe(OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC);
      expect(errors.maxCapacity).toBe(OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC);
      expect(errors.itinerary).toContain('ít nhất 1 ngày lịch trình');
      expect(errors.schedules).toContain('ít nhất 1 lịch khởi hành');
    });

    it('flags itinerary without any activities per BR-101', () => {
      const payload: CreateTourPackagePayload = {
        ...validPayload,
        itinerary: [{ dayNo: 1, title: 'Ngày 1', activities: [] }],
      };
      const errors = validateCreateTourPackage(payload);
      expect(errors.itinerary).toContain('ít nhất 1 điểm dừng');
    });

    it('flags departure dates in past or invalid return per BR-22', () => {
      const payload: CreateTourPackagePayload = {
        ...validPayload,
        schedules: [
          {
            id: 'sch-past',
            departureDate: '2020-01-01',
            returnDate: '2020-01-02',
            totalCapacity: 20,
            reservedCapacity: 0,
            meetingPoint: 'Đà Nẵng',
            status: 'Scheduled',
          },
        ],
      };
      const errors = validateCreateTourPackage(payload);
      expect(errors.schedules).toBe(OPERATOR_TOUR_MESSAGES.INVALID_SCHEDULE_DATE);
    });

    it('flags return date preceding departure date per BR-22', () => {
      const payload: CreateTourPackagePayload = {
        ...validPayload,
        schedules: [
          {
            id: 'sch-invalid-range',
            departureDate: '2026-11-20',
            returnDate: '2026-11-15',
            totalCapacity: 20,
            reservedCapacity: 0,
            meetingPoint: 'Đà Nẵng',
            status: 'Scheduled',
          },
        ],
      };
      const errors = validateCreateTourPackage(payload);
      expect(errors.schedules).toBe(OPERATOR_TOUR_MESSAGES.INVALID_SCHEDULE_DATE);
    });

    it('passes completely with valid payload', () => {
      const errors = validateCreateTourPackage(validPayload);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('rejects an itinerary stop that starts before the previous stop has ended', () => {
      const payload: CreateTourPackagePayload = {
        ...validPayload,
        itinerary: [{
          ...validPayload.itinerary[0],
          activities: [
            { ...validPayload.itinerary[0].activities[0], time: '08:00', stayDurationMinutes: 30 },
            { ...validPayload.itinerary[0].activities[1], time: '08:15' },
          ],
        }],
      };

      expect(validateCreateTourPackage(payload).itinerary).toContain('Hãy chọn giờ từ 08:30 trở đi');
    });
  });

  describe('validateUpdateTourPackage (BR-61)', () => {
    const existingTour: TourPackageDto = {
      id: 'tour-test-1',
      tourCode: 'TP-0142',
      operatorUserId: 101,
      title: 'Tour Ba Na Hills',
      destination: 'Đà Nẵng',
      category: 'Di sản & Thiên nhiên',
      durationDays: 1,
      basePrice: 1250000,
      maxCapacity: 30,
      description: 'Tour Bà Nà',
      cancellationPolicy: 'Hủy trước 24h',
      status: 'Approved',
      version: 1,
      itinerary: validPayload.itinerary,
      schedules: [
        {
          id: 'sch-1',
          departureDate: '2026-11-20',
          returnDate: '2026-11-20',
          totalCapacity: 30,
          reservedCapacity: 15, // 15 slots sold!
          meetingPoint: 'Đà Nẵng',
          status: 'Scheduled',
        },
      ],
      media: [],
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    };

    it('rejects capacity lower than reserved capacity (BR-61)', () => {
      const updatePayload = {
        ...validPayload,
        id: 'tour-test-1',
        schedules: [
          {
            id: 'sch-1',
            departureDate: '2026-11-20',
            returnDate: '2026-11-20',
            totalCapacity: 10, // Attempting to lower to 10 when 15 are sold!
            reservedCapacity: 15,
            meetingPoint: 'Đà Nẵng',
            status: 'Scheduled' as const,
          },
        ],
      };

      const errors = validateUpdateTourPackage(updatePayload, existingTour);
      expect(errors.schedules).toBe(OPERATOR_TOUR_MESSAGES.CAPACITY_BELOW_SOLD);
    });

    it('allows capacity equal to or greater than reserved capacity (BR-61)', () => {
      const updatePayload = {
        ...validPayload,
        id: 'tour-test-1',
        schedules: [
          {
            id: 'sch-1',
            departureDate: '2026-11-20',
            returnDate: '2026-11-20',
            totalCapacity: 15, // Exactly equal to sold
            reservedCapacity: 15,
            meetingPoint: 'Đà Nẵng',
            status: 'Scheduled' as const,
          },
        ],
      };

      const errors = validateUpdateTourPackage(updatePayload, existingTour);
      expect(errors.schedules).toBeUndefined();
    });

    // TM-82 §9 AC 8 / backend spec §0/§6: a schedule carried over unchanged from an
    // already-past departure is never re-validated against BR-22, even though its date is in
    // the past — it is neither new nor a future schedule being edited. Fixed after E2E found
    // the Web validator still blocked this (2026-11-26 Codex E2E report, items 2.2/8).
    const tourWithPastAndFutureSchedule: TourPackageDto = {
      ...existingTour,
      schedules: [
        {
          id: 'sch-past',
          departureDate: '2026-09-01', // before the 2026-10-15 fake system time
          returnDate: '2026-09-01',
          totalCapacity: 16,
          reservedCapacity: 3,
          status: 'Completed',
        },
        {
          id: 'sch-future',
          departureDate: '2026-12-16',
          returnDate: '2026-12-16',
          totalCapacity: 20,
          reservedCapacity: 2,
          status: 'Scheduled',
        },
      ],
    };

    it('does not re-validate BR-22 against a past-departure schedule carried over unchanged', () => {
      const updatePayload = {
        ...validPayload,
        id: 'tour-test-1',
        schedules: [
          // Past schedule, carried over with its original id and dates — must not trip BR-22.
          { id: 'sch-past', departureDate: '2026-09-01', returnDate: '2026-09-01', totalCapacity: 16, reservedCapacity: 3, status: 'Completed' as const },
          // Future schedule, edited.
          { id: 'sch-future', departureDate: '2026-12-16', returnDate: '2026-12-16', totalCapacity: 23, reservedCapacity: 2, status: 'Scheduled' as const },
        ],
      };

      const errors = validateUpdateTourPackage(updatePayload, tourWithPastAndFutureSchedule);
      expect(errors.schedules).toBeUndefined();
    });

    it('still rejects a genuinely new schedule dated in the past (BR-22 applies to new schedules)', () => {
      const updatePayload = {
        ...validPayload,
        id: 'tour-test-1',
        schedules: [
          { id: 'sch-past', departureDate: '2026-09-01', returnDate: '2026-09-01', totalCapacity: 16, reservedCapacity: 3, status: 'Completed' as const },
          { id: 'sch-future', departureDate: '2026-12-16', returnDate: '2026-12-16', totalCapacity: 20, reservedCapacity: 2, status: 'Scheduled' as const },
          // A brand-new schedule row (no matching id in currentTour) dated in the past.
          { id: 'sch-user-1', departureDate: '2026-09-02', returnDate: '2026-09-02', totalCapacity: 10, reservedCapacity: 0, status: 'Scheduled' as const },
        ],
      };

      const errors = validateUpdateTourPackage(updatePayload, tourWithPastAndFutureSchedule);
      expect(errors.schedules).toBe(OPERATOR_TOUR_MESSAGES.INVALID_SCHEDULE_DATE);
    });

    it('still rejects an existing future schedule edited into the past (BR-22 applies to edited future schedules)', () => {
      const updatePayload = {
        ...validPayload,
        id: 'tour-test-1',
        schedules: [
          { id: 'sch-past', departureDate: '2026-09-01', returnDate: '2026-09-01', totalCapacity: 16, reservedCapacity: 3, status: 'Completed' as const },
          // sch-future existed as a future schedule; editing its date into the past must still fail.
          { id: 'sch-future', departureDate: '2026-09-03', returnDate: '2026-09-03', totalCapacity: 20, reservedCapacity: 2, status: 'Scheduled' as const },
        ],
      };

      const errors = validateUpdateTourPackage(updatePayload, tourWithPastAndFutureSchedule);
      expect(errors.schedules).toBe(OPERATOR_TOUR_MESSAGES.INVALID_SCHEDULE_DATE);
    });
  });

  describe('evaluateTourCompleteness (UC-37 Screen #43)', () => {
    it('evaluates completeness checklist and blocks submission if incomplete', () => {
      const incompleteTour: TourPackageDto = {
        id: 'tour-incomplete',
        tourCode: 'TP-INC',
        operatorUserId: 101,
        title: '',
        destination: '',
        category: 'Di sản & Thiên nhiên',
        durationDays: 0,
        basePrice: 0,
        maxCapacity: 0,
        description: '',
        cancellationPolicy: '',
        status: 'Draft',
        version: 1,
        itinerary: [],
        schedules: [],
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const result = evaluateTourCompleteness(incompleteTour);
      expect(result.isEligibleForSubmission).toBe(false);
      expect(result.missingCount).toBeGreaterThan(0);
    });

    it('approves complete tour for submission', () => {
      const completeTour: TourPackageDto = {
        id: 'tour-complete',
        tourCode: 'TP-OK',
        operatorUserId: 101,
        title: validPayload.title,
        destination: validPayload.destination,
        category: 'Di sản & Thiên nhiên',
        durationDays: validPayload.durationDays,
        basePrice: validPayload.basePrice,
        maxCapacity: validPayload.maxCapacity,
        description: validPayload.description,
        cancellationPolicy: validPayload.cancellationPolicy,
        status: 'Draft',
        version: 1,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [{ id: 'm1', url: 'https://example.com/img.jpg', isPrimary: true }],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const result = evaluateTourCompleteness(completeTour);
      expect(result.isEligibleForSubmission).toBe(true);
      expect(result.missingCount).toBe(0);
    });
  });

  describe('Real API guardrails', () => {
    it('rejects a non-numeric server tour identifier before issuing a request', async () => {
      await expect(getOperatorTourById('tour-test-1', { allowDemo: false }))
        .rejects.toThrow('Mã gói tour phải là mã số hợp lệ');
    });
  });

  describe('BR-104 Submission Allow-List (UC-37)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      resetDemoToursStore();
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
    });

    const makeTour = (status: TourPackageDto['status']): TourPackageDto => ({
      id: `tour-${status.toLowerCase()}`,
      tourCode: `TP-${status.toUpperCase()}`,
      operatorUserId: 101,
      title: validPayload.title,
      destination: validPayload.destination,
      category: 'Di sản & Thiên nhiên',
      durationDays: validPayload.durationDays,
      basePrice: validPayload.basePrice,
      maxCapacity: validPayload.maxCapacity,
      description: validPayload.description,
      cancellationPolicy: validPayload.cancellationPolicy,
      status,
      version: 1,
      itinerary: validPayload.itinerary,
      schedules: validPayload.schedules,
      media: [],
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    });

    it('allows Draft tour to be submitted', async () => {
      const draft = makeTour('Draft');
      const res = await submitTourForApproval(draft.id, {
        allowDemo: true,
        currentTour: draft,
      });
      expect(res.status).toBe('SUCCESS');
      expect(res.data?.status).toBe('Pending');
    });

    it('allows Rejected tour to be submitted', async () => {
      const rejected = makeTour('Rejected');
      const res = await submitTourForApproval(rejected.id, {
        allowDemo: true,
        currentTour: rejected,
      });
      expect(res.status).toBe('SUCCESS');
      expect(res.data?.status).toBe('Pending');
    });

    it('blocks Pending tour with MSG122', async () => {
      const pending = makeTour('Pending');
      const res = await submitTourForApproval(pending.id, {
        allowDemo: true,
        currentTour: pending,
      });
      expect(res.status).toBe('ERROR');
      expect(res.message).toContain('chờ duyệt');
    });

    it('blocks Approved tour with MSG110', async () => {
      const approved = makeTour('Approved');
      const res = await submitTourForApproval(approved.id, {
        allowDemo: true,
        currentTour: approved,
      });
      expect(res.status).toBe('ERROR');
      expect(res.message).toContain('phiên bản nháp mới');
    });

    it('blocks Inactive tour with BR-104 allow-list error', async () => {
      const inactive = makeTour('Inactive');
      const res = await submitTourForApproval(inactive.id, {
        allowDemo: true,
        currentTour: inactive,
      });
      expect(res.status).toBe('ERROR');
      expect(res.message).toContain('Bản nháp hoặc Bị từ chối');
    });

    it('blocks Inactive tour BEFORE completeness evaluation even when fully complete', async () => {
      const fullyCompleteInactive: TourPackageDto = {
        ...makeTour('Inactive'),
        media: [{ id: 'm1', url: 'https://example.com/photo.jpg', isPrimary: true }],
      };

      // Completeness check returns true
      const completeness = evaluateTourCompleteness(fullyCompleteInactive);
      expect(completeness.isEligibleForSubmission).toBe(true);

      // But submission is strictly blocked by BR-104 status allow-list
      const res = await submitTourForApproval(fullyCompleteInactive.id, {
        allowDemo: true,
        currentTour: fullyCompleteInactive,
      });
      expect(res.status).toBe('ERROR');
      expect(res.message).toContain('Bản nháp hoặc Bị từ chối');
    });
  });

  describe('Deterministic Tour Lookup with Multiple Versions', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      resetDemoToursStore();
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
    });

    it('returns exact requested record by unique record ID', async () => {
      // Initial Banahills is tour-142 (v2, Approved)
      const res = await getOperatorTourById('tour-142', { allowDemo: true });
      expect(res.status).toBe('SUCCESS');
      expect(res.data?.id).toBe('tour-142');
      expect(res.data?.version).toBe(2);
      expect(res.data?.status).toBe('Approved');
    });
  });
});

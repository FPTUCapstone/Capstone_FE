import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTourPackage,
  evaluateTourCompleteness,
  getOperatorTourById,
  getOperatorTours,
  OperatorTourValidationError,
  resetDemoToursStore,
  submitTourForApproval,
  updateTourPackage,
  validateCreateTourPackage,
  validateUpdateTourPackage,
} from './operatorTourService';
import { OPERATOR_TOUR_MESSAGES } from '../types/tourLifecycle';
import type { CreateTourPackagePayload, TourPackageDto } from '../types/tourLifecycle';

describe('operatorTourService', () => {
  beforeEach(() => {
    resetDemoToursStore();
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

  describe('Real Mode Truthfulness (NO_BACKEND)', () => {
    it('getOperatorTours returns PENDING_BE_INTEGRATION in real mode', async () => {
      const res = await getOperatorTours({ allowDemo: false });
      expect(res.status).toBe('PENDING_BE_INTEGRATION');
      expect(res.data).toEqual([]);
      expect(res.isDemo).toBe(false);
    });

    it('getOperatorTourById returns PENDING_BE_INTEGRATION in real mode', async () => {
      const res = await getOperatorTourById('tour-test-1', { allowDemo: false });
      expect(res.status).toBe('PENDING_BE_INTEGRATION');
      expect(res.data).toBeUndefined();
      expect(res.isDemo).toBe(false);
    });

    it('createTourPackage returns PENDING_BE_INTEGRATION in real mode without fake persistence', async () => {
      const res = await createTourPackage(validPayload, { allowDemo: false });
      expect(res.status).toBe('PENDING_BE_INTEGRATION');
      expect(res.data).toBeUndefined();
      expect(res.isDemo).toBe(false);
    });

    it('updateTourPackage returns PENDING_BE_INTEGRATION in real mode', async () => {
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
        status: 'Draft',
        version: 1,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const res = await updateTourPackage(
        { ...validPayload, id: 'tour-test-1' },
        { allowDemo: false, currentTour: existingTour }
      );
      expect(res.status).toBe('PENDING_BE_INTEGRATION');
      expect(res.isDemo).toBe(false);
    });

    it('submitTourForApproval returns PENDING_BE_INTEGRATION in real mode', async () => {
      const existingTour: TourPackageDto = {
        id: 'tour-test-1',
        tourCode: 'TP-0142',
        operatorUserId: 101,
        title: validPayload.title,
        destination: validPayload.destination,
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1250000,
        maxCapacity: 30,
        description: validPayload.description,
        cancellationPolicy: validPayload.cancellationPolicy,
        status: 'Draft',
        version: 1,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const res = await submitTourForApproval('tour-test-1', {
        allowDemo: false,
        currentTour: existingTour,
      });
      expect(res.status).toBe('PENDING_BE_INTEGRATION');
      expect(res.isDemo).toBe(false);
    });
  });
});

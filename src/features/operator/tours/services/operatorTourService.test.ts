import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTourPackage,
  evaluateTourCompleteness,
  getOperatorTourById,
  getOperatorTours,
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

  describe('BR-103 Version Preservation on Approved Edit (UC-36)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      resetDemoToursStore();
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
    });

    it('A. returns error and leaves original unchanged when editing Approved with createNewVersion=false', async () => {
      const approvedTour: TourPackageDto = {
        id: 'tour-approved-1',
        tourCode: 'TP-APP1',
        operatorUserId: 101,
        title: 'Original Approved Tour',
        destination: 'Đà Nẵng',
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1000000,
        maxCapacity: 20,
        description: 'Original Description',
        cancellationPolicy: 'Hủy trước 24h',
        status: 'Approved',
        version: 2,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const res = await updateTourPackage(
        { ...validPayload, title: 'Updated Title', id: 'tour-approved-1' },
        { allowDemo: true, currentTour: approvedTour, createNewVersion: false }
      );

      expect(res.status).toBe('ERROR');
      expect(res.message).toBe(OPERATOR_TOUR_MESSAGES.APPROVED_DIRECT_EDIT);
    });

    it('B-H. creates a distinct Draft vN+1 with new ID without replacing or mutating original Approved version', async () => {
      const approvedTour: TourPackageDto = {
        id: 'tour-approved-1',
        tourCode: 'TP-APP1',
        operatorUserId: 101,
        title: 'Original Approved Tour',
        destination: 'Đà Nẵng',
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1000000,
        maxCapacity: 20,
        description: 'Original Description',
        cancellationPolicy: 'Hủy trước 24h',
        status: 'Approved',
        version: 2,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      // Put approvedTour into store
      const listBefore = await getOperatorTours({ allowDemo: true });
      expect(listBefore.status).toBe('SUCCESS');

      const res = await updateTourPackage(
        { ...validPayload, title: 'Brand New Itinerary Title', id: 'tour-approved-1' },
        { allowDemo: true, currentTour: approvedTour, createNewVersion: true }
      );

      expect(res.status).toBe('SUCCESS');
      const draft = res.data!;

      // C. New Draft has different ID
      expect(draft.id).not.toBe('tour-approved-1');
      expect(draft.id).toContain('draft');

      // G. Draft version is N+1
      expect(draft.version).toBe(3);
      expect(draft.status).toBe('Draft');

      // Preserves logical tour code identity
      expect(draft.tourCode).toBe('TP-APP1');
      expect(draft.title).toBe('Brand New Itinerary Title');

      // D, E, F. Original Approved tour remains in store, unchanged status and version
      const origLookup = await getOperatorTourById('tour-approved-1', { allowDemo: true });
      expect(origLookup).toBeDefined();
      expect(approvedTour.status).toBe('Approved');
      expect(approvedTour.version).toBe(2);
      expect(approvedTour.title).toBe('Original Approved Tour');

      // Check draft lookup
      const draftLookup = await getOperatorTourById(draft.id, { allowDemo: true });
      expect(draftLookup.status).toBe('SUCCESS');
      expect(draftLookup.data?.version).toBe(3);
      expect(draftLookup.data?.status).toBe('Draft');
    });

    it('I-J. submitting Draft vN+1 transitions Draft to Pending while Approved remains Approved', async () => {
      // Create initial approved tour in store
      const approvedTour: TourPackageDto = {
        id: 'tour-bana-app',
        tourCode: 'TP-BANA',
        operatorUserId: 101,
        title: 'Ba Na Hills Approved',
        destination: 'Đà Nẵng',
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1000000,
        maxCapacity: 20,
        description: 'Mô tả',
        cancellationPolicy: 'Chính sách',
        status: 'Approved',
        version: 2,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      // Update approved tour creating new version
      const updateRes = await updateTourPackage(
        { ...validPayload, title: 'Ba Na Hills Revision', id: 'tour-bana-app' },
        { allowDemo: true, currentTour: approvedTour, createNewVersion: true }
      );
      const draftTour = updateRes.data!;

      // I. Submit the new draft version
      const submitRes = await submitTourForApproval(draftTour.id, {
        allowDemo: true,
        currentTour: draftTour,
      });

      expect(submitRes.status).toBe('SUCCESS');
      expect(submitRes.data?.status).toBe('Pending');
      expect(submitRes.data?.version).toBe(3);

      // J. Approved version remains Approved
      expect(approvedTour.status).toBe('Approved');
      expect(approvedTour.version).toBe(2);
    });

    it('K. direct editing Pending tour remains blocked', async () => {
      const pendingTour: TourPackageDto = {
        id: 'tour-pending-1',
        tourCode: 'TP-PEND',
        operatorUserId: 101,
        title: 'Pending Tour',
        destination: 'Đà Nẵng',
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1000000,
        maxCapacity: 20,
        description: 'Mô tả',
        cancellationPolicy: 'Chính sách',
        status: 'Pending',
        version: 1,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const res = await updateTourPackage(
        { ...validPayload, id: 'tour-pending-1' },
        { allowDemo: true, currentTour: pendingTour }
      );

      expect(res.status).toBe('ERROR');
      expect(res.message).toBe(OPERATOR_TOUR_MESSAGES.PENDING_READ_ONLY);
    });

    it('L. editing Draft keeps the same ID and updates in place', async () => {
      const draftTour: TourPackageDto = {
        id: 'tour-draft-1',
        tourCode: 'TP-DRF1',
        operatorUserId: 101,
        title: 'Old Draft Title',
        destination: 'Đà Nẵng',
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1000000,
        maxCapacity: 20,
        description: 'Mô tả',
        cancellationPolicy: 'Chính sách',
        status: 'Draft',
        version: 1,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const res = await updateTourPackage(
        { ...validPayload, title: 'New Draft Title', id: 'tour-draft-1' },
        { allowDemo: true, currentTour: draftTour }
      );

      expect(res.status).toBe('SUCCESS');
      expect(res.data?.id).toBe('tour-draft-1');
      expect(res.data?.version).toBe(1);
      expect(res.data?.title).toBe('New Draft Title');
      expect(res.data?.status).toBe('Draft');
    });

    it('M. editing Rejected tour keeps canonical semantics and same ID', async () => {
      const rejectedTour: TourPackageDto = {
        id: 'tour-rej-1',
        tourCode: 'TP-REJ1',
        operatorUserId: 101,
        title: 'Rejected Tour',
        destination: 'Đà Nẵng',
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1000000,
        maxCapacity: 20,
        description: 'Mô tả',
        cancellationPolicy: 'Chính sách',
        status: 'Rejected',
        version: 1,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      const res = await updateTourPackage(
        { ...validPayload, title: 'Remediated Tour Title', id: 'tour-rej-1' },
        { allowDemo: true, currentTour: rejectedTour }
      );

      expect(res.status).toBe('SUCCESS');
      expect(res.data?.id).toBe('tour-rej-1');
      expect(res.data?.version).toBe(1);
      expect(res.data?.title).toBe('Remediated Tour Title');
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
      expect(res.message).toContain('MSG122');
    });

    it('blocks Approved tour with MSG110', async () => {
      const approved = makeTour('Approved');
      const res = await submitTourForApproval(approved.id, {
        allowDemo: true,
        currentTour: approved,
      });
      expect(res.status).toBe('ERROR');
      expect(res.message).toContain('MSG110');
    });

    it('blocks Inactive tour with BR-104 allow-list error', async () => {
      const inactive = makeTour('Inactive');
      const res = await submitTourForApproval(inactive.id, {
        allowDemo: true,
        currentTour: inactive,
      });
      expect(res.status).toBe('ERROR');
      expect(res.message).toContain('BR-104');
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
      expect(res.message).toContain('BR-104');
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

    it('returns latest version when looking up by tourCode with multiple versions in store', async () => {
      const approvedTour: TourPackageDto = {
        id: 'tour-multi-v1',
        tourCode: 'TP-MULTI',
        operatorUserId: 101,
        title: 'Multi Version Tour v1',
        destination: 'Đà Nẵng',
        category: 'Di sản & Thiên nhiên',
        durationDays: 1,
        basePrice: 1000000,
        maxCapacity: 20,
        description: 'Mô tả',
        cancellationPolicy: 'Chính sách',
        status: 'Approved',
        version: 1,
        itinerary: validPayload.itinerary,
        schedules: validPayload.schedules,
        media: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      };

      // Create v2 draft
      const updateRes = await updateTourPackage(
        { ...validPayload, title: 'Multi Version Tour v2', id: 'tour-multi-v1' },
        { allowDemo: true, currentTour: approvedTour, createNewVersion: true }
      );
      const draftV2 = updateRes.data!;

      // Lookup by ID returns exact version
      const v2ById = await getOperatorTourById(draftV2.id, { allowDemo: true });
      expect(v2ById.data?.version).toBe(2);

      // Lookup by tourCode returns latest version (v2)
      const byCode = await getOperatorTourById('TP-MULTI', { allowDemo: true });
      expect(byCode.status).toBe('SUCCESS');
      expect(byCode.data?.version).toBe(2);
    });
  });
});

'use client';

import { formatDisplayDate } from '@/lib/displayDate';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { CancellationPolicySelect, CategorySelect, DestinationCheckboxes, PoiSelect, TransportSelect } from './TourCataloguePickers';
import { DepartureTermsFields, TourReadinessPanel, TourTermsFields } from './TourExtraFields';
import { TourMediaManager } from './TourMediaManager';
import { useTourCatalogues } from './useTourCatalogues';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import {
  createOrResumeDraftVersion,
  discardDraftVersion,
  OperatorTourValidationError,
  saveDraftVersion,
  submitDraftVersion,
  updateTourPackage,
  validateUpdateTourPackage,
} from '../services/operatorTourService';
import {
  OPERATOR_TOUR_MESSAGES,
  type TourDepartureSchedule,
  type TourItineraryActivity,
  type TourItineraryDay,
  type TourMediaItem,
  type TourPackageDto,
  type TourValidationErrors,
  type UpdateTourPackagePayload,
} from '../types/tourLifecycle';

interface UpdateTourPackageViewProps {
  initialTour: TourPackageDto;
  isDemo?: boolean;
}

const START_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4).toString().padStart(2, '0');
  const minutes = ((index % 4) * 15).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

function normalizeItineraryDays(days: TourItineraryDay[], durationDays: number): TourItineraryDay[] {
  if (days.length >= durationDays) return days.slice(0, durationDays);
  return [...days, ...Array.from({ length: durationDays - days.length }, (_, index) => {
    const dayNo = days.length + index + 1;
    return { dayNo, title: `Ngày ${dayNo}: Tiếp tục hành trình`, activities: [] };
  })];
}

export function UpdateTourPackageView({ initialTour, isDemo = false }: UpdateTourPackageViewProps) {
  const router = useRouter();
  // A published tour is edited through a draft version (TM-82 / UC-36); demo mode is not offered
  // for this path (spec TM-82 §1.5) — the draft-version API is always real.
  const isApproved = initialTour.status === 'Approved' || initialTour.status === 'Published';
  const [draft, setDraft] = useState<TourPackageDto | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(isApproved);
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null);
  // The record actually being edited: the draft version for an Approved/Published tour, the live
  // tour itself for Draft/Rejected (unaffected UC-35 direct-edit path).
  const editTarget = isApproved ? draft : initialTour;
  const isPending = editTarget?.status === 'Pending' || editTarget?.status === 'PendingReview';
  const catalogues = useTourCatalogues(isDemo);
  const [destinationIds, setDestinationIds] = useState<number[]>(editTarget?.destinationIds ?? []);
  const [highlights, setHighlights] = useState(editTarget?.highlights ?? '');
  const [travellerRequirements, setTravellerRequirements] = useState(editTarget?.travellerRequirements ?? '');
  const [timeZoneId] = useState(editTarget?.timeZoneId ?? 'Asia/Ho_Chi_Minh');
  const [media, setMedia] = useState<TourMediaItem[]>(initialTour.media ?? []);

  // Form State initialized from editTarget
  const [title, setTitle] = useState(editTarget?.title ?? '');
  const [destination, setDestination] = useState(editTarget?.destination ?? '');
  const [category, setCategory] = useState(editTarget?.category || 'Di sản & Thiên nhiên');
  const [durationDays, setDurationDays] = useState(editTarget?.durationDays ?? 1);
  const [basePrice, setBasePrice] = useState(editTarget?.basePrice ?? 0);
  const [childPrice, setChildPrice] = useState(editTarget?.childPrice);
  const [maxCapacity, setMaxCapacity] = useState(editTarget?.maxCapacity ?? 0);
  const [description, setDescription] = useState(editTarget?.description ?? '');
  const [inclusions, setInclusions] = useState(editTarget?.inclusions || '');
  const [exclusions, setExclusions] = useState(editTarget?.exclusions || '');
  const [cancellationPolicy, setCancellationPolicy] = useState(editTarget?.cancellationPolicy ?? '');

  // Itinerary & Schedules
  const [itinerary, setItinerary] = useState<TourItineraryDay[]>(() =>
    normalizeItineraryDays(JSON.parse(JSON.stringify(editTarget?.itinerary || [])), editTarget?.durationDays ?? 1),
  );
  const [schedules, setSchedules] = useState<TourDepartureSchedule[]>(
    JSON.parse(JSON.stringify(editTarget?.schedules || []))
  );

  // Total confirmed bookings calculation
  const totalSoldSlots = schedules.reduce((acc, s) => acc + (s.reservedCapacity || 0), 0);

  // UI & Validation states
  const [errors, setErrors] = useState<TourValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedActivity, setDraggedActivity] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const validationToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activitySequence = useRef(0);

  useEffect(() => () => {
    if (validationToastTimer.current) clearTimeout(validationToastTimer.current);
  }, []);

  // Create-or-resume the draft version on mount for an Approved/Published tour (spec TM-82 §5.1,
  // edge cases 1-2). Seeds every form field from the draft's proposed values once it resolves.
  // `loadingDraft`'s initial value already covers the first run; this effect only needs to flip
  // it back to true if `initialTour.id` ever changes while mounted (a re-fetch, not the mount).
  useEffect(() => {
    if (!isApproved) return;
    let cancelled = false;
    createOrResumeDraftVersion(initialTour.id, initialTour)
      .then((loaded) => {
        if (cancelled) return;
        setDraft(loaded);
        setDestinationIds(loaded.destinationIds ?? []);
        setHighlights(loaded.highlights ?? '');
        setTravellerRequirements(loaded.travellerRequirements ?? '');
        setTitle(loaded.title);
        setDestination(loaded.destination);
        setCategory(loaded.category || 'Di sản & Thiên nhiên');
        setDurationDays(loaded.durationDays);
        setBasePrice(loaded.basePrice);
        setChildPrice(loaded.childPrice);
        setMaxCapacity(loaded.maxCapacity);
        setDescription(loaded.description);
        setInclusions(loaded.inclusions || '');
        setExclusions(loaded.exclusions || '');
        setCancellationPolicy(loaded.cancellationPolicy);
        setItinerary(normalizeItineraryDays(JSON.parse(JSON.stringify(loaded.itinerary || [])), loaded.durationDays));
        setSchedules(JSON.parse(JSON.stringify(loaded.schedules || [])));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDraftLoadError(err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      })
      .finally(() => {
        if (!cancelled) setLoadingDraft(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialTour.id identifies the tour; re-running on every initialTour identity change would re-fetch needlessly.
  }, [initialTour.id, isApproved]);

  const showValidationToast = (message: string) => {
    setValidationToast(message);
    if (validationToastTimer.current) clearTimeout(validationToastTimer.current);
    validationToastTimer.current = setTimeout(() => {
      setValidationToast(null);
      validationToastTimer.current = null;
    }, 4500);
  };

  // Handlers for Itinerary
  const handleAddActivity = (dayIndex: number) => {
    if (isPending) return;
    const updated = itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
    if (!updated[dayIndex]) {
      updated.push({ dayNo: 1, title: 'Ngày 1: Khám phá điểm đến', activities: [] });
      dayIndex = updated.length - 1;
    }
    const newAct: TourItineraryActivity = {
      id: `new-activity-${++activitySequence.current}`,
      time: '16:00',
      poiName: 'Điểm tham quan mới',
      stayDurationMinutes: 45,
      transport: 'Đi bộ',
    };
    updated[dayIndex].activities.push(newAct);
    setItinerary(updated);
  };

  const handleDurationChange = (nextValue: number) => {
    const nextDuration = Math.max(1, nextValue || 1);
    setDurationDays(nextDuration);
    setItinerary((current) => normalizeItineraryDays(current, nextDuration));
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    if (isPending) return;
    const updated = itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
    if (!updated[dayIndex]?.activities[actIndex]) return;
    updated[dayIndex].activities.splice(actIndex, 1);
    setItinerary(updated);
  };

  const moveActivity = (fromDayIndex: number, fromIndex: number, toDayIndex: number, toIndex: number) => {
    if (isPending || (fromDayIndex === toDayIndex && fromIndex === toIndex)) return;
    const updated = itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
    if (!updated[fromDayIndex]?.activities[fromIndex] || !updated[toDayIndex]) return;
    const [activity] = updated[fromDayIndex].activities.splice(fromIndex, 1);
    if (toIndex < 0 || toIndex >= updated[toDayIndex].activities.length) {
      updated[toDayIndex].activities.push(activity);
    } else {
      updated[toDayIndex].activities.splice(toIndex, 0, activity);
    }
    setItinerary(updated);
  };

  function buildPayload(): UpdateTourPackagePayload {
    const selectedDestinationNames = catalogues.destinations
      .filter((option) => destinationIds.includes(option.destinationId))
      .map((option) => option.name);
    return {
      id: initialTour.id,
      title,
      destination: isDemo ? destination : selectedDestinationNames.join(', ') || destination,
      destinationIds: isDemo ? undefined : destinationIds,
      category,
      durationDays,
      basePrice,
      childPrice,
      maxCapacity,
      description,
      inclusions,
      exclusions,
      highlights: isDemo ? undefined : highlights,
      travellerRequirements: isDemo ? undefined : travellerRequirements,
      timeZoneId: isDemo ? undefined : timeZoneId,
      cancellationPolicy,
      itinerary,
      schedules,
    };
  }

  /** UC-35 direct-edit save, for a Draft/Rejected tour. Unaffected by TM-82. */
  const handleSaveDirectEdit = async () => {
    const payload = buildPayload();
    const validationErrors = validateUpdateTourPackage(payload, initialTour);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showValidationToast('Không thể lưu thay đổi. Vui lòng kiểm tra các trường được đánh dấu.');
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await updateTourPackage(payload, { allowDemo: isDemo, currentTour: initialTour });
      if (result.status === 'SUCCESS' && result.data) {
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS);
        router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingMessage(result.message || OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
      } else if (result.status === 'ERROR') {
        setErrorMessage(result.message || OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      }
    } catch (err) {
      if (err instanceof OperatorTourValidationError) {
        setErrors(err.errors);
        showValidationToast('Không thể lưu thay đổi. Vui lòng kiểm tra các trường được đánh dấu.');
      } else {
        setErrorMessage(err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** TM-82 / UC-36: saves the draft version of an Approved/Published tour (spec §5.1/§5.3). */
  const handleSaveDraft = async () => {
    if (!draft) return;
    const payload = buildPayload();
    setErrors({});
    setSubmitting(true);
    try {
      const result = await saveDraftVersion(initialTour.id, draft.id, payload, initialTour);
      if (result.status === 'SUCCESS' && result.data) {
        setDraft(result.data);
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS);
      } else if (result.status === 'ERROR') {
        setErrorMessage(result.message || OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      }
    } catch (err) {
      if (err instanceof OperatorTourValidationError) {
        setErrors(err.errors);
        showValidationToast('Không thể lưu thay đổi. Vui lòng kiểm tra các trường được đánh dấu.');
      } else {
        setErrorMessage(err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = () => (isApproved ? handleSaveDraft() : handleSaveDirectEdit());

  /** TM-82 / UC-36: submits the draft version directly — never the UC-37 first-time submit page. */
  const handleSubmitDraft = async () => {
    if (!draft) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      const result = await submitDraftVersion(initialTour.id, draft.id, initialTour);
      if (result.status === 'SUCCESS' && result.data) {
        setDraft(result.data);
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.SUBMIT_SUCCESS);
      } else if (result.status === 'ERROR') {
        setErrorMessage(result.message || OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
    } finally {
      setSubmitting(false);
    }
  };

  /** TM-82 / UC-36 edge case 4: discards the draft, then creates a fresh one on next open. */
  const handleDiscardDraft = async () => {
    if (!draft) return;
    setSubmitting(true);
    try {
      await discardDraftVersion(initialTour.id, draft.id);
      router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      setSubmitting(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
        <span className="material-symbols-outlined animate-spin text-[32px] text-[#174B4A]">progress_activity</span>
        <p className="mt-2 text-xs font-bold">Đang tải bản nháp của gói tour...</p>
      </div>
    );
  }

  if (draftLoadError) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-900">
        <h2 className="text-lg font-bold">Không thể tải bản nháp</h2>
        <p className="mt-2 text-sm text-rose-800">{draftLoadError}</p>
        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="mt-4 inline-flex items-center rounded-xl bg-rose-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700"
        >
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="text-xl font-extrabold text-[#1C2928] sm:text-2xl break-words">
              {initialTour.title}
            </h1>
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700 shrink-0">
              {initialTour.tourCode}
            </span>
            <OperatorTourStatusBadge status={initialTour.status} />
            {isApproved && draft && (
              <OperatorTourStatusBadge status={draft.status} className="border border-dashed" />
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 break-words">
            {isApproved ? 'Chỉnh sửa bản nháp đề xuất cho gói tour đã duyệt.' : 'Chỉnh sửa thông tin gói tour.'}
          </p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
        >
          Quay lại danh sách
        </Link>
      </div>

      {/* Demo Mode Indicator */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              preview
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Đang xem và chỉnh sửa gói tour mẫu ({initialTour.tourCode}).
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            DEMO ONLY
          </span>
        </div>
      )}

      {isPending && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600">lock_clock</span>
            <div>
              <p className="font-extrabold text-sm">{OPERATOR_TOUR_MESSAGES.PENDING_READ_ONLY}</p>
              <p className="mt-0.5 font-normal text-amber-800">
                Gói tour đã được gửi tới Quản trị viên để xét duyệt. Tất cả các trường thông tin đang ở chế độ chỉ đọc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Bookings Impact Alert for Approved Tours (Screen #42) */}
      {isApproved && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0">
              warning
            </span>
            <div className="leading-relaxed">
              <strong>Gói tour này đang hoạt động và có {totalSoldSlots} chỗ đã xác nhận đặt chỗ.</strong>{' '}
              Gói tour đã xuất bản không được sửa trực tiếp. Mọi thay đổi về giá, sức chứa hoặc lịch trình được lưu vào <strong>bản nháp riêng</strong> và cần Quản trị viên xét duyệt lại trước khi áp dụng vào gói tour đang hoạt động.
            </div>
          </div>
        </div>
      )}

      {/* Rejection Notice: for Draft/Rejected tours, from the live tour itself (UC-35);
          for Approved/Published, from the draft version's own rejection (TM-82 §5.3 edge case 7). */}
      {editTarget?.status === 'Rejected' && editTarget.rejectionReason && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-rose-600 shrink-0">
              error
            </span>
            <div>
              <p className="font-bold">Lý do từ chối từ Quản trị viên:</p>
              <p className="mt-1 text-rose-800 leading-relaxed">{editTarget.rejectionReason}</p>
              <p className="mt-2 text-[11px] text-rose-700">
                Vui lòng chỉnh sửa các thông tin chưa đạt yêu cầu và gửi lại để được xét duyệt.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isDemo && catalogues.error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {catalogues.error}
        </div>
      )}

      {!isDemo && (
        <TourReadinessPanel blockers={initialTour.reviewBlockers} warnings={initialTour.warnings} />
      )}

      {/* Success / Error alerts */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-xs">
          {successMessage}
        </div>
      )}
      {pendingMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs">
          {pendingMessage}
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs">
          {errorMessage}
        </div>
      )}

      {/* 2-Column Responsive Layout (Screen #42) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Editable Fields with Diff Indicator */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1C2928]">Thông tin có thể chỉnh sửa</h3>
              {isApproved && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  Lưu vào bản nháp
                </span>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="field-title" className="block text-xs font-bold text-[#1C2928]">
                  Tên gói tour <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="field-title"
                  type="text"
                  disabled={isPending}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500"
                />
                {errors.title && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label id="label-destination" htmlFor="field-destination" className="block text-xs font-bold text-[#1C2928]">
                    Điểm đến chính <span className="text-rose-500" aria-hidden="true">*</span>
                  </label>
                  {isDemo ? (
                    <input
                      id="field-destination"
                      type="text"
                      disabled={isPending}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                    />
                  ) : (
                    <DestinationCheckboxes
                      options={catalogues.destinations}
                      selectedIds={destinationIds}
                      onChange={setDestinationIds}
                      labelId="label-destination"
                      disabled={isPending}
                      hasError={Boolean(errors.destination)}
                    />
                  )}
                  {errors.destination && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.destination}</p>}
                </div>

                <div>
                  <label htmlFor="field-category" className="block text-xs font-bold text-[#1C2928]">
                    Danh mục tour
                  </label>
                  {isDemo ? (
                    <select
                      id="field-category"
                      disabled={isPending}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                    >
                      <option value="Di sản & Thiên nhiên">Di sản & Thiên nhiên</option>
                      <option value="Văn hóa & Ẩm thực">Văn hóa & Ẩm thực</option>
                      <option value="Khám phá biển đảo">Khám phá biển đảo</option>
                      <option value="Nghỉ dưỡng & Sinh thái">Nghỉ dưỡng & Sinh thái</option>
                    </select>
                  ) : (
                    <CategorySelect
                      options={catalogues.categories}
                      value={category}
                      onChange={setCategory}
                      disabled={isPending}
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="field-description" className="block text-xs font-bold text-[#1C2928]">
                  Mô tả gói tour <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="field-description"
                  rows={4}
                  disabled={isPending}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                />
                {errors.description && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-inclusions" className="block text-xs font-bold text-[#1C2928]">
                    Dịch vụ bao gồm
                  </label>
                  <textarea
                    id="field-inclusions"
                    rows={3}
                    disabled={isPending}
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="field-exclusions" className="block text-xs font-bold text-[#1C2928]">
                    Dịch vụ không bao gồm
                  </label>
                  <textarea
                    id="field-exclusions"
                    rows={3}
                    disabled={isPending}
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="field-policy" className="block text-xs font-bold text-[#1C2928]">
                  Chính sách hủy tour <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                {isDemo ? (
                  <input
                    id="field-policy"
                    type="text"
                    disabled={isPending}
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                  />
                ) : (
                  <CancellationPolicySelect
                    options={catalogues.policies}
                    value={cancellationPolicy}
                    onChange={setCancellationPolicy}
                    disabled={isPending}
                    hasError={Boolean(errors.cancellationPolicy)}
                  />
                )}
                {errors.cancellationPolicy && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.cancellationPolicy}</p>
                )}
              </div>
            </div>
          </section>

          {/* Card 2: Itinerary Changes comparison table (Screen #42) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1C2928]">Lịch trình & Điểm dừng <span className="text-rose-500" aria-hidden="true">*</span></h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Xem và điều chỉnh các điểm dừng trong chương trình tour.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {errors.itinerary && (
                <div id="itinerary-validation" tabIndex={-1} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 outline-none">
                  {errors.itinerary}
                </div>
              )}
              {itinerary.map((day, dIdx) => (
                <div
                  key={day.dayNo}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedActivity) moveActivity(draggedActivity.dayIndex, draggedActivity.activityIndex, dIdx, -1);
                    setDraggedActivity(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-slate-800">Ngày {day.dayNo}</p>{!isPending && <button type="button" onClick={() => handleAddActivity(dIdx)} className="inline-flex items-center gap-1 text-xs font-bold text-[#174B4A] hover:underline"><span className="material-symbols-outlined text-[17px]" aria-hidden="true">add_circle</span>Thêm điểm dừng</button>}</div>
                  <div className="mt-3 space-y-3">
                    {day.activities.map((act, aIdx) => (
                      <div key={act.id} draggable={!isPending} onDragStart={() => setDraggedActivity({ dayIndex: dIdx, activityIndex: aIdx })} onDragEnd={() => setDraggedActivity(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                        event.stopPropagation();
                        if (draggedActivity) moveActivity(draggedActivity.dayIndex, draggedActivity.activityIndex, dIdx, aIdx);
                        setDraggedActivity(null);
                      }} className={`rounded-xl border border-slate-200 bg-white p-3 transition ${draggedActivity?.dayIndex === dIdx && draggedActivity.activityIndex === aIdx ? 'opacity-40' : ''}`}>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            {!isPending && <span className="material-symbols-outlined cursor-grab text-[19px] text-slate-400" title="Kéo để đổi thứ tự">drag_indicator</span>}
                            <span>Điểm dừng {aIdx + 1}</span>
                            {!isPending && <span className="inline-flex gap-1">
                              <button type="button" disabled={aIdx === 0} aria-label="Di chuyển lên" onClick={() => moveActivity(dIdx, aIdx, dIdx, aIdx - 1)} className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25">↑</button>
                              <button type="button" disabled={aIdx === day.activities.length - 1} aria-label="Di chuyển xuống" onClick={() => moveActivity(dIdx, aIdx, dIdx, aIdx + 1)} className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25">↓</button>
                            </span>}
                          </div>
                          {!isPending && <button type="button" aria-label={`Xóa điểm dừng ${aIdx + 1}`} onClick={() => handleRemoveActivity(dIdx, aIdx)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"><span className="material-symbols-outlined text-[19px]">delete</span></button>}
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-5"><label className="block text-[11px] font-semibold text-slate-600">Điểm dừng <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1">{isPending ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">{act.poiName}</p> : isDemo ? <input type="text" value={act.poiName} onChange={(e) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].poiName = e.target.value; setItinerary(updated); }} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs" /> : <PoiSelect options={catalogues.pois} value={act.poiId} currentName={act.poiName} onChange={(poi) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].poiId = poi?.id; updated[dIdx].activities[aIdx].poiName = poi?.name ?? ''; setItinerary(updated); }} />}</div></div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Giờ bắt đầu <span className="text-rose-500" aria-hidden="true">*</span></label>{isPending ? <p className="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700">{act.time}</p> : <select aria-label={`Giờ bắt đầu điểm dừng ${aIdx + 1}`} value={act.time} onChange={(event) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].time = event.target.value; setItinerary(updated); }} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs">{!START_TIME_OPTIONS.includes(act.time) && <option value={act.time}>{act.time}</option>}{START_TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select>}</div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Lưu lại (phút) <span className="text-rose-500" aria-hidden="true">*</span></label>{isPending ? <p className="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700">{act.stayDurationMinutes} phút</p> : <input aria-label={`Thời lượng điểm dừng ${aIdx + 1}`} type="number" min="1" value={act.stayDurationMinutes} onChange={(event) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].stayDurationMinutes = Number(event.target.value); setItinerary(updated); }} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs" />}</div>
                          <div className="md:col-span-3"><label className="block text-[11px] font-semibold text-slate-600">Phương tiện <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1">{isPending ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">{act.transport}</p> : <TransportSelect value={act.transport} onChange={(value) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].transport = value; setItinerary(updated); }} />}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar Column (1/3) */}
        <div className="space-y-6">
          {/* Card: Departure Schedules with Sold Slots (BR-61) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#1C2928] border-b border-slate-100 pb-3">
              Lịch khởi hành & Chỗ đã bán <span className="text-rose-500" aria-hidden="true">*</span>
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Sức chứa không được giảm xuống dưới số chỗ đã bán.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="field-basePrice" className="block text-[11px] font-semibold text-slate-600">Giá người lớn (VNĐ) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-basePrice" type="number" disabled={isPending} value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-mono text-slate-900 disabled:bg-slate-50" />{errors.basePrice && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.basePrice}</p>}</div>
              <div><label htmlFor="field-childPrice" className="block text-[11px] font-semibold text-slate-600">Giá trẻ em (VNĐ)</label><input id="field-childPrice" type="number" disabled={isPending} value={childPrice ?? ''} onChange={(e) => setChildPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="Tùy chọn" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-mono text-slate-900 disabled:bg-slate-50" /></div>
              <div><label htmlFor="field-maxCapacity" className="block text-[11px] font-semibold text-slate-600">Sức chứa tối đa <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-maxCapacity" type="number" disabled={isPending} value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900 disabled:bg-slate-50" />{errors.maxCapacity && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.maxCapacity}</p>}</div>
              <div><label htmlFor="field-duration" className="block text-[11px] font-semibold text-slate-600">Thời lượng (ngày) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-duration" type="number" min="1" disabled={isPending} value={durationDays} onChange={(e) => handleDurationChange(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900 disabled:bg-slate-50" />{errors.durationDays && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.durationDays}</p>}</div>
            </div>

            {errors.schedules && (
              <p id="schedule-validation" tabIndex={-1} role="alert" className="mt-2 text-xs font-semibold text-rose-600 outline-none">
                {errors.schedules}
              </p>
            )}

            <div className="mt-3 space-y-3">
              {schedules.map((sch, sIdx) => (
                <div key={sch.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Khởi hành {formatDisplayDate(sch.departureDate)}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Đã bán: {sch.reservedCapacity}
                    </span>
                  </div>
                  <div>
                    <label htmlFor={`sch-cap-${sch.id}`} className="text-[11px] text-slate-600 font-semibold">
                      Sức chứa tổng cộng (Tối thiểu {sch.reservedCapacity}) <span className="text-rose-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`sch-cap-${sch.id}`}
                      type="number"
                      disabled={isPending}
                      min={sch.reservedCapacity}
                      value={sch.totalCapacity}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[sIdx].totalCapacity = Number(e.target.value);
                        setSchedules(updated);
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-900"
                    />
                  </div>
                  {!isDemo && (
                    <DepartureTermsFields
                      schedule={sch}
                      disabled={isPending}
                      onChange={(patch) => {
                        const updated = [...schedules];
                        updated[sIdx] = { ...updated[sIdx], ...patch };
                        setSchedules(updated);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {!isDemo && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="border-b border-slate-100 pb-3 text-base font-extrabold text-[#1C2928]">Thông tin bổ sung</h3>
              <div className="mt-3">
                <TourTermsFields
                  highlights={highlights}
                  travellerRequirements={travellerRequirements}
                  onHighlights={setHighlights}
                  onTravellerRequirements={setTravellerRequirements}
                  disabled={isPending}
                />
              </div>
            </section>
          )}

          {!isDemo && (
            <TourMediaManager
              tourId={initialTour.id}
              tourTitle={initialTour.title}
              media={media}
              onChange={setMedia}
              disabled={isPending || isApproved}
            />
          )}

          {/* Card: Live Tour vs. Draft Status (Screen #42) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#1C2928] border-b border-slate-100 pb-3">
              {isApproved ? 'Trạng thái gói tour' : 'Lịch sử phiên bản'}
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">{initialTour.status}</p>
                  <p className="text-[10px] text-slate-500">Gói tour đang hoạt động, không đổi cho tới khi bản nháp được duyệt</p>
                </div>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  Hiện tại
                </span>
              </div>
              {isApproved && draft && (
                <div className="flex items-center justify-between rounded-xl p-2.5 border border-dashed border-blue-200 bg-blue-50/50 text-blue-900">
                  <div>
                    <p className="font-medium">{draft.status}</p>
                    <p className="text-[10px] text-blue-700">Bản nháp đang chỉnh sửa</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Quay lại
        </Link>
        {!isPending && (
          <>
            {isApproved && draft && (draft.status === 'Draft' || draft.status === 'Rejected') && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                disabled={submitting}
                className="w-full sm:w-auto text-center rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
              >
                Bỏ bản nháp
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="w-full sm:w-auto text-center rounded-xl border border-[#174B4A] bg-white px-5 py-2.5 text-xs font-bold text-[#174B4A] hover:bg-[#174B4A]/5 transition disabled:opacity-50"
            >
              {submitting ? 'Đang lưu…' : isApproved ? 'Lưu bản nháp' : 'Lưu thay đổi'}
            </button>
            {(editTarget?.status === 'Draft' || editTarget?.status === 'Rejected') && (
              <button
                type="button"
                onClick={() => isApproved
                  ? handleSubmitDraft()
                  : router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(initialTour.id), isDemo))}
                disabled={submitting}
                className="w-full sm:w-auto text-center rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#103B39] transition disabled:opacity-50"
              >
                Gửi xét duyệt
              </button>
            )}
          </>
        )}
      </div>

      {validationToast && (
        <div role="alert" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-900 shadow-lg">
          <span className="material-symbols-outlined shrink-0 text-[20px] text-rose-600" aria-hidden="true">error</span>
          <p className="flex-1 font-medium leading-5">{validationToast}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setValidationToast(null)} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

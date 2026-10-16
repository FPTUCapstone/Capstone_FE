'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import {
  createTourPackage,
  OperatorTourValidationError,
  validateCreateTourPackage,
} from '../services/operatorTourService';
import { CancellationPolicySelect, CategorySelect, DestinationCheckboxes, PoiSelect, TransportSelect } from './TourCataloguePickers';
import { DepartureTermsFields, TourTermsFields } from './TourExtraFields';
import { useTourCatalogues } from './useTourCatalogues';
import {
  OPERATOR_TOUR_MESSAGES,
  type CreateTourPackagePayload,
  type TourDepartureSchedule,
  type TourItineraryActivity,
  type TourItineraryDay,
  type TourValidationErrors,
} from '../types/tourLifecycle';

interface CreateTourPackageViewProps {
  isDemo?: boolean;
}

let activitySeq = 1;
function nextActivityId(): string {
  activitySeq += 1;
  return `act-user-${activitySeq}`;
}

let scheduleSeq = 1;
function nextScheduleId(): string {
  scheduleSeq += 1;
  return `sch-user-${scheduleSeq}`;
}

const START_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4).toString().padStart(2, '0');
  const minutes = ((index % 4) * 15).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

function dayHeading(day: TourItineraryDay): string {
  const prefix = `Ngày ${day.dayNo}:`;
  const title = day.title?.trim();
  return !title ? prefix : title.startsWith(prefix) ? title : `${prefix} ${title}`;
}

/** A default departure two weeks ahead, so the form never starts with a date in the past. */
function defaultDepartureDate(daysAhead = 14): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

export function CreateTourPackageView({ isDemo = false }: CreateTourPackageViewProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState(isDemo ? 'Di sản & Thiên nhiên' : '');
  const [highlights, setHighlights] = useState('');
  const [travellerRequirements, setTravellerRequirements] = useState('');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [basePrice, setBasePrice] = useState<number>(1000000);
  const [childPrice, setChildPrice] = useState<number | undefined>(undefined);
  const [maxCapacity, setMaxCapacity] = useState<number>(20);
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState(
    isDemo ? 'Hoàn tiền 100% khi hủy trước ngày khởi hành ít nhất 24 giờ.' : ''
  );
  const [destinationIds, setDestinationIds] = useState<number[]>([]);
  const catalogues = useTourCatalogues(isDemo);
  const availablePois = catalogues.pois;
  // One idempotency key per unchanged payload: a retry after a lost response must not create a second draft.
  const createAttempt = useRef<{ signature: string; key: string } | null>(null);

  // Itinerary state
  const [itinerary, setItinerary] = useState<TourItineraryDay[]>([
    {
      dayNo: 1,
      title: 'Ngày 1: Khám phá điểm đến',
      activities: [
        {
          id: 'act-init-1',
          time: '08:00',
          poiName: 'Đón khách tại điểm hẹn',
          stayDurationMinutes: 30,
          transport: 'Xe du lịch',
          notes: 'Tập trung đúng giờ',
        },
      ],
    },
  ]);

  // Departure schedules state
  const [schedules, setSchedules] = useState<TourDepartureSchedule[]>([
    {
      id: 'sch-init-1',
      departureDate: defaultDepartureDate(),
      returnDate: defaultDepartureDate(),
      totalCapacity: 20,
      reservedCapacity: 0,
      meetingPoint: 'Trung tâm thành phố',
      status: 'Scheduled',
    },
  ]);

  // Media state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  // Validation & UI state
  const [errors, setErrors] = useState<TourValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const validationToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (validationToastTimer.current) clearTimeout(validationToastTimer.current);
  }, []);

  const showValidationToast = (message: string) => {
    setValidationToast(message);
    if (validationToastTimer.current) clearTimeout(validationToastTimer.current);
    validationToastTimer.current = setTimeout(() => {
      setValidationToast(null);
      validationToastTimer.current = null;
    }, 4500);
  };

  // Handlers for Itinerary
  const handleDurationChange = (nextValue: number) => {
    const nextDuration = Math.max(1, nextValue || 1);
    setDurationDays(nextDuration);
    setItinerary((current) => {
      if (nextDuration < current.length) return current.slice(0, nextDuration);
      if (nextDuration === current.length) return current;
      return [...current, ...Array.from({ length: nextDuration - current.length }, (_, index) => {
        const dayNo = current.length + index + 1;
        return { dayNo, title: `Ngày ${dayNo}: Tiếp tục hành trình`, activities: [] };
      })];
    });
  };

  const handleAddActivity = (dayIndex: number) => {
    const updated = [...itinerary];
    const newAct: TourItineraryActivity = {
      id: nextActivityId(),
      time: '10:00',
      poiName: 'Điểm tham quan mới',
      stayDurationMinutes: 60,
      transport: 'Đi bộ',
    };
    updated[dayIndex].activities.push(newAct);
    setItinerary(updated);
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    const updated = [...itinerary];
    updated[dayIndex].activities.splice(actIndex, 1);
    setItinerary(updated);
  };

  // Handlers for Schedules
  const handleAddSchedule = () => {
    const lastDeparture = schedules[schedules.length - 1]?.departureDate;
    const nextDep = lastDeparture
      ? new Date(new Date(`${lastDeparture}T00:00:00Z`).getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
      : defaultDepartureDate(21);
    const newSch: TourDepartureSchedule = {
      id: nextScheduleId(),
      departureDate: nextDep,
      returnDate: nextDep,
      totalCapacity: maxCapacity,
      reservedCapacity: 0,
      meetingPoint: destination || 'Điểm hẹn trung tâm',
      status: 'Scheduled',
    };
    setSchedules([...schedules, newSch]);
  };

  const handleRemoveSchedule = (index: number) => {
    if (schedules.length <= 1) return;
    const updated = [...schedules];
    updated.splice(index, 1);
    setSchedules(updated);
  };

  // Handlers for Media
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setMediaFiles([...mediaFiles, ...filesArray]);

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setMediaPreviews([...mediaPreviews, ...newPreviews]);
  };
  const removeQueuedImage = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((files) => files.filter((_, candidate) => candidate !== index));
    setMediaPreviews((previews) => previews.filter((_, candidate) => candidate !== index));
  };

  // Submission handler
  const handleSave = async (andSubmitApproval = false) => {
    setErrorMessage(null);
    setPendingMessage(null);
    setSuccessMessage(null);

    const selectedDestinationNames = catalogues.destinations
      .filter((option) => destinationIds.includes(option.destinationId))
      .map((option) => option.name);
    const payload: CreateTourPackagePayload = {
      title,
      destination: isDemo ? destination : selectedDestinationNames.join(', '),
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
      timeZoneId: isDemo ? undefined : 'Asia/Ho_Chi_Minh',
      cancellationPolicy,
      itinerary,
      schedules,
      mediaFiles,
    };

    // Client-side pre-validation
    const validationErrors = validateCreateTourPackage(payload);
    if (!isDemo && itinerary.some((day) => day.activities.some((activity) => !Number.isSafeInteger(Number(activity.poiId)) || Number(activity.poiId) <= 0))) {
      validationErrors.itinerary = 'Vui lòng chọn điểm tham quan cho từng điểm dừng.';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showValidationToast('Không thể lưu gói tour. Vui lòng kiểm tra các trường được đánh dấu.');
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const signature = JSON.stringify({ ...payload, mediaFiles: undefined });
      if (createAttempt.current?.signature !== signature) {
        createAttempt.current = { signature, key: crypto.randomUUID() };
      }
      const result = await createTourPackage(payload, {
        allowDemo: isDemo,
        idempotencyKey: createAttempt.current.key,
      });
      if (result.status === 'SUCCESS' && result.data) {
        createAttempt.current = null;
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.CREATE_SUCCESS);
        if (andSubmitApproval) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(result.data.id), isDemo));
        } else if (isDemo) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
        } else {
          // A saved draft still needs its cover photo, which is managed on the edit screen.
          router.push(OPERATOR_TOUR_ROUTES.edit(result.data.id));
        }
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingMessage(result.message || OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
      }
    } catch (err) {
      if (err instanceof OperatorTourValidationError) {
        setErrors(err.errors);
        showValidationToast('Không thể lưu gói tour. Vui lòng kiểm tra các trường được đánh dấu.');
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
              Tạo gói tour mới
            </h1>
            <OperatorTourStatusBadge status="Draft" />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Khởi tạo gói tour thương mại gồm lịch trình, các chuyến khởi hành, mức giá và chính sách hủy.
          </p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Quay lại danh sách
        </Link>
      </div>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              preview
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Đang thao tác trên dữ liệu mô phỏng độc lập.
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            DEMO ONLY
          </span>
        </div>
      )}

      {!isDemo && catalogues.error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {catalogues.error}
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-xs"
        >
          {successMessage}
        </div>
      )}
      {pendingMessage && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs"
        >
          {pendingMessage}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs"
        >
          {errorMessage}
        </div>
      )}

      {/* 2-Column Responsive Layout (Report 3 Screen #41) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2/3 width on desktop): Basic Info, Itinerary, Policies */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Basic Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Thông tin cơ bản gói tour
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="field-title" className="block text-xs font-bold text-[#00152A]">
                  Tên gói tour <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Tour trọn ngày Bà Nà Hills - Cầu Vàng"
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.title ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.title && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label id="label-destination" htmlFor="field-destination" className="block text-xs font-bold text-[#00152A]">
                    Điểm đến chính <span className="text-rose-500">*</span>
                  </label>
                  {isDemo ? (
                    <input
                      id="field-destination"
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Đà Nẵng"
                      className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                        errors.destination ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#006B5F]'
                      }`}
                    />
                  ) : (
                    <DestinationCheckboxes
                      options={catalogues.destinations}
                      selectedIds={destinationIds}
                      onChange={setDestinationIds}
                      labelId="label-destination"
                      hasError={Boolean(errors.destination)}
                    />
                  )}
                  {errors.destination && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.destination}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-category" className="block text-xs font-bold text-[#00152A]">
                    Danh mục tour
                  </label>
                  {isDemo ? (
                    <select
                      id="field-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
                    >
                      <option value="Di sản & Thiên nhiên">Di sản & Thiên nhiên</option>
                      <option value="Văn hóa & Ẩm thực">Văn hóa & Ẩm thực</option>
                      <option value="Khám phá biển đảo">Khám phá biển đảo</option>
                      <option value="Nghỉ dưỡng & Sinh thái">Nghỉ dưỡng & Sinh thái</option>
                    </select>
                  ) : (
                    <CategorySelect options={catalogues.categories} value={category} onChange={setCategory} />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="field-description" className="block text-xs font-bold text-[#00152A]">
                  Mô tả chi tiết gói tour <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="field-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu điểm nổi bật, trải nghiệm du khách nhận được trong chuyến đi..."
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.description ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.description && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Card 2: Day-by-Day Itinerary Builder */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#00152A]">
                  Lịch trình chi tiết theo ngày <span className="text-rose-500" aria-hidden="true">*</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Xây dựng các điểm dừng, hoạt động và thời gian biểu. Cần tối thiểu một ngày và một điểm dừng.
                </p>
              </div>
            </div>

            {errors.itinerary && (
              <p role="alert" className="mt-3 text-xs font-semibold text-rose-600">
                {errors.itinerary}
              </p>
            )}

            <div className="mt-4 space-y-6">
              {itinerary.map((day, dIdx) => (
                <div key={day.dayNo} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <span className="text-xs font-extrabold text-[#00152A]">
                      {dayHeading(day)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddActivity(dIdx)}
                      className="text-xs font-bold text-[#006B5F] hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Thêm điểm dừng
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {day.activities.map((act, aIdx) => (
                      <div key={act.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Điểm dừng {aIdx + 1}</span>
                          <button type="button" aria-label={`Xóa điểm dừng ${aIdx + 1}`} onClick={() => handleRemoveActivity(dIdx, aIdx)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700" title="Xóa điểm dừng">
                            <span className="material-symbols-outlined text-[19px]">delete</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-5"><label className="block text-[11px] font-semibold text-slate-600">Điểm dừng <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1">{isDemo ? <input type="text" value={act.poiName} onChange={(e) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].poiName = e.target.value; setItinerary(updated); }} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs" /> : <PoiSelect options={availablePois} value={act.poiId} currentName={act.poiName} onChange={(poi) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].poiId = poi?.id; updated[dIdx].activities[aIdx].poiName = poi?.name ?? ''; setItinerary(updated); }} />}</div></div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Giờ bắt đầu <span className="text-rose-500" aria-hidden="true">*</span></label><select value={act.time} onChange={(e) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].time = e.target.value; setItinerary(updated); }} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs">{!START_TIME_OPTIONS.includes(act.time) && <option value={act.time}>{act.time}</option>}{START_TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select></div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Lưu lại (phút) <span className="text-rose-500" aria-hidden="true">*</span></label><input type="number" min="10" step="10" value={act.stayDurationMinutes} onChange={(e) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].stayDurationMinutes = Number(e.target.value); setItinerary(updated); }} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs" /></div>
                          <div className="md:col-span-3"><label className="block text-[11px] font-semibold text-slate-600">Phương tiện <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1"><TransportSelect value={act.transport} onChange={(value) => { const updated = [...itinerary]; updated[dIdx].activities[aIdx].transport = value; setItinerary(updated); }} /></div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Card 3: Inclusions, Exclusions & Policies */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Dịch vụ bao gồm & Chính sách hủy
            </h3>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-inclusions" className="block text-xs font-bold text-[#00152A]">
                    Bao gồm trong giá tour
                  </label>
                  <textarea
                    id="field-inclusions"
                    rows={3}
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    placeholder="Xe đưa đón, hướng dẫn viên, vé tham quan..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
                  />
                </div>

                <div>
                  <label htmlFor="field-exclusions" className="block text-xs font-bold text-[#00152A]">
                    Không bao gồm
                  </label>
                  <textarea
                    id="field-exclusions"
                    rows={3}
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    placeholder="Chi phí cá nhân, tiền tip..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="field-cancellation" className="block text-xs font-bold text-[#00152A]">
                  Chính sách hủy tour <span className="text-rose-500">*</span>
                </label>
                {isDemo ? (
                  <textarea
                    id="field-cancellation"
                    rows={2}
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    placeholder="Quy định hoàn hủy đối với du khách..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900"
                  />
                ) : (
                  <CancellationPolicySelect
                    options={catalogues.policies}
                    value={cancellationPolicy}
                    onChange={setCancellationPolicy}
                    hasError={Boolean(errors.cancellationPolicy)}
                  />
                )}
                {errors.cancellationPolicy && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.cancellationPolicy}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right column: departure schedules, optional terms and media */}
        <div className="space-y-6">
          {/* Card: Departure Schedules */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#00152A]">Lịch khởi hành <span className="text-rose-500" aria-hidden="true">*</span></h3>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="text-xs font-bold text-[#006B5F] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Thêm lịch
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="field-basePrice" className="block text-[11px] font-semibold text-slate-600">Giá người lớn (VNĐ) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-basePrice" type="number" min="1" step="10000" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className={`mt-1 h-10 w-full rounded-lg border px-2.5 text-xs font-mono text-slate-900 ${errors.basePrice ? 'border-rose-400' : 'border-slate-300'}`} />{errors.basePrice && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.basePrice}</p>}</div>
              <div><label htmlFor="field-childPrice" className="block text-[11px] font-semibold text-slate-600">Giá trẻ em (VNĐ)</label><input id="field-childPrice" type="number" min="0" step="10000" value={childPrice ?? ''} onChange={(e) => setChildPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="Tùy chọn" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-mono text-slate-900" /></div>
              <div><label htmlFor="field-capacity" className="block text-[11px] font-semibold text-slate-600">Sức chứa tối đa <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-capacity" type="number" min="1" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} className={`mt-1 h-10 w-full rounded-lg border px-2.5 text-xs text-slate-900 ${errors.maxCapacity ? 'border-rose-400' : 'border-slate-300'}`} />{errors.maxCapacity && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.maxCapacity}</p>}</div>
              <div><label htmlFor="field-duration" className="block text-[11px] font-semibold text-slate-600">Thời lượng (ngày) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-duration" type="number" min="1" value={durationDays} onChange={(e) => handleDurationChange(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900" />{errors.durationDays && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.durationDays}</p>}</div>
            </div>

            {errors.schedules && (
              <p role="alert" className="mt-3 text-xs font-semibold text-rose-600">
                {errors.schedules}
              </p>
            )}

            <div className="mt-3 space-y-3">
              {schedules.map((sch, sIdx) => (
                <div key={sch.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Khởi hành #{sIdx + 1}</span>
                    {schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(sIdx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Ngày đi <span className="text-rose-500" aria-hidden="true">*</span></span>
                      <input
                        type="date"
                        value={sch.departureDate}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[sIdx].departureDate = e.target.value;
                          setSchedules(updated);
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Ngày về <span className="text-rose-500" aria-hidden="true">*</span></span>
                      <input
                        type="date"
                        value={sch.returnDate}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[sIdx].returnDate = e.target.value;
                          setSchedules(updated);
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Chỗ mở bán <span className="text-rose-500" aria-hidden="true">*</span></span>
                    <input
                      type="number"
                      min="1"
                      value={sch.totalCapacity}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[sIdx].totalCapacity = Number(e.target.value);
                        setSchedules(updated);
                      }}
                      className="w-full rounded-lg border border-slate-200 p-1 text-xs"
                    />
                  </div>
                  {!isDemo && (
                    <DepartureTermsFields
                      schedule={sch}
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
              <h3 className="border-b border-slate-100 pb-3 text-base font-extrabold text-[#00152A]">Thông tin bổ sung</h3>
              <div className="mt-3">
                <TourTermsFields
                  highlights={highlights}
                  travellerRequirements={travellerRequirements}
                  onHighlights={setHighlights}
                  onTravellerRequirements={setTravellerRequirements}
                />
              </div>
            </section>
          )}

          {/* Card: Cover Photos / Media */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Hình ảnh giới thiệu
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Tệp hình ảnh dung lượng tối đa 5MB mỗi ảnh.
            </p>

            <div className="mt-3">
              <label
                htmlFor="media-upload"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-4 text-center cursor-pointer hover:bg-slate-50 transition"
              >
                <span className="material-symbols-outlined text-[28px] text-slate-400">add_photo_alternate</span>
                <span className="mt-1 text-xs font-bold text-slate-700">Tải lên hình ảnh</span>
                <span className="text-[10px] text-slate-400">Chọn ảnh từ thiết bị</span>
                <input
                  id="media-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {errors.media && (
                <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
                  {errors.media}
                </p>
              )}

              {mediaPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {mediaPreviews.map((src, pIdx) => (
                    <div key={src} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Ảnh tải lên ${pIdx + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                      <div className="flex items-center justify-between px-1 pt-1.5">
                        <span className="text-[11px] font-medium text-slate-500">Ảnh {pIdx + 1}</span>
                        <button type="button" aria-label={`Xóa ảnh ${pIdx + 1}`} onClick={() => removeQueuedImage(pIdx)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:bg-rose-50 focus-visible:text-rose-600" title="Xóa ảnh">
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Amber Alert Notice from Screen #41 */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">
                warning
              </span>
              <p className="leading-relaxed">
                Gói tour mới được lưu ở trạng thái <strong>Bản nháp</strong>. Gói tour không thể mở bán cho du khách cho đến khi Quản trị viên phê duyệt.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Hủy
        </Link>
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={submitting}
          className="rounded-xl border border-[#006B5F] bg-white px-5 py-2.5 text-xs font-bold text-[#006B5F] hover:bg-[#006B5F]/5 transition disabled:opacity-50"
        >
          {submitting ? 'Đang lưu bản nháp…' : 'Lưu bản nháp'}
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={submitting}
          className="rounded-xl bg-[#006B5F] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50"
        >
          {submitting ? 'Đang lưu…' : 'Lưu và gửi xét duyệt'}
        </button>
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

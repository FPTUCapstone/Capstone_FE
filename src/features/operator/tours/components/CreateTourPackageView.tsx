'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import {
  createTourPackage,
  OperatorTourValidationError,
  validateCreateTourPackage,
} from '../services/operatorTourService';
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

const INITIAL_DEPARTURE_DATE = '2026-11-01';

export function CreateTourPackageView({ isDemo = false }: CreateTourPackageViewProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('Di sản & Thiên nhiên');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [basePrice, setBasePrice] = useState<number>(1000000);
  const [childPrice, setChildPrice] = useState<number | undefined>(undefined);
  const [maxCapacity, setMaxCapacity] = useState<number>(20);
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Hoàn tiền 100% khi hủy trước ngày khởi hành ít nhất 24 giờ.'
  );

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
      departureDate: INITIAL_DEPARTURE_DATE,
      returnDate: INITIAL_DEPARTURE_DATE,
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

  // Handlers for Itinerary
  const handleAddDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      {
        dayNo: nextDay,
        title: `Ngày ${nextDay}: Tiếp tục hành trình`,
        activities: [],
      },
    ]);
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
    const nextDep = '2026-11-15';
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

  // Submission handler
  const handleSave = async (andSubmitApproval = false) => {
    setErrorMessage(null);
    setPendingMessage(null);
    setSuccessMessage(null);

    const payload: CreateTourPackagePayload = {
      title,
      destination,
      category,
      durationDays,
      basePrice,
      childPrice,
      maxCapacity,
      description,
      inclusions,
      exclusions,
      cancellationPolicy,
      itinerary,
      schedules,
      mediaFiles,
    };

    // Client-side pre-validation
    const validationErrors = validateCreateTourPackage(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await createTourPackage(payload, { allowDemo: isDemo });
      if (result.status === 'SUCCESS' && result.data) {
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.CREATE_SUCCESS);
        if (andSubmitApproval) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(result.data.id), isDemo));
        } else {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
        }
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingMessage(result.message || OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
      }
    } catch (err) {
      if (err instanceof OperatorTourValidationError) {
        setErrors(err.errors);
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
            Khởi tạo gói tour thương mại bao gồm lịch trình, các chuyến khởi hành, mức giá và chính sách hủy (UC-35, Screen #41).
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

      {/* Real Mode Pending Backend Integration Banner */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0" aria-hidden="true">
              pending_actions
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Tính năng tạo gói tour đang chờ kết nối dịch vụ máy chủ
              </h3>
              <p className="mt-1 leading-relaxed text-amber-900">
                Giao diện và các quy tắc kiểm tra tính hợp lệ đã được xác thực (thông tin bắt buộc, giá tour, sức chứa, ngày khởi hành).
                Dữ liệu hiện tại chưa được lưu trữ vào hệ thống máy chủ (Capstone_BE).
              </p>
            </div>
          </div>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="field-destination" className="block text-xs font-bold text-[#00152A]">
                    Điểm đến chính <span className="text-rose-500">*</span>
                  </label>
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
                  {errors.destination && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.destination}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-duration" className="block text-xs font-bold text-[#00152A]">
                    Thời lượng (Số ngày) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-duration"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
                  />
                  {errors.durationDays && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.durationDays}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-category" className="block text-xs font-bold text-[#00152A]">
                    Danh mục tour
                  </label>
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
                  Lịch trình chi tiết theo ngày
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Xây dựng các điểm dừng, hoạt động và thời gian biểu (BR-101: Tối thiểu 1 ngày và 1 điểm dừng).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDay}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Thêm ngày
              </button>
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
                      Ngày {day.dayNo}: {day.title || `Hành trình ngày ${day.dayNo}`}
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

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-2 font-semibold w-16">Thời gian</th>
                          <th className="pb-2 font-semibold">Điểm dừng / Hoạt động</th>
                          <th className="pb-2 font-semibold w-24">Lưu lại</th>
                          <th className="pb-2 font-semibold w-24">Di chuyển</th>
                          <th className="pb-2 font-semibold text-right w-16">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {day.activities.map((act, aIdx) => (
                          <tr key={act.id}>
                            <td className="py-2.5 font-mono text-slate-700">
                              <input
                                type="text"
                                value={act.time}
                                onChange={(e) => {
                                  const updated = [...itinerary];
                                  updated[dIdx].activities[aIdx].time = e.target.value;
                                  setItinerary(updated);
                                }}
                                className="w-14 rounded-lg border border-slate-200 p-1 text-xs"
                              />
                            </td>
                            <td className="py-2.5 font-medium text-slate-900">
                              <input
                                type="text"
                                value={act.poiName}
                                onChange={(e) => {
                                  const updated = [...itinerary];
                                  updated[dIdx].activities[aIdx].poiName = e.target.value;
                                  setItinerary(updated);
                                }}
                                className="w-full rounded-lg border border-slate-200 p-1 text-xs"
                              />
                            </td>
                            <td className="py-2.5 text-slate-600">
                              <input
                                type="number"
                                min="10"
                                step="10"
                                value={act.stayDurationMinutes}
                                onChange={(e) => {
                                  const updated = [...itinerary];
                                  updated[dIdx].activities[aIdx].stayDurationMinutes = Number(e.target.value);
                                  setItinerary(updated);
                                }}
                                className="w-14 rounded-lg border border-slate-200 p-1 text-xs"
                              />{' '}
                              p
                            </td>
                            <td className="py-2.5 text-slate-600">
                              <input
                                type="text"
                                value={act.transport}
                                onChange={(e) => {
                                  const updated = [...itinerary];
                                  updated[dIdx].activities[aIdx].transport = e.target.value;
                                  setItinerary(updated);
                                }}
                                className="w-16 rounded-lg border border-slate-200 p-1 text-xs"
                              />
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveActivity(dIdx, aIdx)}
                                className="text-rose-500 hover:text-rose-700"
                                title="Xóa điểm dừng"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <textarea
                  id="field-cancellation"
                  rows={2}
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  placeholder="Quy định hoàn hủy đối với du khách..."
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.cancellationPolicy
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.cancellationPolicy && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.cancellationPolicy}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (1/3 width on desktop): Pricing, Schedules, Photos, Alert */}
        <div className="space-y-6">
          {/* Card: Pricing & Capacity */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Giá bán & Sức chứa
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="field-basePrice" className="block text-xs font-bold text-[#00152A]">
                  Giá người lớn (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-basePrice"
                  type="number"
                  min="1"
                  step="10000"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.basePrice ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.basePrice && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.basePrice}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="field-childPrice" className="block text-xs font-bold text-[#00152A]">
                  Giá trẻ em (VNĐ) <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  id="field-childPrice"
                  type="number"
                  min="0"
                  step="10000"
                  value={childPrice || ''}
                  onChange={(e) => setChildPrice(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Để trống nếu không áp dụng"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 font-mono focus:border-[#006B5F] focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
                />
              </div>

              <div>
                <label htmlFor="field-capacity" className="block text-xs font-bold text-[#00152A]">
                  Sức chứa tối đa mỗi chuyến <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-capacity"
                  type="number"
                  min="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 ${
                    errors.maxCapacity ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#006B5F]'
                  }`}
                />
                {errors.maxCapacity && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.maxCapacity}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Card: Departure Schedules */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#00152A]">Lịch khởi hành</h3>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="text-xs font-bold text-[#006B5F] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Thêm lịch
              </button>
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
                      <span className="text-[10px] text-slate-500">Ngày đi</span>
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
                      <span className="text-[10px] text-slate-500">Ngày về</span>
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
                    <span className="text-[10px] text-slate-500">Chỗ mở bán</span>
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
                </div>
              ))}
            </div>
          </section>

          {/* Card: Cover Photos / Media */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Hình ảnh giới thiệu
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Tệp hình ảnh dung lượng tối đa 5MB mỗi ảnh (BR-16).
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
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {mediaPreviews.map((src, pIdx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={pIdx}
                      src={src}
                      alt={`Ảnh tải lên ${pIdx + 1}`}
                      className="h-16 w-full rounded-lg object-cover border border-slate-200"
                    />
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
          Lưu bản nháp (UC-35)
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={submitting}
          className="rounded-xl bg-[#006B5F] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50"
        >
          Lưu và gửi xét duyệt (UC-37)
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import {
  OperatorTourValidationError,
  updateTourPackage,
  validateUpdateTourPackage,
} from '../services/operatorTourService';
import {
  OPERATOR_TOUR_MESSAGES,
  type TourDepartureSchedule,
  type TourItineraryActivity,
  type TourItineraryDay,
  type TourPackageDto,
  type TourValidationErrors,
  type UpdateTourPackagePayload,
} from '../types/tourLifecycle';

interface UpdateTourPackageViewProps {
  initialTour: TourPackageDto;
  isDemo?: boolean;
}

export function UpdateTourPackageView({ initialTour, isDemo = false }: UpdateTourPackageViewProps) {
  const router = useRouter();
  const isPending = initialTour.status === 'Pending';
  const isApproved = initialTour.status === 'Approved';

  // Form State initialized from initialTour
  const [title, setTitle] = useState(initialTour.title);
  const [destination, setDestination] = useState(initialTour.destination);
  const [category, setCategory] = useState(initialTour.category || 'Di sản & Thiên nhiên');
  const [durationDays, setDurationDays] = useState(initialTour.durationDays);
  const [basePrice, setBasePrice] = useState(initialTour.basePrice);
  const [childPrice, setChildPrice] = useState(initialTour.childPrice);
  const [maxCapacity, setMaxCapacity] = useState(initialTour.maxCapacity);
  const [description, setDescription] = useState(initialTour.description);
  const [inclusions, setInclusions] = useState(initialTour.inclusions || '');
  const [exclusions, setExclusions] = useState(initialTour.exclusions || '');
  const [cancellationPolicy, setCancellationPolicy] = useState(initialTour.cancellationPolicy);

  // Itinerary & Schedules
  const [itinerary, setItinerary] = useState<TourItineraryDay[]>(
    JSON.parse(JSON.stringify(initialTour.itinerary || []))
  );
  const [schedules, setSchedules] = useState<TourDepartureSchedule[]>(
    JSON.parse(JSON.stringify(initialTour.schedules || []))
  );

  // Total confirmed bookings calculation
  const totalSoldSlots = schedules.reduce((acc, s) => acc + (s.reservedCapacity || 0), 0);

  // UI & Validation states
  const [errors, setErrors] = useState<TourValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handlers for Itinerary
  const handleAddActivity = (dayIndex: number) => {
    if (isPending) return;
    const updated = [...itinerary];
    const newAct: TourItineraryActivity = {
      id: `act-${Date.now()}`,
      time: '16:00',
      poiName: 'Điểm tham quan mới',
      stayDurationMinutes: 45,
      transport: 'Đi bộ',
    };
    updated[dayIndex].activities.push(newAct);
    setItinerary(updated);
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    if (isPending) return;
    const updated = [...itinerary];
    updated[dayIndex].activities.splice(actIndex, 1);
    setItinerary(updated);
  };

  // Submit Handler
  const handleSave = async (andSubmit = false) => {
    if (isPending) return;

    setErrorMessage(null);
    setPendingMessage(null);
    setSuccessMessage(null);

    const payload: UpdateTourPackagePayload = {
      id: initialTour.id,
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
    };

    // Pre-validate locally
    const validationErrors = validateUpdateTourPackage(payload, initialTour);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // If approved, BR-103 requires creating a new draft version
      const result = await updateTourPackage(payload, {
        allowDemo: isDemo,
        currentTour: initialTour,
        createNewVersion: isApproved,
      });

      if (result.status === 'SUCCESS' && result.data) {
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS);
        if (andSubmit) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(result.data.id), isDemo));
        } else {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
        }
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingMessage(result.message || OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
      } else if (result.status === 'ERROR') {
        setErrorMessage(result.message || OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
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
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
              {initialTour.title}
            </h1>
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700">
              {initialTour.tourCode}
            </span>
            <OperatorTourStatusBadge status={initialTour.status} />
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
              v{initialTour.version}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Chỉnh sửa gói tour hiện có và quản lý các phiên bản phát hành (UC-36, Screen #42).
          </p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
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

      {/* Pending Approval Read-Only Banner (MSG122) */}
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
              Theo quy định <strong>BR-103</strong>, gói tour đã xuất bản không được sửa trực tiếp. Mọi thay đổi về giá, sức chứa hoặc lịch trình sẽ tạo thành <strong>phiên bản nháp mới (v{initialTour.version + 1})</strong> và cần Quản trị viên xét duyệt lại trước khi có hiệu lực với các chuyến đi mới.
            </div>
          </div>
        </div>
      )}

      {/* Rejection Notice if Status is Rejected */}
      {initialTour.status === 'Rejected' && initialTour.rejectionReason && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-rose-600 shrink-0">
              error
            </span>
            <div>
              <p className="font-bold">Lý do từ chối từ Quản trị viên:</p>
              <p className="mt-1 text-rose-800 leading-relaxed">{initialTour.rejectionReason}</p>
              <p className="mt-2 text-[11px] text-rose-700">
                Vui lòng chỉnh sửa các thông tin chưa đạt yêu cầu và gửi lại để được xét duyệt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real Mode Pending Backend Integration Banner */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0">
              pending_actions
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Tính năng cập nhật gói tour đang chờ kết nối máy chủ
              </h3>
              <p className="mt-1 leading-relaxed text-amber-900">
                Các quy tắc kiểm tra (sức chứa không được giảm dưới số chỗ đã bán BR-61, phân tách trạng thái sửa theo BR-103) đã sẵn sàng. Dữ liệu chưa lưu vào máy chủ.
              </p>
            </div>
          </div>
        </div>
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
              <h3 className="text-base font-extrabold text-[#00152A]">Thông tin có thể chỉnh sửa</h3>
              {isApproved && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  Sẽ tạo v{initialTour.version + 1}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="field-title" className="block text-xs font-bold text-[#00152A]">
                  Tên gói tour
                </label>
                <input
                  id="field-title"
                  type="text"
                  disabled={isPending}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500"
                />
                {errors.title && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="field-basePrice" className="block text-xs font-bold text-[#00152A]">
                    Giá người lớn (VNĐ)
                  </label>
                  <input
                    id="field-basePrice"
                    type="number"
                    disabled={isPending}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 font-mono focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                  />
                  {basePrice !== initialTour.basePrice && (
                    <span className="mt-1 inline-block text-[11px] font-semibold text-blue-600">
                      Gốc: {initialTour.basePrice.toLocaleString()} đ
                    </span>
                  )}
                  {errors.basePrice && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.basePrice}</p>}
                </div>

                <div>
                  <label htmlFor="field-childPrice" className="block text-xs font-bold text-[#00152A]">
                    Giá trẻ em (VNĐ)
                  </label>
                  <input
                    id="field-childPrice"
                    type="number"
                    disabled={isPending}
                    value={childPrice ?? ''}
                    onChange={(e) => setChildPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 font-mono focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="field-maxCapacity" className="block text-xs font-bold text-[#00152A]">
                    Sức chứa tối đa
                  </label>
                  <input
                    id="field-maxCapacity"
                    type="number"
                    disabled={isPending}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                  />
                  {errors.maxCapacity && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.maxCapacity}</p>}
                </div>

                <div>
                  <label htmlFor="field-duration" className="block text-xs font-bold text-[#00152A]">
                    Thời lượng (ngày)
                  </label>
                  <input
                    id="field-duration"
                    type="number"
                    min="1"
                    disabled={isPending}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                  />
                  {errors.durationDays && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.durationDays}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-destination" className="block text-xs font-bold text-[#00152A]">
                    Điểm đến
                  </label>
                  <input
                    id="field-destination"
                    type="text"
                    disabled={isPending}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                  />
                  {errors.destination && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.destination}</p>}
                </div>

                <div>
                  <label htmlFor="field-category" className="block text-xs font-bold text-[#00152A]">
                    Danh mục tour
                  </label>
                  <select
                    id="field-category"
                    disabled={isPending}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
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
                  Mô tả gói tour
                </label>
                <textarea
                  id="field-description"
                  rows={4}
                  disabled={isPending}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                />
                {errors.description && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-inclusions" className="block text-xs font-bold text-[#00152A]">
                    Dịch vụ bao gồm
                  </label>
                  <textarea
                    id="field-inclusions"
                    rows={3}
                    disabled={isPending}
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="field-exclusions" className="block text-xs font-bold text-[#00152A]">
                    Dịch vụ không bao gồm
                  </label>
                  <textarea
                    id="field-exclusions"
                    rows={3}
                    disabled={isPending}
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="field-policy" className="block text-xs font-bold text-[#00152A]">
                  Chính sách hủy tour
                </label>
                <input
                  id="field-policy"
                  type="text"
                  disabled={isPending}
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50"
                />
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
                <h3 className="text-base font-extrabold text-[#00152A]">Lịch trình & Điểm dừng</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Xem và điều chỉnh các điểm dừng trong chương trình tour.
                </p>
              </div>
              {!isPending && (
                <button
                  type="button"
                  onClick={() => handleAddActivity(0)}
                  className="flex items-center gap-1 text-xs font-bold text-[#006B5F] hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Thêm điểm dừng
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {itinerary.map((day, dIdx) => (
                <div key={day.dayNo} className="overflow-x-auto">
                  <p className="text-xs font-bold text-slate-700 pb-2">Ngày {day.dayNo}</p>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 w-12">#</th>
                        <th className="pb-2">Điểm dừng</th>
                        <th className="pb-2 w-28">Thời gian</th>
                        <th className="pb-2 w-24">Phương tiện</th>
                        {!isPending && <th className="pb-2 text-right w-12">Xóa</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {day.activities.map((act, aIdx) => (
                        <tr key={act.id}>
                          <td className="py-2.5 font-bold text-slate-600">{aIdx + 1}</td>
                          <td className="py-2.5 font-medium text-slate-900">
                            {isPending ? (
                              act.poiName
                            ) : (
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
                            )}
                          </td>
                          <td className="py-2.5 text-slate-600">
                            {act.time} · {act.stayDurationMinutes}p
                          </td>
                          <td className="py-2.5 text-slate-600">{act.transport}</td>
                          {!isPending && (
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveActivity(dIdx, aIdx)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar Column (1/3) */}
        <div className="space-y-6">
          {/* Card: Departure Schedules with Sold Slots (BR-61) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Lịch khởi hành & Chỗ đã bán
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Quy tắc <strong>BR-61</strong>: Sức chứa không được giảm xuống dưới số chỗ đã bán.
            </p>

            {errors.schedules && (
              <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
                {errors.schedules}
              </p>
            )}

            <div className="mt-3 space-y-3">
              {schedules.map((sch, sIdx) => (
                <div key={sch.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Khởi hành {sch.departureDate}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Đã bán: {sch.reservedCapacity}
                    </span>
                  </div>
                  <div>
                    <label htmlFor={`sch-cap-${sch.id}`} className="text-[11px] text-slate-600 font-semibold">
                      Sức chứa tổng cộng (Tối thiểu {sch.reservedCapacity})
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
                </div>
              ))}
            </div>
          </section>

          {/* Card: Version History (Screen #42) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Lịch sử phiên bản
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">v{initialTour.version} · {initialTour.status}</p>
                  <p className="text-[10px] text-slate-500">Phiên bản hiện hành</p>
                </div>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  Hiện tại
                </span>
              </div>
              {initialTour.version > 1 && (
                <div className="flex items-center justify-between rounded-xl p-2.5 border border-slate-100 text-slate-600">
                  <div>
                    <p className="font-medium">v1 · Đã duyệt</p>
                    <p className="text-[10px] text-slate-400">Đã lưu trữ</p>
                  </div>
                  <span className="text-[11px] text-[#006B5F] font-bold">Xem lại</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Quay lại
        </Link>
        {!isPending && (
          <>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={submitting}
              className="rounded-xl border border-[#006B5F] bg-white px-5 py-2.5 text-xs font-bold text-[#006B5F] hover:bg-[#006B5F]/5 transition disabled:opacity-50"
            >
              Lưu thay đổi (UC-36)
            </button>
            {(initialTour.status === 'Draft' || initialTour.status === 'Rejected') && (
              <button
                type="button"
                onClick={() => router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(initialTour.id), isDemo))}
                disabled={submitting}
                className="rounded-xl bg-[#006B5F] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50"
              >
                Gửi xét duyệt (UC-37)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

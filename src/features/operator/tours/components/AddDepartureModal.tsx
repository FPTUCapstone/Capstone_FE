'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  addOperatorTourDeparture,
  OperatorTourApiError,
  OperatorTourValidationError,
} from '../services/operatorTourService';
import type { TourDepartureSchedule, TourPackageDto } from '../types/tourLifecycle';
import { DepartureTermsFields } from './TourExtraFields';

interface AddDepartureModalProps {
  open: boolean;
  tour: TourPackageDto;
  isDemo?: boolean;
  onClose: () => void;
  onSuccess: (updatedTour: TourPackageDto, message: string) => void;
}

function addDaysYmd(ymd: string, days: number): string {
  const base = Date.parse(`${ymd}T00:00:00Z`);
  if (!Number.isFinite(base)) return ymd;
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

function todayVietnamYmd(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

export function AddDepartureModal({ open, ...props }: AddDepartureModalProps) {
  if (!open) return null;
  return <AddDepartureModalContent {...props} />;
}

function AddDepartureModalContent({
  tour,
  isDemo = false,
  onClose,
  onSuccess,
}: Omit<AddDepartureModalProps, 'open'>) {
  const today = todayVietnamYmd();
  const minFuture = addDaysYmd(today, 7);

  // DH-10: Prefill from non-cancelled schedules (latest active departure for defaults)
  const lastActiveSchedule = useMemo(() => {
    const active = tour.schedules.filter((s) => s.status !== 'Cancelled');
    if (active.length === 0) return null;
    return [...active].sort((a, b) => a.departureDate < b.departureDate ? 1 : -1)[0];
  }, [tour.schedules]);

  const latestDeparture = useMemo(() => {
    const activeDates = tour.schedules
      .filter((s) => s.status !== 'Cancelled')
      .map((s) => s.departureDate)
      .filter(Boolean)
      .sort();
    return activeDates.length > 0 ? activeDates[activeDates.length - 1] : '';
  }, [tour.schedules]);

  const initialDeparture =
    latestDeparture && addDaysYmd(latestDeparture, 1) > minFuture
      ? addDaysYmd(latestDeparture, 1)
      : minFuture;

  const lastMeetingPoint =
    [...tour.schedules].reverse().find((s) => s.meetingPoint?.trim())?.meetingPoint ?? '';

  const [schedule, setSchedule] = useState<TourDepartureSchedule>(() => ({
    id: 'new-departure',
    departureDate: initialDeparture,
    returnDate: addDaysYmd(initialDeparture, Math.max(0, tour.durationDays - 1)),
    // DH-10: prefill capacity & prices from latest active schedule when available
    totalCapacity: lastActiveSchedule?.totalCapacity ?? (tour.maxCapacity > 0 ? tour.maxCapacity : 20),
    reservedCapacity: 0,
    minimumCapacity: lastActiveSchedule?.minimumCapacity ?? 1,
    adultPrice: lastActiveSchedule?.adultPrice ?? tour.basePrice,
    childPrice: lastActiveSchedule?.childPrice ?? (tour.childPrice ?? null),
    infantPrice: lastActiveSchedule?.infantPrice ?? null,
    registrationDeadlineDate:
      addDaysYmd(initialDeparture, -2) >= addDaysYmd(today, 1) ? addDaysYmd(initialDeparture, -2) : addDaysYmd(today, 1),
    meetingPoint: lastMeetingPoint,
    meetingLatitude: null,
    meetingLongitude: null,
    status: 'Scheduled',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const patchSchedule = (patch: Partial<TourDepartureSchedule>) => {
    setSchedule((prev) => {
      const next = { ...prev, ...patch };
      if (patch.departureDate !== undefined) {
        const minReturn = addDaysYmd(patch.departureDate, Math.max(0, tour.durationDays - 1));
        if (!patch.returnDate || next.returnDate < minReturn) {
          next.returnDate = minReturn;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const fingerprint = JSON.stringify({
      tourId: tour.id,
      departureDate: schedule.departureDate,
      returnDate: schedule.returnDate,
      totalCapacity: schedule.totalCapacity,
      minimumCapacity: schedule.minimumCapacity,
      adultPrice: schedule.adultPrice,
      childPrice: schedule.childPrice,
      infantPrice: schedule.infantPrice,
      registrationDeadlineDate: schedule.registrationDeadlineDate,
      meetingPoint: schedule.meetingPoint,
      meetingLatitude: schedule.meetingLatitude,
      meetingLongitude: schedule.meetingLongitude,
    });
    if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
      idempotencyRef.current = { fingerprint, key: crypto.randomUUID() };
    }

    setSubmitting(true);
    try {
      const res = await addOperatorTourDeparture(tour.id, schedule, {
        allowDemo: isDemo,
        currentTour: tour,
        idempotencyKey: idempotencyRef.current.key,
      });
      if (res.status === 'SUCCESS' && res.data) {
        onSuccess(res.data, res.message || 'Đã mở bán đợt khởi hành mới thành công.');
        onClose();
      } else {
        setError(res.message || 'Không thể mở bán đợt khởi hành mới.');
      }
    } catch (err) {
      if (err instanceof OperatorTourApiError && err.code === 'operator_tour.departure_itinerary_mismatch') {
        setError('Lịch trình tour cũ thiếu giờ dự kiến cho một hoặc nhiều điểm dừng. Hãy tạo phiên bản nháp mới, bổ sung giờ và gửi duyệt lại trước khi mở bán ngày đi mới.');
      } else if (err instanceof OperatorTourValidationError) {
        setError(err.errors.schedules || err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Không thể mở bán đợt khởi hành mới.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-departure-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 id="add-departure-modal-title" className="text-lg font-extrabold text-[#1C2928]">
              Mở bán đợt khởi hành mới
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Thêm ngày khởi hành mới cho tour đang hoạt động mà không tạo phiên bản nháp mới và không ảnh hưởng các đơn đặt lịch sử.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="add-dep-start" className="text-xs font-bold text-[#1C2928]">
                Ngày khởi hành <span className="text-rose-500">*</span>
              </label>
              <input
                id="add-dep-start"
                type="date"
                min={addDaysYmd(today, 1)}
                required
                value={schedule.departureDate}
                onChange={(e) => patchSchedule({ departureDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="add-dep-end" className="text-xs font-bold text-[#1C2928]">
                Ngày về <span className="text-rose-500">*</span>
              </label>
              <input
                id="add-dep-end"
                type="date"
                min={schedule.departureDate}
                required
                value={schedule.returnDate}
                onChange={(e) => patchSchedule({ returnDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="add-dep-cap" className="text-xs font-bold text-[#1C2928]">
                Sức chứa (chỗ) <span className="text-rose-500">*</span>
              </label>
              <input
                id="add-dep-cap"
                type="number"
                min={1}
                required
                value={schedule.totalCapacity}
                onChange={(e) => patchSchedule({ totalCapacity: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <DepartureTermsFields
            schedule={schedule}
            onChange={patchSchedule}
            showCoordinates
          />

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#174B4A] px-5 py-2 text-xs font-bold text-white hover:bg-[#103B39] disabled:opacity-50"
            >
              {submitting ? 'Đang mở bán…' : 'Xác nhận mở bán đợt mới'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

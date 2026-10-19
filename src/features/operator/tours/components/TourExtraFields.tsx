'use client';

import React from 'react';
import { REVIEW_BLOCKER_MESSAGES, TOUR_WARNING_MESSAGES } from '../services/operatorTourService';
import type { TourDepartureSchedule, TourWarning } from '../types/tourLifecycle';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50';

interface TourTermsFieldsProps {
  highlights: string;
  travellerRequirements: string;
  onHighlights: (value: string) => void;
  onTravellerRequirements: (value: string) => void;
  disabled?: boolean;
}

/** Optional package terms that the backend stores with the package (spec Amendment B). */
export function TourTermsFields(props: TourTermsFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="field-highlights" className="block text-xs font-bold text-[#00152A]">Điểm nổi bật</label>
        <textarea
          id="field-highlights"
          rows={2}
          disabled={props.disabled}
          value={props.highlights}
          onChange={(event) => props.onHighlights(event.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="field-requirements" className="block text-xs font-bold text-[#00152A]">Yêu cầu đối với du khách</label>
        <textarea
          id="field-requirements"
          rows={2}
          disabled={props.disabled}
          value={props.travellerRequirements}
          onChange={(event) => props.onTravellerRequirements(event.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}

const toNumberOrNull = (value: string): number | null => (value.trim() === '' ? null : Number(value));

interface DepartureTermsFieldsProps {
  schedule: TourDepartureSchedule;
  onChange: (patch: Partial<TourDepartureSchedule>) => void;
  disabled?: boolean;
}

/** Per-departure selling terms: minimum pax, prices and registration deadline (real mode). */
export function DepartureTermsFields({ schedule, onChange, disabled = false }: DepartureTermsFieldsProps) {
  const id = schedule.id;
  const field = 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs disabled:bg-slate-50';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
      <div>
        <label htmlFor={`sch-min-${id}`} className="text-[11px] font-semibold text-slate-600">Số khách tối thiểu</label>
        <input
          id={`sch-min-${id}`}
          type="number"
          min={1}
          disabled={disabled}
          value={schedule.minimumCapacity ?? 1}
          onChange={(event) => onChange({ minimumCapacity: Number(event.target.value) })}
          className={field}
        />
      </div>
      <div>
        <label htmlFor={`sch-deadline-${id}`} className="text-[11px] font-semibold text-slate-600">Hạn đăng ký</label>
        <input
          id={`sch-deadline-${id}`}
          type="date"
          disabled={disabled}
          value={schedule.registrationDeadlineDate ?? ''}
          onChange={(event) => onChange({ registrationDeadlineDate: event.target.value })}
          className={field}
        />
      </div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-slate-600 hover:text-[#006B5F]">
          Thiết lập giá riêng cho lịch này
        </summary>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label htmlFor={`sch-adult-${id}`} className="text-[11px] font-semibold text-slate-600">Giá chuyến này: người lớn (VND)</label>
            <input
              id={`sch-adult-${id}`}
              type="number"
              min={1}
              disabled={disabled}
              value={schedule.adultPrice ?? ''}
              onChange={(event) => onChange({ adultPrice: event.target.value === '' ? undefined : Number(event.target.value) })}
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`sch-child-${id}`} className="text-[11px] font-semibold text-slate-600">Giá chuyến này: trẻ em (VND)</label>
            <input
              id={`sch-child-${id}`}
              type="number"
              min={0}
              disabled={disabled}
              value={schedule.childPrice ?? ''}
              onChange={(event) => onChange({ childPrice: toNumberOrNull(event.target.value) })}
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`sch-infant-${id}`} className="text-[11px] font-semibold text-slate-600">Giá chuyến này: em bé (VND)</label>
            <input
              id={`sch-infant-${id}`}
              type="number"
              min={0}
              disabled={disabled}
              value={schedule.infantPrice ?? ''}
              onChange={(event) => onChange({ infantPrice: toNumberOrNull(event.target.value) })}
              className={field}
            />
          </div>
        </div>
      </details>
    </div>
  );
}

interface TourReadinessPanelProps {
  blockers?: string[];
  warnings?: TourWarning[];
}

/** Server-reported review blockers and non-blocking itinerary warnings. */
export function TourReadinessPanel({ blockers, warnings }: TourReadinessPanelProps) {
  const hasBlockers = (blockers?.length ?? 0) > 0;
  const hasWarnings = (warnings?.length ?? 0) > 0;
  if (!hasBlockers && !hasWarnings) return null;
  return (
    <div className="space-y-3">
      {hasBlockers && (
        <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
          <p className="font-bold">Cần hoàn thành trước khi gửi xét duyệt:</p>
          <ul className="mt-1 list-disc pl-5">
            {blockers!.map((code) => (
              <li key={code}>{REVIEW_BLOCKER_MESSAGES[code] ?? code}</li>
            ))}
          </ul>
        </div>
      )}
      {hasWarnings && (
        <div role="status" className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-950">
          <p className="font-bold">Cảnh báo lịch trình (không chặn việc lưu bản nháp):</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings!.map((warning, index) => (
              <li key={`${warning.code}-${warning.dayNo}-${warning.sequenceNo}-${index}`}>
                {warning.dayNo ? `Ngày ${warning.dayNo}` : ''}
                {warning.sequenceNo ? `, điểm dừng ${warning.sequenceNo}: ` : warning.dayNo ? ': ' : ''}
                {TOUR_WARNING_MESSAGES[warning.code] ?? warning.code}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

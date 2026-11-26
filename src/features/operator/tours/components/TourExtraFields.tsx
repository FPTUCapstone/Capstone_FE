'use client';

import React from 'react';
import { REVIEW_BLOCKER_MESSAGES, TOUR_WARNING_MESSAGES } from '../services/operatorTourService';
import type { TourDepartureSchedule, TourWarning } from '../types/tourLifecycle';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50';

interface TourTermsFieldsProps {
  highlights: string;
  travellerRequirements: string;
  onHighlights: (value: string) => void;
  onTravellerRequirements: (value: string) => void;
  disabled?: boolean;
  highlightsError?: string;
  travellerRequirementsError?: string;
}

/** Optional package terms that the backend stores with the package (spec Amendment B). */
export function TourTermsFields(props: TourTermsFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="field-highlights" className="block text-xs font-bold text-[#1C2928]">Điểm nổi bật</label>
        <textarea
          id="field-highlights"
          rows={2}
          disabled={props.disabled}
          value={props.highlights}
          onChange={(event) => props.onHighlights(event.target.value)}
          className={inputClass}
        />
        {props.highlightsError && (
          <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{props.highlightsError}</p>
        )}
      </div>
      <div>
        <label htmlFor="field-requirements" className="block text-xs font-bold text-[#1C2928]">Yêu cầu đối với du khách</label>
        <textarea
          id="field-requirements"
          rows={2}
          disabled={props.disabled}
          value={props.travellerRequirements}
          onChange={(event) => props.onTravellerRequirements(event.target.value)}
          className={inputClass}
        />
        {props.travellerRequirementsError && (
          <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{props.travellerRequirementsError}</p>
        )}
      </div>
    </div>
  );
}

const toNumberOrNull = (value: string): number | null => (value.trim() === '' ? null : Number(value));

const formatVndHint = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? `${value.toLocaleString('vi-VN')} đ`
    : null;

interface DepartureTermsFieldsProps {
  schedule: TourDepartureSchedule;
  onChange: (patch: Partial<TourDepartureSchedule>) => void;
  disabled?: boolean;
  showCoordinates?: boolean;
}

/** Per-departure selling terms: minimum pax, meeting point, optional coordinates, prices and registration deadline. */
export function DepartureTermsFields({
  schedule,
  onChange,
  disabled = false,
  showCoordinates = false,
}: DepartureTermsFieldsProps) {
  const id = schedule.id;
  const field = 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs disabled:bg-slate-50';
  const adultHint = formatVndHint(schedule.adultPrice);
  const childHint = formatVndHint(schedule.childPrice);
  const infantHint = formatVndHint(schedule.infantPrice);
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`sch-meeting-${id}`} className="text-[11px] font-semibold text-slate-600">
          Điểm tập trung / Đón khách
        </label>
        <input
          id={`sch-meeting-${id}`}
          type="text"
          disabled={disabled}
          value={schedule.meetingPoint ?? ''}
          onChange={(event) => onChange({ meetingPoint: event.target.value })}
          placeholder="Ví dụ: Cổng chính Sân bay Đà Nẵng hoặc sảnh khách sạn"
          className={field}
        />
      </div>
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
      {showCoordinates && (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-slate-600 hover:text-[#174B4A]">
            Tọa độ điểm tập trung (tùy chọn)
          </summary>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor={`sch-lat-${id}`} className="text-[11px] font-semibold text-slate-600">Vĩ độ (Latitude)</label>
              <input
                id={`sch-lat-${id}`}
                type="number"
                step="0.000001"
                min={-90}
                max={90}
                disabled={disabled}
                value={schedule.meetingLatitude ?? ''}
                onChange={(event) => onChange({ meetingLatitude: toNumberOrNull(event.target.value) })}
                placeholder="16.054407"
                className={field}
              />
            </div>
            <div>
              <label htmlFor={`sch-lng-${id}`} className="text-[11px] font-semibold text-slate-600">Kinh độ (Longitude)</label>
              <input
                id={`sch-lng-${id}`}
                type="number"
                step="0.000001"
                min={-180}
                max={180}
                disabled={disabled}
                value={schedule.meetingLongitude ?? ''}
                onChange={(event) => onChange({ meetingLongitude: toNumberOrNull(event.target.value) })}
                placeholder="108.202167"
                className={field}
              />
            </div>
          </div>
        </details>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-slate-600 hover:text-[#174B4A]">
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
            {adultHint && <p className="mt-0.5 text-[10px] font-medium text-slate-500">{adultHint}</p>}
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
            {childHint && <p className="mt-0.5 text-[10px] font-medium text-slate-500">{childHint}</p>}
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
            {infantHint && <p className="mt-0.5 text-[10px] font-medium text-slate-500">{infantHint}</p>}
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

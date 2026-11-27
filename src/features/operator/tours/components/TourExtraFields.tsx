'use client';

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { REVIEW_BLOCKER_MESSAGES, TOUR_WARNING_MESSAGES } from '../services/operatorTourService';
import type { TourDepartureSchedule, TourWarning } from '../types/tourLifecycle';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50';

export const TRAVELLER_PACKING_TAGS = [
  'Giày thể thao',
  'Đồ bơi & khăn tắm',
  'Áo mưa / Dù che nắng',
  'Áo khoác gió',
  'Thuốc say xe / cá nhân',
  'CCCD / Hộ chiếu',
] as const;

const DEPOSIT_PERCENT_PRESETS = [
  { value: 30, hint: '30% · Nội địa' },
  { value: 50, hint: '50% · Lễ Tết / Vé bay' },
  { value: 70, hint: '70% · Quốc tế' },
] as const;

const BALANCE_DUE_DAY_PRESETS = [
  { value: 5, hint: '5 ngày' },
  { value: 7, hint: '7 ngày' },
  { value: 14, hint: '14 ngày' },
  { value: 30, hint: '30 ngày' },
] as const;

function hasChecklistItem(text: string, label: string): boolean {
  return text
    .split(/\r?\n/)
    .some((line) => line.trim().replace(/^[-•*]\s*/, '').toLowerCase() === label.toLowerCase());
}

function toggleChecklistItem(text: string, label: string): string {
  const lines = text.split(/\r?\n/);
  const existingIdx = lines.findIndex(
    (line) => line.trim().replace(/^[-•*]\s*/, '').toLowerCase() === label.toLowerCase(),
  );
  if (existingIdx >= 0) {
    return lines
      .filter((_, index) => index !== existingIdx)
      .join('\n')
      .replace(/^\n+|\n+$/g, '');
  }
  const trimmed = text.replace(/\s+$/, '');
  const entry = `- ${label}`;
  return trimmed ? `${trimmed}\n${entry}` : entry;
}

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
          placeholder="Những trải nghiệm đặc sắc nhất trong chuyến đi..."
          className={inputClass}
        />
        {props.highlightsError && (
          <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{props.highlightsError}</p>
        )}
      </div>
      <div>
        <label htmlFor="field-requirements" className="block text-xs font-bold text-[#1C2928]">
          Lưu ý chuẩn bị &amp; Yêu cầu đối với du khách
        </label>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Bấm nhanh các gợi ý bên dưới để chèn thành danh sách đồ dùng/trang phục cho du khách dễ đọc:
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Gợi ý chuẩn bị hành lý nhanh">
          {TRAVELLER_PACKING_TAGS.map((tag) => {
            const active = hasChecklistItem(props.travellerRequirements, tag);
            return (
              <button
                key={tag}
                type="button"
                disabled={props.disabled}
                aria-pressed={active}
                onClick={() => props.onTravellerRequirements(toggleChecklistItem(props.travellerRequirements, tag))}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                  active
                    ? 'border-[#174B4A] bg-teal-50 text-[#103B39]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span aria-hidden="true">{active ? '✓' : '+'}</span>
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
        <textarea
          id="field-requirements"
          rows={4}
          disabled={props.disabled}
          value={props.travellerRequirements}
          onChange={(event) => props.onTravellerRequirements(event.target.value)}
          placeholder="VD:&#10;- Giày thể thao để đi bộ đường núi&#10;- Đồ bơi & khăn tắm khi ra đảo&#10;- Áo mưa mỏng hoặc dù che nắng"
          className={inputClass}
        />
        {props.travellerRequirementsError && (
          <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{props.travellerRequirementsError}</p>
        )}
      </div>
    </div>
  );
}

interface TourDepositFieldsProps {
  allowDeposit: boolean;
  depositPercent: number | null | undefined;
  balanceDueDaysBeforeDeparture: number | null | undefined;
  basePrice: number;
  onChange: (patch: {
    allowDeposit?: boolean;
    depositPercent?: number | null;
    balanceDueDaysBeforeDeparture?: number | null;
  }) => void;
  disabled?: boolean;
  depositPercentError?: string;
  balanceDueDaysError?: string;
}

/** Payment & deposit configuration modeled after commercial tour contracts. */
export function TourDepositFields({
  allowDeposit,
  depositPercent,
  balanceDueDaysBeforeDeparture,
  basePrice,
  onChange,
  disabled = false,
  depositPercentError,
  balanceDueDaysError,
}: TourDepositFieldsProps) {
  const effectivePercent = depositPercent ?? 30;
  const effectiveDueDays = balanceDueDaysBeforeDeparture ?? 7;
  const sampleBase = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : 0;
  const sampleDeposit = Math.round((sampleBase * effectivePercent) / 100);
  const sampleRemaining = Math.max(0, sampleBase - sampleDeposit);

  return (
    <div id="field-deposit" className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-[#1C2928]">Cài đặt thanh toán &amp; đặt cọc giữ chỗ</p>
          <p className="text-[11px] text-slate-500">
            Tour ngắn ngày thường thu 100%. Tour dài ngày hoặc có vé máy bay/khách sạn ứng trước có thể cho khách đặt cọc trước.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={!allowDeposit}
          onClick={() =>
            onChange({
              allowDeposit: false,
              depositPercent: null,
              balanceDueDaysBeforeDeparture: null,
            })
          }
          className={`rounded-xl border p-3 text-left text-xs transition disabled:opacity-60 ${
            !allowDeposit
              ? 'border-[#174B4A] bg-white ring-2 ring-[#174B4A]/20'
              : 'border-slate-200 bg-white/70 hover:bg-white'
          }`}
        >
          <p className="font-bold text-[#1C2928]">Thu 100% khi đặt chỗ</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Khách thanh toán toàn bộ giá trị đơn ngay lúc đặt tour.</p>
        </button>

        <button
          type="button"
          disabled={disabled}
          aria-pressed={allowDeposit}
          onClick={() =>
            onChange({
              allowDeposit: true,
              depositPercent: depositPercent ?? 30,
              balanceDueDaysBeforeDeparture: balanceDueDaysBeforeDeparture ?? 7,
            })
          }
          className={`rounded-xl border p-3 text-left text-xs transition disabled:opacity-60 ${
            allowDeposit
              ? 'border-[#174B4A] bg-white ring-2 ring-[#174B4A]/20'
              : 'border-slate-200 bg-white/70 hover:bg-white'
          }`}
        >
          <p className="font-bold text-[#1C2928]">Cho phép đặt cọc giữ chỗ</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Thu cọc theo % khi đặt và tất toán phần còn lại trước ngày khởi hành.</p>
        </button>
      </div>

      {allowDeposit && (
        <div className="space-y-4 rounded-xl border border-teal-200/80 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="field-deposit-percent" className="block text-xs font-bold text-[#1C2928]">
                Tỉ lệ đặt cọc (%) <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DEPOSIT_PERCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ depositPercent: preset.value })}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                      depositPercent === preset.value
                        ? 'border-[#174B4A] bg-teal-50 text-[#103B39]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.hint}
                  </button>
                ))}
              </div>
              <input
                id="field-deposit-percent"
                type="number"
                min={10}
                max={90}
                step={5}
                disabled={disabled}
                value={depositPercent ?? ''}
                onChange={(event) => {
                  const raw = event.target.value;
                  onChange({ depositPercent: raw === '' ? null : Number(raw) });
                }}
                className={`mt-2 h-10 w-full rounded-lg border px-3 text-xs font-mono text-slate-900 disabled:bg-slate-50 ${
                  depositPercentError ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              {depositPercentError && (
                <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{depositPercentError}</p>
              )}
            </div>

            <div>
              <label htmlFor="field-balance-due-days" className="block text-xs font-bold text-[#1C2928]">
                Hạn tất toán trước khởi hành (ngày) <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BALANCE_DUE_DAY_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ balanceDueDaysBeforeDeparture: preset.value })}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                      balanceDueDaysBeforeDeparture === preset.value
                        ? 'border-[#174B4A] bg-teal-50 text-[#103B39]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.hint}
                  </button>
                ))}
              </div>
              <input
                id="field-balance-due-days"
                type="number"
                min={4}
                max={180}
                step={1}
                disabled={disabled}
                value={balanceDueDaysBeforeDeparture ?? ''}
                onChange={(event) => {
                  const raw = event.target.value;
                  onChange({ balanceDueDaysBeforeDeparture: raw === '' ? null : Number(raw) });
                }}
                className={`mt-2 h-10 w-full rounded-lg border px-3 text-xs font-mono text-slate-900 disabled:bg-slate-50 ${
                  balanceDueDaysError ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Tối thiểu 4 ngày trước khởi hành để hoàn tất trước mốc khóa 72 giờ (BR-154).
              </p>
              {balanceDueDaysError && (
                <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{balanceDueDaysError}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3 text-[11px] leading-relaxed text-[#103B39]">
            <p className="font-bold">Tóm tắt quy tắc hiển thị trên hợp đồng &amp; trang tour:</p>
            <p className="mt-1">
              • Khi đăng ký sớm: khách cọc <strong>{effectivePercent}%</strong>
              {sampleBase > 0 ? ` (tạm tính ${sampleDeposit.toLocaleString('vi-VN')} đ/khách)` : ''} để giữ chỗ, và tất toán phần còn lại{' '}
              <strong>{100 - effectivePercent}%</strong>
              {sampleBase > 0 ? ` (${sampleRemaining.toLocaleString('vi-VN')} đ/khách)` : ''} chậm nhất trước ngày khởi hành{' '}
              <strong>{effectiveDueDays} ngày</strong>.
            </p>
            <p className="mt-0.5">
              • Nếu khách đặt muộn hơn mốc {effectiveDueDays} ngày trước khởi hành (gần hạn đăng ký): hệ thống áp dụng thanh toán 100% thay vì đặt cọc.
            </p>
          </div>
        </div>
      )}
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
              <li key={code}>{REVIEW_BLOCKER_MESSAGES[code] ?? code}{code === 'payment_channel_not_ready' && <>. <Link href={ROUTES.partner.paymentSettings} className="inline-flex min-h-11 items-center font-semibold underline focus-visible:outline-2">Kết nối payOS</Link></>}</li>
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

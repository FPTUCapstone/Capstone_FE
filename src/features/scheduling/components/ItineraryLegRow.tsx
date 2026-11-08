'use client';

import {
  LEG_TRANSPORT_MODES,
  LegTransportMode,
  TransportMode,
} from '../types/schedulingTypes';
import {
  formatLegDistance,
  formatLegDuration,
  LEG_MODE_LABELS,
  walkHint,
} from '../utils/itineraryPresentation';
import { PopoverMenu } from './PopoverMenu';

interface ItineraryLegRowProps {
  /** Name of the stop this leg starts from (accessible label of the leg button). */
  fromName?: string;
  /** Name of the stop this leg leads to (accessible label of [Đổi] and of the leg button). */
  toName: string;
  minutes: number;
  meters: number | null | undefined;
  mode: TransportMode | null | undefined;
  /** Shown only when the leg can be edited (owner, not navigating, previous item is a visit). */
  onChangeMode?: (mode: LegTransportMode) => void;
  disabled?: boolean;
  showWalkHint?: boolean;
  /** The map can show this leg: the pill becomes a button that selects it. */
  onSelect?: () => void;
  selected?: boolean;
}

const PILL_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-medium shadow-2xs';

/** "9,4 km · khoảng 22 phút · 🛵 Xe máy [Đổi]" (Review 2, D5). */
export function ItineraryLegRow({
  fromName,
  toName,
  minutes,
  meters,
  mode,
  onChangeMode,
  disabled = false,
  showWalkHint = true,
  onSelect,
  selected = false,
}: ItineraryLegRowProps) {
  const distance = formatLegDistance(meters);
  const hint = showWalkHint ? walkHint(meters, mode) : null;
  const parts = [distance, formatLegDuration(minutes), mode ? LEG_MODE_LABELS[mode] : null].filter(
    (part): part is string => Boolean(part),
  );

  const pillContent = (
    <>
      <span className="material-symbols-outlined text-sm text-[#103B39]" aria-hidden="true">
        route
      </span>
      <span>{parts.join(' · ')}</span>
    </>
  );

  return (
    <div className="mb-4 ml-10 sm:ml-12" data-testid="leg-row">
      <div className="relative inline-flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            aria-label={`Xem trên bản đồ đoạn từ ${fromName ?? 'điểm trước'} đến ${toName} (${parts.join(', ')})`}
            className={`${PILL_CLASS} cursor-pointer transition hover:border-[#103B39]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#103B39] focus-visible:ring-offset-1 ${
              selected ? 'border-[#B96D4C] bg-orange-50 text-slate-900' : 'border-slate-200 bg-white'
            }`}
          >
            {pillContent}
          </button>
        ) : (
          <span className={`${PILL_CLASS} border-slate-200 bg-white`}>{pillContent}</span>
        )}
        {onChangeMode && (
          <PopoverMenu
            triggerLabel={`Đổi phương tiện đến ${toName}`}
            triggerContent="Đổi"
            triggerDisabled={disabled}
            triggerClassName="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-[#103B39] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
            menuLabel="Chọn phương tiện cho chặng này"
            itemRole="menuitemradio"
            items={LEG_TRANSPORT_MODES.map((option) => ({
              key: option,
              label: LEG_MODE_LABELS[option],
              checked: option === mode,
              onSelect: () => {
                if (option !== mode) onChangeMode(option);
              },
            }))}
          />
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

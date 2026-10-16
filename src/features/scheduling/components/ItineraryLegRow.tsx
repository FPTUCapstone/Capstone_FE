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
  /** Name of the stop this leg leads to (accessible label of [Đổi]). */
  toName: string;
  minutes: number;
  meters: number | null | undefined;
  mode: TransportMode | null | undefined;
  /** Shown only when the leg can be edited (owner, not navigating, previous item is a visit). */
  onChangeMode?: (mode: LegTransportMode) => void;
  disabled?: boolean;
  showWalkHint?: boolean;
}

/** "9,4 km · khoảng 22 phút · 🛵 Xe máy [Đổi]" (Review 2, D5). */
export function ItineraryLegRow({
  toName,
  minutes,
  meters,
  mode,
  onChangeMode,
  disabled = false,
  showWalkHint = true,
}: ItineraryLegRowProps) {
  const distance = formatLegDistance(meters);
  const hint = showWalkHint ? walkHint(meters, mode) : null;
  const parts = [distance, formatLegDuration(minutes), mode ? LEG_MODE_LABELS[mode] : null].filter(
    (part): part is string => Boolean(part),
  );

  return (
    <div className="mb-4 ml-10 sm:ml-12" data-testid="leg-row">
      <div className="relative inline-flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11.5px] font-medium shadow-2xs">
          <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
            route
          </span>
          <span>{parts.join(' · ')}</span>
        </span>
        {onChangeMode && (
          <PopoverMenu
            triggerLabel={`Đổi phương tiện đến ${toName}`}
            triggerContent="Đổi"
            triggerDisabled={disabled}
            triggerClassName="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-[#007d6e] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
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

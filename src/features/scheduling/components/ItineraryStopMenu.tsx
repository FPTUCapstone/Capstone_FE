'use client';

import { PopoverMenu } from './PopoverMenu';

export interface StopMenuAction {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface ItineraryStopMenuProps {
  stopName: string;
  actions: StopMenuAction[];
}

/** One "⋯" menu per stop (Review 2, D11-5): Thay địa điểm / Bỏ khỏi lịch / Xem đánh giá. */
export function ItineraryStopMenu({ stopName, actions }: ItineraryStopMenuProps) {
  if (actions.length === 0) return null;

  return (
    <PopoverMenu
      triggerLabel={`Thao tác với ${stopName}`}
      triggerContent="⋯"
      triggerClassName="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-black leading-none text-[#5B6E69] transition hover:bg-[#F7F5EF] hover:text-[#1C2928]"
      menuLabel={`Thao tác với ${stopName}`}
      itemRole="menuitem"
      align="right"
      items={actions.map((action) => ({ key: action.label, ...action }))}
    />
  );
}

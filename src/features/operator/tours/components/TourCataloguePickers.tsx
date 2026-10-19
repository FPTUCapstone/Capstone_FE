'use client';

import React, { useMemo, useState } from 'react';
import type { ApiCategory, ApiDestination, ApiPoi, ApiPolicy } from '../services/operatorTourApi';

const MAX_DESTINATIONS = 10;

interface DestinationCheckboxesProps {
  options: ApiDestination[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  hasError?: boolean;
  /** Id of the visible label element that names this group. */
  labelId: string;
}

/** Destinations are chosen from the server catalogue; the order of selection is the display order. */
export function DestinationCheckboxes({
  options,
  selectedIds,
  onChange,
  disabled = false,
  hasError = false,
  labelId,
}: DestinationCheckboxesProps) {
  const [query, setQuery] = useState('');
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return normalized ? options.filter((option) => option.name.toLocaleLowerCase('vi-VN').includes(normalized)) : options;
  }, [options, query]);
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((value) => value !== id));
    else if (selectedIds.length < MAX_DESTINATIONS) onChange([...selectedIds, id]);
  };

  return (
    <fieldset
      id="field-destination"
      aria-labelledby={labelId}
      disabled={disabled}
      className={`mt-1.5 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-xl border p-2 ${
        hasError ? 'border-rose-400' : 'border-slate-300'
      }`}
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nhập để tìm điểm đến"
        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
      />
      {options.length === 0 && <span className="p-1 text-xs text-slate-500">Chưa có danh mục điểm đến.</span>}
      {options.length > 0 && visibleOptions.length === 0 && <span className="p-1 text-xs text-slate-500">Không tìm thấy điểm đến phù hợp.</span>}
      {visibleOptions.map((option) => (
        <label
          key={option.destinationId}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-800"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(option.destinationId)}
            onChange={() => toggle(option.destinationId)}
          />
          {option.name}
        </label>
      ))}
    </fieldset>
  );
}

export const TRANSPORT_OPTIONS = [
  'Đi bộ', 'Xe đạp', 'Xe máy', 'Ô tô', 'Taxi', 'Xe du lịch', 'Xe buýt',
  'Tàu hỏa', 'Tàu điện', 'Thuyền / ca nô', 'Cáp treo', 'Máy bay', 'Khác',
] as const;

export function TransportSelect({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const values = TRANSPORT_OPTIONS.includes(value as typeof TRANSPORT_OPTIONS[number]) ? TRANSPORT_OPTIONS : [value, ...TRANSPORT_OPTIONS];
  return (
    <select aria-label="Phương tiện di chuyển" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-32 w-full rounded-lg border border-slate-300 px-2.5 text-xs">
      {values.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

interface PoiSelectProps {
  options: ApiPoi[];
  value: number | string | undefined;
  currentName?: string;
  onChange: (poi: { id: number; name: string } | null) => void;
  disabled?: boolean;
}

export function PoiSelect({ options, value, currentName, onChange, disabled = false }: PoiSelectProps) {
  const current = value === undefined || value === '' ? undefined : Number(value);
  const knownCurrent = current !== undefined && options.some((poi) => poi.id === current);
  return (
    <select
      aria-label="Điểm tham quan"
      disabled={disabled}
      value={current ?? ''}
      onChange={(event) => {
        const id = Number(event.target.value);
        const poi = options.find((candidate) => candidate.id === id);
        onChange(poi ? { id: poi.id, name: poi.name } : null);
      }}
      className="h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs"
    >
      <option value="">Chọn POI đã xác minh</option>
      {current !== undefined && !knownCurrent && <option value={current}>{currentName || `POI #${current}`}</option>}
      {options.map((poi) => (
        <option key={poi.id} value={poi.id}>
          {poi.name}{poi.address ? ` — ${poi.address}` : ''}
        </option>
      ))}
    </select>
  );
}

interface CancellationPolicySelectProps {
  options: ApiPolicy[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function CancellationPolicySelect({
  options,
  value,
  onChange,
  disabled = false,
  hasError = false,
}: CancellationPolicySelectProps) {
  return (
    <select
      id="field-cancellation"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`mt-1.5 w-full rounded-xl border p-3 text-xs text-slate-900 sm:text-sm ${
        hasError ? 'border-rose-400' : 'border-slate-300'
      }`}
    >
      <option value="">Chọn chính sách hủy đã phát hành</option>
      {options.map((policy) => (
        <option key={policy.id} value={policy.id}>
          {policy.name}
          {policy.description ? ` — ${policy.description}` : ''}
        </option>
      ))}
    </select>
  );
}

interface CategorySelectProps {
  options: ApiCategory[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Server categories; the value is the category id as a string ('' = none, the backend allows it). */
export function CategorySelect({ options, value, onChange, disabled = false }: CategorySelectProps) {
  return (
    <select
      id="field-category"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#006B5F] focus:outline-hidden disabled:bg-slate-50 sm:text-sm"
    >
      <option value="">Chưa phân loại</option>
      {options.map((category) => (
        <option key={category.categoryId} value={category.categoryId}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

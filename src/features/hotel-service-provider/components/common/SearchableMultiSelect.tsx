'use client';

import React, { useState, useMemo } from 'react';
import type { CommercialPoiItem } from '../../types';

interface SearchableMultiSelectProps {
  pois: CommercialPoiItem[];
  selectedIds: number[];
  onChange: (newSelectedIds: number[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableMultiSelect({
  pois,
  selectedIds,
  onChange,
  label,
  required = false,
  error,
  placeholder = 'Search by POI name, code (e.g. POI-DANANG-0042), or address...',
  disabled = false,
}: SearchableMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPois = useMemo(() => {
    if (!searchTerm.trim()) return pois;
    const term = searchTerm.toLowerCase();
    return pois.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term)
    );
  }, [pois, searchTerm]);

  const toggleSelect = (id: number) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeSelected = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedIds.filter((item) => item !== id));
  };

  const selectedPois = pois.filter((p) => selectedIds.includes(p.id));

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="mb-1 text-xs font-semibold text-[#1C2928] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-[#DC2626] font-bold" aria-hidden="true">*</span>}
          </span>
          <span className="text-[11px] font-normal text-[#5B6E69]">
            {selectedIds.length} property selected
          </span>
        </label>
      )}

      {/* Selected Chips Area */}
      {selectedPois.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-[#F7F5EF] border border-[#DCE2DD] rounded-lg">
          {selectedPois.map((poi) => (
            <span
              key={poi.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white text-[#174B4A] border border-[#B2DFDB] rounded-md shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px] text-[#174B4A]">
                hotel
              </span>
              <span className="truncate max-w-[200px]">{poi.name}</span>
              <span className="text-[10px] text-[#5B6E69] font-mono">({poi.code})</span>
              <button
                type="button"
                onClick={(e) => removeSelected(poi.id, e)}
                aria-label={`Remove ${poi.name}`}
                disabled={disabled}
                className="hover:text-[#DC2626] p-0.5 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px] leading-none">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-2">
        <span
          className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E9E9B]"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#DCE2DD] rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8E9E9B] hover:text-[#1C2928]"
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* POI Scrollable Selection List */}
      <div
        className={`w-full max-h-56 overflow-y-auto bg-white border rounded-lg divide-y divide-[#E8ECE9] ${
          error ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
        }`}
        role="group"
        aria-label="Commercial Points of Interest"
      >
        {filteredPois.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#8E9E9B]">
            No matching commercial lodging POIs found.
          </div>
        ) : (
          filteredPois.map((poi) => {
            const isSelected = selectedIds.includes(poi.id);
            const isInactive = poi.status !== 'Active';
            const isBlocked = isInactive || poi.isLinkedToOtherProvider;

            return (
              <div
                key={poi.id}
                onClick={() => !isBlocked && toggleSelect(poi.id)}
                className={`flex items-start gap-3 p-3 transition-colors ${
                  isBlocked
                    ? 'bg-[#F8FAFC] opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#E8F7F4]/60 cursor-pointer'
                    : 'hover:bg-[#F7F5EF] cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isBlocked || disabled}
                  onChange={() => toggleSelect(poi.id)}
                  className="mt-0.5 h-4 w-4 rounded border-[#DCE2DD] text-[#174B4A] focus:ring-[#174B4A] cursor-pointer"
                  aria-label={`Select ${poi.name}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-[#1C2928] truncate">
                      {poi.name}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-[#5B6E69] bg-[#E8ECE9] px-1.5 py-0.5 rounded">
                      {poi.code}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        poi.status === 'Active'
                          ? 'bg-[#E6F7F0] text-[#065F46]'
                          : 'bg-[#FDECEF] text-[#991B1B]'
                      }`}
                    >
                      {poi.status}
                    </span>
                    {poi.isLinkedToOtherProvider && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FEF3E2] text-[#92400E]">
                        Already Linked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5B6E69] truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-[#8E9E9B]">
                      location_on
                    </span>
                    {poi.address}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <span className="mt-1 text-xs text-[#DC2626]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

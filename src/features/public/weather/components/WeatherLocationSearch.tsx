'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  type AddressCandidate,
  createAddressSession,
  getBrowserLocation,
  isAddressSearchAvailable,
  PlaceSearchError,
  retrieveAddress,
  suggestAddresses,
} from '@/features/scheduling/services/placeSearchApi';
import { DEFAULT_TIME_ZONE_ID } from '../data/suggestedLocations';
import type { WeatherLocation } from '../types/weatherForecast';
import {
  isWithinVietnamBounds,
  OUT_OF_VIETNAM_ERROR_MESSAGE,
} from '../utils/weatherLocation';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

interface WeatherLocationSearchProps {
  onSelectLocation: (location: WeatherLocation) => void;
}

export function WeatherLocationSearch({
  onSelectLocation,
}: WeatherLocationSearchProps) {
  const inputId = useId();
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressCandidate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string | null>(null);
  const searchGeneration = useRef(0);

  const isAvailable = isAddressSearchAvailable();

  const getSessionToken = () => {
    if (!sessionRef.current) {
      sessionRef.current = createAddressSession();
    }
    return sessionRef.current;
  };

  useEffect(() => {
    if (!isAvailable) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAvailable]);

  useEffect(() => {
    if (!isAvailable) return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    const generation = ++searchGeneration.current;
    const timer = setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);
      setIsOpen(true);

      void suggestAddresses(trimmed, getSessionToken())
        .then((results) => {
          if (generation !== searchGeneration.current) return;
          setSuggestions(results);
          setHasCompletedSearch(true);
          setActiveIndex(-1);
          setIsSearching(false);
        })
        .catch((error: unknown) => {
          if (generation !== searchGeneration.current) return;
          setSuggestions([]);
          setHasCompletedSearch(true);
          setActiveIndex(-1);
          setIsSearching(false);
          setSearchError(
            error instanceof PlaceSearchError
              ? error.message
              : 'Không thể tìm địa điểm lúc này. Vui lòng thử lại.',
          );
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isAvailable, query]);

  if (!isAvailable) {
    return null;
  }

  const trimmedQuery = query.trim();
  const showDropdown = isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const activeOptionId =
    showDropdown && activeIndex >= 0 && activeIndex < suggestions.length
      ? optionId(activeIndex)
      : undefined;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    setInlineError(null);

    if (nextValue.trim().length < MIN_QUERY_LENGTH) {
      searchGeneration.current += 1;
      setSuggestions([]);
      setIsSearching(false);
      setHasCompletedSearch(false);
      setSearchError(null);
      setActiveIndex(-1);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    searchGeneration.current += 1;
    setQuery('');
    setSuggestions([]);
    setIsSearching(false);
    setHasCompletedSearch(false);
    setSearchError(null);
    setInlineError(null);
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const handlePickCandidate = async (candidate: AddressCandidate) => {
    setResolvingId(candidate.id);
    setInlineError(null);
    setSearchError(null);

    try {
      const resolved = await retrieveAddress(candidate, getSessionToken());
      sessionRef.current = createAddressSession();

      if (!isWithinVietnamBounds(resolved.latitude, resolved.longitude)) {
        setInlineError(OUT_OF_VIETNAM_ERROR_MESSAGE);
        setIsOpen(false);
        setActiveIndex(-1);
        return;
      }

      const subtitle =
        candidate.fullAddress && candidate.fullAddress !== candidate.name
          ? candidate.fullAddress
          : undefined;

      onSelectLocation({
        name: candidate.name,
        ...(subtitle ? { subtitle } : {}),
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        timeZoneId: DEFAULT_TIME_ZONE_ID,
      });

      searchGeneration.current += 1;
      setQuery('');
      setSuggestions([]);
      setHasCompletedSearch(false);
      setIsOpen(false);
      setActiveIndex(-1);
    } catch (error: unknown) {
      setSearchError(
        error instanceof PlaceSearchError
          ? error.message
          : 'Không lấy được tọa độ của địa điểm này.',
      );
    } finally {
      setResolvingId(null);
    }
  };

  const handleLocateMe = async () => {
    setIsLocating(true);
    setInlineError(null);
    setIsOpen(false);
    setActiveIndex(-1);

    try {
      const point = await getBrowserLocation();
      if (!isWithinVietnamBounds(point.latitude, point.longitude)) {
        setInlineError(OUT_OF_VIETNAM_ERROR_MESSAGE);
        return;
      }

      onSelectLocation({
        name: 'Vị trí của tôi',
        latitude: point.latitude,
        longitude: point.longitude,
        timeZoneId: DEFAULT_TIME_ZONE_ID,
      });
    } catch (error: unknown) {
      setInlineError(
        error instanceof PlaceSearchError
          ? error.message
          : 'Không lấy được vị trí hiện tại. Hãy chọn một địa điểm.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(suggestions.length - 1);
        return;
      }
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter' && showDropdown && suggestions.length > 0 && resolvingId === null) {
      event.preventDefault();
      const targetIndex = activeIndex >= 0 ? activeIndex : 0;
      const chosen = suggestions[targetIndex];
      if (chosen) {
        void handlePickCandidate(chosen);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Tìm địa điểm xem dự báo thời tiết trong Việt Nam
      </label>

      <div className="flex items-center gap-2 rounded-2xl border border-[#174B4A]/45 bg-white px-3.5 py-2 shadow-2xs transition focus-within:border-[#174B4A] focus-within:ring-2 focus-within:ring-[#174B4A]/20">
        <span
          className="material-symbols-outlined shrink-0 text-[20px] text-[#174B4A]"
          aria-hidden="true"
        >
          search
        </span>

        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-label="Tìm địa điểm trong Việt Nam"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (
              trimmedQuery.length >= MIN_QUERY_LENGTH &&
              (suggestions.length > 0 || searchError || hasCompletedSearch)
            ) {
              setIsOpen(true);
            }
          }}
          placeholder="Tìm địa điểm trong Việt Nam: Sa Pa, Phú Quốc…"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm font-medium text-[#1C2928] placeholder:text-[#5B6E69]/80 focus:outline-none focus-visible:outline-none!"
        />

        {query.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Xóa từ khóa tìm kiếm"
            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#5B6E69] transition hover:bg-[#F7F5EF] hover:text-[#1C2928]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              close
            </span>
          </button>
        ) : (
          <span className="hidden shrink-0 text-xs font-medium text-[#5B6E69] md:inline">
            Tìm mọi địa điểm trong Việt Nam
          </span>
        )}

        <button
          type="button"
          onClick={() => void handleLocateMe()}
          disabled={isLocating || resolvingId !== null}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-2.5 py-1.5 text-[11px] font-bold text-[#174B4A] transition hover:border-[#174B4A]/60 hover:bg-[#E8F0EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A] disabled:cursor-wait disabled:opacity-60 sm:px-3 sm:text-xs"
        >
          <span
            className={`material-symbols-outlined text-[15px] ${isLocating ? 'animate-spin' : ''}`}
            aria-hidden="true"
          >
            {isLocating ? 'progress_activity' : 'my_location'}
          </span>
          <span>{isLocating ? 'Đang định vị…' : 'Vị trí của tôi'}</span>
        </button>
      </div>

      {inlineError ? (
        <p
          role="alert"
          className="mt-2 flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            error
          </span>
          <span>{inlineError}</span>
        </p>
      ) : null}

      {showDropdown ? (
        <div className="absolute left-0 right-0 z-30 mt-2 max-w-2xl overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-lg">
          <div className="border-b border-[#EFECE4] bg-[#F7F5EF]/75 px-4 py-2 text-[11px] font-semibold text-[#5B6E69]">
            Kết quả (Mapbox · giới hạn Việt Nam)
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-label="Gợi ý địa điểm tại Việt Nam"
            className="max-h-72 divide-y divide-[#EFECE4] overflow-y-auto"
          >
            {isSearching ? (
              <li className="px-4 py-4 text-xs text-[#5B6E69]">Đang tìm địa điểm…</li>
            ) : searchError ? (
              <li className="px-4 py-3 text-xs font-medium text-rose-700">{searchError}</li>
            ) : suggestions.length === 0 && hasCompletedSearch ? (
              <li className="px-4 py-4 text-xs text-[#5B6E69]">
                Không tìm thấy địa điểm phù hợp tại Việt Nam.
              </li>
            ) : (
              suggestions.map((candidate, idx) => {
                const isActive = idx === activeIndex;
                const isResolving = resolvingId === candidate.id;
                const showAddress =
                  Boolean(candidate.fullAddress) && candidate.fullAddress !== candidate.name;

                return (
                  <li
                    key={candidate.id}
                    id={optionId(idx)}
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (resolvingId === null) {
                        void handlePickCandidate(candidate);
                      }
                    }}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 transition ${
                      isActive ? 'bg-[#E8F0EA] text-[#103B39]' : 'hover:bg-[#F7F5EF]'
                    } ${resolvingId !== null ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F0EA] text-[#174B4A]">
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        location_on
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#1C2928]">
                        {candidate.name}
                      </span>
                      {isResolving ? (
                        <span className="block truncate text-xs text-[#5B6E69]">
                          Đang lấy tọa độ…
                        </span>
                      ) : showAddress ? (
                        <span className="block truncate text-xs text-[#5B6E69]">
                          {candidate.fullAddress}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

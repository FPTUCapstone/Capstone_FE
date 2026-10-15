'use client';

import { useEffect, useRef, useState } from 'react';

import {
  AddressCandidate,
  createAddressSession,
  GeoPoint,
  isAddressSearchAvailable,
  PlaceSearchError,
  retrieveAddress,
  searchSelectablePois,
  SelectablePoi,
  suggestAddresses,
} from '../services/placeSearchApi';

export interface PickedPlace extends GeoPoint {
  label: string;
  /** Present when a catalog place was picked (required for Finish at / Must-see). */
  poi?: SelectablePoi;
}

interface PlacePickerDialogProps {
  title: string;
  /** Addresses (Mapbox) are offered only for the starting point; other fields need catalog places. */
  allowAddresses: boolean;
  /** Ranks and limits catalog places around this point (e.g. must-see places within the radius). */
  near?: GeoPoint | null;
  radiusKm?: number | null;
  onSelect: (place: PickedPlace) => void;
  onClose: () => void;
}

export function PlacePickerDialog({
  title,
  allowAddresses,
  near,
  radiusKm,
  onSelect,
  onClose,
}: PlacePickerDialogProps) {
  const showAddresses = allowAddresses && isAddressSearchAvailable();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [places, setPlaces] = useState<SelectablePoi[]>([]);
  const [addresses, setAddresses] = useState<AddressCandidate[]>([]);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const sessionRef = useRef(createAddressSession());
  const searchGeneration = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const search = async () => {
    const generation = ++searchGeneration.current;
    setHasSearched(true);
    setIsSearching(true);
    setPlacesError(null);
    setAddressesError(null);
    const [placeResult, addressResult] = await Promise.allSettled([
      searchSelectablePois({ query, near: radiusKm ? near : null, radiusKm }),
      showAddresses
        ? suggestAddresses(query, sessionRef.current, near)
        : Promise.resolve<AddressCandidate[]>([]),
    ]);
    if (generation !== searchGeneration.current) return;
    if (placeResult.status === 'fulfilled') {
      setPlaces(placeResult.value);
    } else {
      setPlaces([]);
      setPlacesError(messageOf(placeResult.reason));
    }
    if (addressResult.status === 'fulfilled') {
      setAddresses(addressResult.value);
    } else {
      setAddresses([]);
      setAddressesError(messageOf(addressResult.reason));
    }
    setIsSearching(false);
  };

  const pickAddress = async (candidate: AddressCandidate) => {
    setResolvingId(candidate.id);
    try {
      const resolved = await retrieveAddress(candidate, sessionRef.current);
      onSelect(resolved);
    } catch (error) {
      setAddressesError(messageOf(error));
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-picker-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="place-picker-title" className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="search"
            aria-label={showAddresses ? 'Địa chỉ hoặc tên địa điểm' : 'Tên địa điểm'}
            placeholder={showAddresses ? 'Địa chỉ, khách sạn, trường học hoặc địa điểm…' : 'Tên địa điểm…'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#007d6e] focus:outline-hidden focus:ring-2 focus:ring-[#007d6e]/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#007d6e] px-4 text-sm font-bold text-white hover:bg-[#006b5f]"
          >
            Tìm
          </button>
        </form>
        {radiusKm && near ? (
          <p className="mt-1.5 text-[11px] text-slate-500">
            Chỉ hiển thị địa điểm trong bán kính {Math.round(radiusKm)} km quanh khu vực khám phá.
          </p>
        ) : null}

        <div className="mt-3 min-h-[160px] overflow-y-auto" aria-live="polite">
          {!hasSearched ? (
            <p className="py-8 text-center text-xs text-slate-500">
              {showAddresses
                ? 'Nhập địa chỉ, khách sạn hoặc tên địa điểm rồi bấm Tìm.'
                : 'Nhập tên địa điểm rồi bấm Tìm.'}
            </p>
          ) : isSearching ? (
            <p className="py-8 text-center text-xs text-slate-500">Đang tìm…</p>
          ) : (
            <>
              {showAddresses && (
                <section aria-label="Địa chỉ">
                  <h3 className="mb-1 mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Địa chỉ
                  </h3>
                  {addressesError ? (
                    <p className="py-2 text-xs text-rose-600">{addressesError}</p>
                  ) : addresses.length === 0 ? (
                    <p className="py-2 text-xs text-slate-500">Không có địa chỉ phù hợp.</p>
                  ) : (
                    <ul>
                      {addresses.map((candidate) => (
                        <li key={candidate.id}>
                          <button
                            type="button"
                            disabled={resolvingId !== null}
                            onClick={() => void pickAddress(candidate)}
                            className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-slate-50 disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined mt-0.5 text-lg text-slate-500">
                              home_work
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-slate-800">{candidate.name}</span>
                              <span className="block text-xs text-slate-500">
                                {resolvingId === candidate.id ? 'Đang lấy vị trí…' : candidate.fullAddress}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              <section aria-label="Địa điểm tham quan">
                <h3 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Địa điểm tham quan
                </h3>
                {placesError ? (
                  <p className="py-2 text-xs text-rose-600">{placesError}</p>
                ) : places.length === 0 ? (
                  <p className="py-2 text-xs text-slate-500">Không có địa điểm phù hợp.</p>
                ) : (
                  <ul>
                    {places.map((poi) => (
                      <li key={poi.id}>
                        <button
                          type="button"
                          onClick={() => onSelect({
                            label: poi.name,
                            latitude: poi.latitude,
                            longitude: poi.longitude,
                            poi,
                          })}
                          className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="material-symbols-outlined mt-0.5 text-lg text-[#007d6e]">
                            place
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{poi.name}</span>
                            <span className="block text-xs text-slate-500">
                              {poi.address ?? poi.categoryName}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function messageOf(error: unknown): string {
  return error instanceof PlaceSearchError
    ? error.message
    : 'Không tìm được lúc này. Vui lòng thử lại.';
}

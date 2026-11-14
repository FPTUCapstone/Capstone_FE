'use client';

import { useEffect, useRef, useState } from 'react';

import { getPoiFavorite, setPoiFavorite } from '../services/poiFavoriteApi';

interface PoiFavoriteButtonProps {
  poiId: number;
}

/**
 * Heart toggle "Yêu thích" (UC-10 feedback, D12). Mount it for a signed-in Traveler only: it asks the API
 * for the current state. The click shows the new state at once and rolls back if the save fails.
 */
export function PoiFavoriteButton({ poiId }: PoiFavoriteButtonProps) {
  const [favorite, setFavorite] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // The traveler's own choice wins over a first load that answers late.
  const touchedRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    getPoiFavorite(poiId, { signal: controller.signal })
      .then((result) => {
        if (!touchedRef.current) setFavorite(result.isFavorite);
      })
      .catch(() => {
        // A failed load leaves the heart off; the page itself must not be affected.
      });
    return () => controller.abort();
  }, [poiId]);

  const toggle = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    touchedRef.current = true;
    const next = !favorite;
    setFavorite(next);
    setSaveFailed(false);
    try {
      const saved = await setPoiFavorite(poiId, next);
      setFavorite(saved.isFavorite);
    } catch {
      setFavorite(!next);
      setSaveFailed(true);
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <>
      <button
        type="button"
        aria-pressed={favorite}
        aria-label={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
        onClick={toggle}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white transition hover:bg-[#edf8f5] ${
          favorite ? 'border-rose-200 text-rose-600' : 'border-[#cbd7db] text-[#29404a]'
        }`}
      >
        <span
          className="material-symbols-outlined"
          aria-hidden="true"
          style={favorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          favorite
        </span>
      </button>
      {saveFailed ? (
        <p role="alert" className="w-full text-xs text-rose-600">
          Chưa lưu được yêu thích. Vui lòng thử lại.
        </p>
      ) : null}
    </>
  );
}

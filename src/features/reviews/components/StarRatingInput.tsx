'use client';

import React, { useRef, useState } from 'react';

interface StarRatingInputProps {
  value: number;
  onChange: (val: number) => void;
  error?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Không hài lòng! 1/5 sao',
  2: 'Cần cải thiện! 2/5 sao',
  3: 'Hài lòng! 3/5 sao',
  4: 'Rất tốt! 4/5 sao',
  5: 'Tuyệt vời! 5/5 sao',
};

export function StarRatingInput({ value, onChange, error }: StarRatingInputProps) {
  const [hoverVal, setHoverVal] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayVal = hoverVal || value;

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, (value || star) + 1);
      onChange(next);
      focusStar(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value || star) - 1);
      onChange(prev);
      focusStar(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(star);
    }
  };

  const focusStar = (star: number) => {
    const el = containerRef.current?.querySelector<HTMLButtonElement>(`[data-star="${star}"]`);
    el?.focus();
  };

  return (
    <section aria-labelledby="rating-title" className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs">
      <h3 id="rating-title" className="text-sm font-extrabold text-[#00152A] sm:text-base">
        Trải nghiệm chung về chuyến đi <span className="text-rose-500">*</span>
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Chạm hoặc dùng phím mũi tên để chấm điểm mức độ hài lòng của bạn (1 đến 5 sao)
      </p>

      {/* Accessible radiogroup */}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Đánh giá sao trải nghiệm"
        aria-required="true"
        className="mt-3 flex items-center justify-center gap-2 sm:gap-3"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayVal;
          const isSelected = star === value;
          const tabIndex = isSelected || (value === 0 && star === 1) ? 0 : -1;

          return (
            <button
              key={star}
              type="button"
              role="radio"
              data-star={star}
              aria-checked={isSelected}
              aria-label={`${star} sao`}
              tabIndex={tabIndex}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverVal(star)}
              onMouseLeave={() => setHoverVal(0)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className="p-1 text-amber-400 transition transform hover:scale-115 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] rounded-lg"
            >
              <span
                className={`material-symbols-outlined text-[34px] sm:text-[38px] drop-shadow-2xs ${
                  isFilled ? 'fill-current' : 'text-slate-300'
                }`}
                aria-hidden="true"
              >
                star
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic text rating badge */}
      {displayVal > 0 ? (
        <div className="mt-2.5 inline-block rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800">
          {RATING_LABELS[displayVal]}
        </div>
      ) : (
        <div className="mt-2.5 inline-block text-xs text-slate-400">
          Chưa chọn số sao
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}
    </section>
  );
}

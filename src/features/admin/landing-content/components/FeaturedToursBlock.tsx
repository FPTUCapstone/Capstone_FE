import { useId } from 'react';

import type { ContentErrors, TourOption } from '../landingContent';
import { landingContentEn } from '../resources/en';

interface FeaturedToursBlockProps {
  value: string[];
  tours: TourOption[];
  errors: ContentErrors;
  onChange: (next: string[]) => void;
  disabled: boolean;
}

export function FeaturedToursBlock({ value, tours, errors, onChange, disabled }: FeaturedToursBlockProps) {
  const copy = landingContentEn.editor.tours;
  const baseId = useId();
  // A selected tour that is no longer in the approved list stays visible so the user can see and remove it.
  const unknown: TourOption[] = value
    .filter((id) => !tours.some((tour) => tour.tourId === id))
    .map((id) => ({ tourId: id, title: id }));
  const options = [...tours, ...unknown];

  function toggle(tourId: string) {
    onChange(value.includes(tourId) ? value.filter((id) => id !== tourId) : [...value, tourId]);
  }

  return (
    <section aria-label={copy.title} className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#00152a]">{copy.title}</h2>
      {options.length === 0 ? (
        <p className="mt-3 text-sm text-[#667085]">{copy.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {options.map((tour) => {
            const error = errors[`featuredTourIds.${tour.tourId}`];
            const errorId = `${baseId}-${tour.tourId}-error`;
            return (
              <li key={tour.tourId}>
                <label className="flex items-center gap-2 text-sm text-[#1d2939]">
                  <input
                    type="checkbox"
                    checked={value.includes(tour.tourId)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    disabled={disabled}
                    onChange={() => toggle(tour.tourId)}
                  />
                  {tour.title}
                </label>
                {error && (
                  <p id={errorId} className="mt-1 ml-6 text-xs font-semibold text-[#b42318]">{landingContentEn.errors[error]}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

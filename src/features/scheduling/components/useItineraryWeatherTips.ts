'use client';

import { useEffect, useState } from 'react';

import { getItineraryWeatherTips } from '../services/schedulingApi';
import type { WeatherTipsDto } from '../types/schedulingTypes';

interface UseItineraryWeatherTipsArgs {
  /** The itinerary in the address. */
  itineraryId: number;
  /** The detail the page currently shows; null while it loads. Only its id is read. */
  itinerary: { itineraryId: number } | null;
}

/**
 * UC-10: asks for the weather tips once the itinerary has loaded, never before, and never again for the same
 * itinerary (an edit changes the itinerary object, not its id). The request is aborted when the page is left or the id
 * changes, and every failure is `null` (specs/UC-10-weather-packing-tips-web-spec.md, H1-H3).
 */
export function useItineraryWeatherTips({
  itineraryId,
  itinerary,
}: UseItineraryWeatherTipsArgs): WeatherTipsDto | null {
  const [answer, setAnswer] = useState<{ itineraryId: number; tips: WeatherTipsDto | null } | null>(null);
  const itineraryLoaded = itinerary !== null && itinerary.itineraryId === itineraryId;

  useEffect(() => {
    if (!itineraryLoaded) return;

    const controller = new AbortController();
    let active = true;
    getItineraryWeatherTips(itineraryId, { signal: controller.signal })
      .then((tips) => {
        if (active) setAnswer({ itineraryId, tips });
      })
      .catch(() => {
        // An abort or any other failure leaves the card hidden.
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [itineraryId, itineraryLoaded]);

  // An answer for another itinerary is never shown.
  return answer !== null && answer.itineraryId === itineraryId ? answer.tips : null;
}
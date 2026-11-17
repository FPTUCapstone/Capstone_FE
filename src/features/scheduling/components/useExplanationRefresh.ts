'use client';

import { useEffect, useRef } from 'react';

import { getItineraryById } from '../services/schedulingApi';
import type { ItineraryDetailDto } from '../types/schedulingTypes';
import {
  EXPLANATION_REFRESH_DELAYS_SECONDS,
  hasNewExplanation,
  takeExplanationPending,
  type ExplanationPendingHandoff,
} from '../utils/explanationRefresh';

interface UseExplanationRefreshArgs {
  itineraryId: number;
  /** The detail the page currently shows; null while it loads. */
  itinerary: ItineraryDetailDto | null;
  /** Called once with the first fresh detail whose AI sentence has arrived. */
  onFresh: (fresh: ItineraryDetailDto) => void;
}

/**
 * UC-10: after a create that answered `explanationPending: true`, loads the detail again at the scheduled times
 * (measured from the create) until the AI sentence has arrived, the attempts are used up, or the page is left
 * (specs/UC-10-friendly-explanation-web-spec.md). A failed attempt is ignored.
 */
export function useExplanationRefresh({ itineraryId, itinerary, onFresh }: UseExplanationRefreshArgs): void {
  const itineraryRef = useRef(itinerary);
  const onFreshRef = useRef(onFresh);
  const handoffRef = useRef<{ itineraryId: number; handoff: ExplanationPendingHandoff | null } | null>(null);

  useEffect(() => {
    itineraryRef.current = itinerary;
    onFreshRef.current = onFresh;
  });

  const loaded = itinerary !== null && itinerary.itineraryId === itineraryId;

  useEffect(() => {
    const initial = itineraryRef.current;
    if (!loaded || initial === null) return;

    // Taken once per itinerary: a StrictMode effect re-run must not lose it.
    if (handoffRef.current?.itineraryId !== itineraryId) {
      handoffRef.current = { itineraryId, handoff: takeExplanationPending(itineraryId) };
    }
    const handoff = handoffRef.current.handoff;
    if (handoff === null) return;
    if (hasNewExplanation(handoff.template, initial.items)) {
      handoffRef.current.handoff = null;
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stop = () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };

    const attempt = async () => {
      let fresh: ItineraryDetailDto;
      try {
        fresh = await getItineraryById(itineraryId);
      } catch {
        return;
      }
      if (cancelled || !hasNewExplanation(handoff.template, fresh.items)) return;
      if (handoffRef.current) handoffRef.current.handoff = null;
      stop();
      onFreshRef.current(fresh);
    };

    for (const delay of EXPLANATION_REFRESH_DELAYS_SECONDS) {
      const wait = handoff.createdAt + delay * 1000 - Date.now();
      if (wait > 0) timers.push(setTimeout(() => void attempt(), wait));
    }

    return stop;
  }, [itineraryId, loaded]);
}

'use client';

import { useEffect, useState } from 'react';
import {
  getCancellationPolicyOptions,
  getCategoryOptions,
  getDestinationOptions,
  getSelectableTourPois,
} from '../services/operatorTourService';
import type { ApiCategory, ApiDestination, ApiPoi, ApiPolicy } from '../services/operatorTourApi';
import { OPERATOR_TOUR_MESSAGES } from '../types/tourLifecycle';

export interface TourCatalogues {
  categories: ApiCategory[];
  destinations: ApiDestination[];
  policies: ApiPolicy[];
  pois: ApiPoi[];
  loading: boolean;
  /** Set when any catalogue could not be loaded; the operator cannot save without them. */
  error: string | null;
}

/**
 * Loads the server catalogues an operator must pick from (destinations, cancellation policies, POIs).
 * Demo mode uses its own fixtures, so nothing is requested.
 */
export function useTourCatalogues(isDemo: boolean): TourCatalogues {
  const [state, setState] = useState<TourCatalogues>({
    categories: [],
    destinations: [],
    policies: [],
    pois: [],
    loading: !isDemo,
    error: null,
  });

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    Promise.all([
      getCategoryOptions(),
      getDestinationOptions(),
      getCancellationPolicyOptions(),
      getSelectableTourPois(),
    ])
      .then(([categories, destinations, policies, pois]) => {
        if (active) setState({ categories, destinations, policies, pois, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE,
        }));
      });
    return () => {
      active = false;
    };
  }, [isDemo]);

  return state;
}

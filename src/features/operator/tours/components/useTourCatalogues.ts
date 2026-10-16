'use client';

import { useEffect, useState } from 'react';
import {
  getCancellationPolicyOptions,
  getDestinationOptions,
  getSelectableTourPois,
} from '../services/operatorTourService';
import type { ApiDestination, ApiPoi, ApiPolicy } from '../services/operatorTourApi';
import { OPERATOR_TOUR_MESSAGES } from '../types/tourLifecycle';

export interface TourCatalogues {
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
    destinations: [],
    policies: [],
    pois: [],
    loading: !isDemo,
    error: null,
  });

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    Promise.all([getDestinationOptions(), getCancellationPolicyOptions(), getSelectableTourPois()])
      .then(([destinations, policies, pois]) => {
        if (active) setState({ destinations, policies, pois, loading: false, error: null });
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

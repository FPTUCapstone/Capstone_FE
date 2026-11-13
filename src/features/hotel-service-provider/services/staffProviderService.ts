/**
 * Staff Administration Service Provider Provisioning API Client (UC-77, §3.9.1.5)
 */

import type {
  CommercialPoiItem,
  CreateServiceProviderPayload,
  CreateServiceProviderResult,
} from '../types';
import { DEMO_COMMERCIAL_POIS } from '../fixtures';

let localPois = [...DEMO_COMMERCIAL_POIS];

export const StaffProviderService = {
  resetState(): void {
    localPois = [...DEMO_COMMERCIAL_POIS];
  },

  async fetchCommercialPois(): Promise<CommercialPoiItem[]> {
    return [...localPois];
  },

  /**
   * Provision Service Provider Account (UC-77).
   * Generates secure credentials on backend and dispatches email (BR-03, BR-192).
   */
  async createServiceProviderAccount(
    payload: CreateServiceProviderPayload
  ): Promise<CreateServiceProviderResult> {
    // Basic client validation
    if (
      !payload.businessName.trim() ||
      !payload.representativeFullName.trim() ||
      !payload.email.trim() ||
      !payload.phone.trim() ||
      payload.linkedPoiIds.length === 0
    ) {
      return {
        success: false,
        errorCode: 'MSG01',
        errorMessage: 'Please fill in all required fields.',
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return {
        success: false,
        errorCode: 'MSG143',
        errorMessage: 'Invalid email address format.',
      };
    }

    // Uniqueness check (mock check)
    if (payload.email.toLowerCase() === 'existing.provider@example.com') {
      return {
        success: false,
        errorCode: 'MSG05',
        errorMessage: 'An account with this email already exists. Please sign in or use another email.',
      };
    }

    // POI availability check
    for (const poiId of payload.linkedPoiIds) {
      const poi = localPois.find((p) => p.id === poiId);
      if (!poi || poi.status !== 'Active') {
        return {
          success: false,
          errorCode: 'MSG34',
          errorMessage: 'This point of interest is no longer available.',
        };
      }
      if (poi.isLinkedToOtherProvider) {
        return {
          success: false,
          errorCode: 'MSG202',
          errorMessage: 'This point of interest is already linked to another Service Provider account.',
        };
      }
    }

    // Mark POIs as linked
    localPois = localPois.map((p) =>
      payload.linkedPoiIds.includes(p.id) ? { ...p, isLinkedToOtherProvider: true } : p
    );

    return {
      success: true,
      providerId: Math.floor(Math.random() * 9000) + 1000,
      emailDispatched: true,
    };
  },
};

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPreferencesStorageKey,
  loadStoredPreferences,
  LocalPreferencesStorageError,
  sanitizeInterests,
  sanitizePreferences,
  saveStoredPreferences,
} from '../travelPreferencesStorage';
import {
  DEFAULT_PREFERENCES,
  TravelPreferencesData,
} from '../travelPreferencesTypes';

describe('travelPreferencesStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getPreferencesStorageKey', () => {
    it('returns user-scoped key when userId is provided', () => {
      expect(getPreferencesStorageKey(123)).toBe('tripmate_travel_preferences_123');
      expect(getPreferencesStorageKey('user-abc')).toBe('tripmate_travel_preferences_user-abc');
    });

    it('returns guest key when userId is omitted or null', () => {
      expect(getPreferencesStorageKey()).toBe('tripmate_travel_preferences_guest');
      expect(getPreferencesStorageKey(null)).toBe('tripmate_travel_preferences_guest');
      expect(getPreferencesStorageKey(undefined)).toBe('tripmate_travel_preferences_guest');
    });
  });

  describe('saveStoredPreferences', () => {
    it('persists preferences successfully with user-scoped key and updatedAt timestamp', () => {
      const payload: TravelPreferencesData = {
        interests: ['culture', 'nature'],
        travelStyle: 'solo',
        budgetLevel: 'premium',
        preferredTransport: 'car',
        travelPace: 'relaxed',
        foodPreference: 'vegetarian',
        autoApplyToPlans: true,
      };

      const result = saveStoredPreferences(payload, 42);

      expect(result.interests).toEqual(['culture', 'nature']);
      expect(result.travelStyle).toBe('solo');
      expect(result.updatedAt).toBeDefined();

      const raw = window.localStorage.getItem('tripmate_travel_preferences_42');
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw!);
      expect(stored.interests).toEqual(['culture', 'nature']);
      expect(stored.travelStyle).toBe('solo');
      expect(stored.budgetLevel).toBe('premium');
      expect(stored.updatedAt).toBe(result.updatedAt);
    });

    it('throws LocalPreferencesStorageError when QuotaExceededError occurs', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      });

      expect(() => saveStoredPreferences(DEFAULT_PREFERENCES, 1)).toThrow(
        LocalPreferencesStorageError,
      );

      try {
        saveStoredPreferences(DEFAULT_PREFERENCES, 1);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(LocalPreferencesStorageError);
        expect((err as LocalPreferencesStorageError).code).toBe(
          'LOCAL_PREFERENCES_STORAGE_FAILED',
        );
        expect((err as LocalPreferencesStorageError).message).toContain(
          'Không thể lưu sở thích trên thiết bị này',
        );
      }
    });

    it('throws LocalPreferencesStorageError on generic write failure / blocked storage', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Access is denied / SecurityError');
      });

      expect(() => saveStoredPreferences(DEFAULT_PREFERENCES, 1)).toThrow(
        LocalPreferencesStorageError,
      );
    });
  });

  describe('sanitizeInterests', () => {
    it('CASE A: removes invalid interests and deduplicates while preserving order', () => {
      const raw = ['nature', 'INVALID_INTEREST', 'food', 'nature'];
      const result = sanitizeInterests(raw);
      expect(result).toEqual(['nature', 'food']);
    });

    it('CASE J: preserves intentionally stored empty interests []', () => {
      const result = sanitizeInterests([]);
      expect(result).toEqual([]);
    });

    it('CASE K: falls back to DEFAULT_PREFERENCES.interests when non-empty array has ONLY invalid values', () => {
      const raw = ['INVALID_1', 'INVALID_2', 'spaceship'];
      const result = sanitizeInterests(raw);
      expect(result).toEqual(DEFAULT_PREFERENCES.interests);
    });

    it('falls back to DEFAULT_PREFERENCES.interests when raw is not an array', () => {
      expect(sanitizeInterests(null)).toEqual(DEFAULT_PREFERENCES.interests);
      expect(sanitizeInterests('culture')).toEqual(DEFAULT_PREFERENCES.interests);
      expect(sanitizeInterests(123)).toEqual(DEFAULT_PREFERENCES.interests);
      expect(sanitizeInterests({})).toEqual(DEFAULT_PREFERENCES.interests);
    });
  });

  describe('sanitizePreferences', () => {
    it('CASE B: falls back to default travelStyle when invalid', () => {
      const sanitized = sanitizePreferences({ travelStyle: 'INVALID' });
      expect(sanitized.travelStyle).toBe(DEFAULT_PREFERENCES.travelStyle);
    });

    it('CASE C: falls back to default budgetLevel when invalid', () => {
      const sanitized = sanitizePreferences({ budgetLevel: 'INVALID' });
      expect(sanitized.budgetLevel).toBe(DEFAULT_PREFERENCES.budgetLevel);
    });

    it('CASE D: falls back to default preferredTransport when invalid', () => {
      const sanitized = sanitizePreferences({ preferredTransport: 'teleport' });
      expect(sanitized.preferredTransport).toBe(DEFAULT_PREFERENCES.preferredTransport);
    });

    it('CASE E: falls back to default travelPace when invalid', () => {
      const sanitized = sanitizePreferences({ travelPace: 'turbo' });
      expect(sanitized.travelPace).toBe(DEFAULT_PREFERENCES.travelPace);
    });

    it('CASE F: falls back to default foodPreference when invalid', () => {
      const sanitized = sanitizePreferences({ foodPreference: 'anything' });
      expect(sanitized.foodPreference).toBe(DEFAULT_PREFERENCES.foodPreference);
    });

    it('CASE G: falls back to default autoApplyToPlans when not boolean', () => {
      const sanitized = sanitizePreferences({ autoApplyToPlans: 'true' });
      expect(sanitized.autoApplyToPlans).toBe(DEFAULT_PREFERENCES.autoApplyToPlans);
    });

    it('CASE I: preserves valid preferences exactly', () => {
      const valid: TravelPreferencesData = {
        interests: ['shopping', 'museum'],
        travelStyle: 'group',
        budgetLevel: 'economy',
        preferredTransport: 'walking',
        travelPace: 'packed',
        foodPreference: 'halal',
        autoApplyToPlans: false,
        updatedAt: '2026-10-01T12:00:00.000Z',
      };
      const sanitized = sanitizePreferences(valid);
      expect(sanitized).toEqual(valid);
    });

    it('CASE L: falls back to DEFAULT_PREFERENCES when root is primitive or array', () => {
      expect(sanitizePreferences('hello')).toEqual(DEFAULT_PREFERENCES);
      expect(sanitizePreferences(123)).toEqual(DEFAULT_PREFERENCES);
      expect(sanitizePreferences([1, 2, 3])).toEqual(DEFAULT_PREFERENCES);
      expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('loadStoredPreferences', () => {
    it('returns DEFAULT_PREFERENCES when storage is empty', () => {
      const loaded = loadStoredPreferences(999);
      expect(loaded).toEqual(DEFAULT_PREFERENCES);
    });

    it('CASE H: falls back to DEFAULT_PREFERENCES on corrupted JSON', () => {
      window.localStorage.setItem('tripmate_travel_preferences_1', '{invalid-json:broken');
      const loaded = loadStoredPreferences(1);
      expect(loaded).toEqual(DEFAULT_PREFERENCES);
    });

    it('loads and sanitizes corrupted/stale stored data safely', () => {
      const corruptedStored = {
        interests: ['nature', 'FAKE_POI', 'food'],
        travelStyle: 'intergalactic',
        budgetLevel: 'luxury_unlimited',
        preferredTransport: 'hyperloop',
        travelPace: 'hyper',
        foodPreference: 'carnivore',
        autoApplyToPlans: 'yes',
        updatedAt: 12345, // invalid updatedAt type
      };
      window.localStorage.setItem(
        'tripmate_travel_preferences_1',
        JSON.stringify(corruptedStored),
      );

      const loaded = loadStoredPreferences(1);
      expect(loaded.interests).toEqual(['nature', 'food']);
      expect(loaded.travelStyle).toBe(DEFAULT_PREFERENCES.travelStyle);
      expect(loaded.budgetLevel).toBe(DEFAULT_PREFERENCES.budgetLevel);
      expect(loaded.preferredTransport).toBe(DEFAULT_PREFERENCES.preferredTransport);
      expect(loaded.travelPace).toBe(DEFAULT_PREFERENCES.travelPace);
      expect(loaded.foodPreference).toBe(DEFAULT_PREFERENCES.foodPreference);
      expect(loaded.autoApplyToPlans).toBe(DEFAULT_PREFERENCES.autoApplyToPlans);
      expect(loaded.updatedAt).toBeUndefined();
    });

    it('UC-10 continuity: corrupted localStorage never passes unsupported enum values to consumer', () => {
      // Storing an adversarial payload that attempts enum injection
      window.localStorage.setItem(
        'tripmate_travel_preferences_guest',
        JSON.stringify({
          travelStyle: 'spaceship',
          preferredTransport: 'teleport',
          travelPace: 'turbo',
          budgetLevel: 'billionaire',
          foodPreference: 'synthetic',
          interests: ['quantum_realm', 'time_travel'],
        }),
      );

      const prefillPreferences = loadStoredPreferences(null);

      // Verify that every single field is strictly canonical
      expect(prefillPreferences.travelStyle).toBe('couple');
      expect(prefillPreferences.preferredTransport).toBe('motorbike');
      expect(prefillPreferences.travelPace).toBe('balanced');
      expect(prefillPreferences.budgetLevel).toBe('standard');
      expect(prefillPreferences.foodPreference).toBe('noRestriction');
      expect(prefillPreferences.interests).toEqual(['nature', 'food', 'culture']);
    });
  });
});

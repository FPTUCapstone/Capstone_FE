import { describe, expect, it } from 'vitest';

import {
  EMPTY_PREFERENCES,
  PREFERENCE_ERROR_CODES,
  PreferencesContractError,
  parseTravelPreferenceOptions,
  parseTravelPreferences,
  samePreferences,
  toPayload,
  validatePreferencesDraft,
} from '../travelPreferencesTypes';

const validOptions = {
  interests: [
    { key: 'Beach', source: 'Category' },
    { key: 'street food', source: 'Tag' },
  ],
  preferredTransportModes: ['Walking', 'Motorbike', 'Car', 'PublicTransit'],
  travelPaces: ['Relaxed', 'Moderate', 'Fast'],
  foodPreferences: ['NoRestriction', 'Vegetarian', 'Vegan', 'Halal', 'NoSeafood'],
  riskTolerances: ['Low', 'Medium', 'High'],
};

const validPreferences = {
  interests: ['Beach'],
  preferredTransportMode: 'Motorbike',
  travelPace: 'Moderate',
  riskTolerance: 'Medium',
  foodPreferences: ['Vegan'],
  defaultBudgetVnd: null,
  updatedAtUtc: '2026-10-13T06:00:00Z',
};

describe('parseTravelPreferenceOptions', () => {
  it('parses a valid options payload', () => {
    const options = parseTravelPreferenceOptions(validOptions);
    expect(options.interests).toEqual(validOptions.interests);
  });

  it('accepts an empty interest catalogue', () => {
    expect(parseTravelPreferenceOptions({ ...validOptions, interests: [] }).interests).toEqual([]);
  });

  it.each([
    ['missing interests', { ...validOptions, interests: undefined }],
    ['malformed interest', { ...validOptions, interests: [{ key: '', source: 'Category' }] }],
    ['unknown source', { ...validOptions, interests: [{ key: 'Beach', source: 'Other' }] }],
    ['unknown transport', { ...validOptions, preferredTransportModes: ['Boat'] }],
    ['not an object', 'html'],
  ])('rejects %s', (_label, payload) => {
    expect(() => parseTravelPreferenceOptions(payload)).toThrow(PreferencesContractError);
  });
});

describe('parseTravelPreferences', () => {
  it('parses a complete payload', () => {
    expect(parseTravelPreferences(validPreferences)).toEqual(validPreferences);
  });

  it('accepts the fully unspecified state with nulls and empty arrays', () => {
    expect(
      parseTravelPreferences({
        interests: [],
        preferredTransportMode: null,
        travelPace: null,
        riskTolerance: null,
        foodPreferences: [],
        updatedAtUtc: null,
      }),
    ).toEqual(EMPTY_PREFERENCES);
  });

  it.each([
    ['missing interests', { ...validPreferences, interests: undefined }],
    ['unknown pace', { ...validPreferences, travelPace: 'Packed' }],
    ['unknown food', { ...validPreferences, foodPreferences: ['Keto'] }],
    ['bad timestamp', { ...validPreferences, updatedAtUtc: 'yesterday' }],
    ['array body', []],
  ])('rejects %s', (_label, payload) => {
    expect(() => parseTravelPreferences(payload)).toThrow(PreferencesContractError);
  });
});

describe('validatePreferencesDraft', () => {
  const base = toPayload(EMPTY_PREFERENCES);

  it('accepts the empty draft', () => {
    expect(validatePreferencesDraft(base)).toEqual({});
  });

  it('flags more than ten interests', () => {
    const interests = Array.from({ length: 11 }, (_, index) => `Interest ${index}`);
    expect(validatePreferencesDraft({ ...base, interests }).interests).toBe(PREFERENCE_ERROR_CODES.tooManyInterests);
  });

  it('flags NoRestriction combined with another food key', () => {
    expect(validatePreferencesDraft({ ...base, foodPreferences: ['NoRestriction', 'Vegan'] }).foodPreferences).toBe(
      PREFERENCE_ERROR_CODES.foodNoRestrictionExclusive,
    );
  });

});

describe('toPayload and samePreferences', () => {
  it('drops updatedAtUtc and compares sets order-insensitively', () => {
    const a = toPayload(parseTravelPreferences(validPreferences));
    expect(a).not.toHaveProperty('updatedAtUtc');
    expect(samePreferences(a, { ...a, interests: [...a.interests].reverse() })).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { foodLabels, interestLabel, paceLabels, riskLabels, transportLabels } from '../resources/labels';
import { preferenceErrorText, preferenceMessages } from '../resources/messages';
import {
  FOOD_PREFERENCES,
  PREFERENCE_ERROR_CODES,
  PREFERRED_TRANSPORT_MODES,
  RISK_TOLERANCES,
  TRAVEL_PACES,
} from '../travelPreferencesTypes';

describe('UC-09 labels', () => {
  it('has a label for every enumerated key', () => {
    for (const key of PREFERRED_TRANSPORT_MODES) expect(transportLabels[key]).toBeTruthy();
    for (const key of TRAVEL_PACES) expect(paceLabels[key]).toBeTruthy();
    for (const key of RISK_TOLERANCES) expect(riskLabels[key]).toBeTruthy();
    for (const key of FOOD_PREFERENCES) expect(foodLabels[key]).toBeTruthy();
  });

  it('labels known interests and falls back to the key for unknown ones', () => {
    expect(interestLabel('Beach')).toBe('Bãi biển');
    expect(interestLabel('street food')).toBe('street food');
  });
});

describe('UC-09 message catalog', () => {
  it('keeps the locked SRS §5.3 texts verbatim', () => {
    expect(preferenceMessages.locked).toEqual({
      MSG21: 'Your travel preferences have been saved. TripMate will personalize your recommendations!',
      MSG23: 'You have unsaved changes. Are you sure you want to leave without saving?',
      MSG125: 'Your session has expired. Please sign in again to continue.',
      MSG126: 'You do not have permission to access this function.',
      MSG127:
        'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    });
  });

  it('has catalog text for every validation error code', () => {
    for (const code of Object.values(PREFERENCE_ERROR_CODES)) {
      expect(preferenceErrorText(code)).not.toBe(preferenceMessages.catalog.unknownField);
    }
  });

  it('maps forbidden to MSG126 and unknown codes to the fallback', () => {
    expect(preferenceErrorText(PREFERENCE_ERROR_CODES.forbidden)).toBe(preferenceMessages.locked.MSG126);
    expect(preferenceErrorText('SOMETHING.NEW')).toBe(preferenceMessages.catalog.unknownField);
    expect(preferenceErrorText(undefined)).toBe(preferenceMessages.catalog.unknownField);
  });
});

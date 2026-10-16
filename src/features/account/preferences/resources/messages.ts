import { PREFERENCE_ERROR_CODES } from '../travelPreferencesTypes';

/**
 * UC-09 message catalog (team decision D-04, CR-09).
 *
 * - `locked`: SRS §5.3 Application Messages, copied verbatim. Never edit the wording here.
 * - `catalog`: team-owned text for messages that SRS does not define or defines incorrectly.
 *   These are not read from dbo.Messages.
 */
export const preferenceMessages = {
  locked: {
    MSG21: 'Your travel preferences have been saved. TripMate will personalize your recommendations!',
    MSG23: 'You have unsaved changes. Are you sure you want to leave without saving?',
    MSG125: 'Your session has expired. Please sign in again to continue.',
    MSG126: 'You do not have permission to access this function.',
    MSG127:
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  },
  catalog: {
    errors: {
      [PREFERENCE_ERROR_CODES.invalidOption]: 'This option is no longer available. Please choose from the current list.',
      [PREFERENCE_ERROR_CODES.tooManyInterests]: 'You can select up to 10 interests.',
      [PREFERENCE_ERROR_CODES.foodNoRestrictionExclusive]:
        '“No restriction” cannot be selected with other dietary preferences.',
      [PREFERENCE_ERROR_CODES.valueTooLong]: 'The selected values are too long. Please remove some selections.',
    } as Record<string, string>,
    unknownField: 'One or more values are invalid. Please review your selections.',
    clearConfirm: 'Clear all selected preferences? Changes are saved only after you select “Save preferences”.',
    emptyInterests: 'There are no interest options available yet. You can still save the other preferences.',
  },
} as const;

/** Resolves a backend error code to catalog text; unknown codes use the fallback. */
export function preferenceErrorText(code: string | undefined): string {
  if (code === PREFERENCE_ERROR_CODES.forbidden) return preferenceMessages.locked.MSG126;
  return (code && preferenceMessages.catalog.errors[code]) || preferenceMessages.catalog.unknownField;
}

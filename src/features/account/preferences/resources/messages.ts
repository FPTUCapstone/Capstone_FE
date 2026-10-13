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
      [PREFERENCE_ERROR_CODES.invalidOption]: 'Lựa chọn không hợp lệ. Vui lòng chọn lại từ danh sách.',
      [PREFERENCE_ERROR_CODES.tooManyInterests]: 'Bạn chỉ có thể chọn tối đa 10 sở thích.',
      [PREFERENCE_ERROR_CODES.foodNoRestrictionExclusive]:
        '“Không kiêng” không thể chọn cùng các chế độ ăn khác.',
      [PREFERENCE_ERROR_CODES.valueTooLong]: 'Danh sách lựa chọn quá dài. Vui lòng bỏ bớt.',
    } as Record<string, string>,
    unknownField: 'Giá trị chưa hợp lệ. Vui lòng kiểm tra lại.',
    clearConfirm: 'Xóa toàn bộ sở thích đã chọn? Thay đổi chỉ được lưu khi bạn bấm “Lưu sở thích”.',
    emptyInterests: 'Hiện chưa có danh mục sở thích để chọn. Các mục khác vẫn có thể lưu bình thường.',
  },
} as const;

/** Resolves a backend error code to catalog text; unknown codes use the fallback. */
export function preferenceErrorText(code: string | undefined): string {
  if (code === PREFERENCE_ERROR_CODES.forbidden) return preferenceMessages.locked.MSG126;
  return (code && preferenceMessages.catalog.errors[code]) || preferenceMessages.catalog.unknownField;
}

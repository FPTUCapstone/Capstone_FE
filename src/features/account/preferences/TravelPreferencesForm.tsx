'use client';

import { useEffect, useMemo, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';

import {
  foodLabels,
  interestLabel,
  optionLabel,
  paceLabels,
  riskLabels,
  transportLabels,
} from './resources/labels';
import { preferenceErrorText, preferenceMessages } from './resources/messages';
import { updateTravelPreferences, type PreferencesFailureKind } from './travelPreferencesApi';
import {
  EMPTY_PREFERENCES,
  FOOD_NO_RESTRICTION,
  MAX_INTERESTS,
  PREFERENCE_ERROR_CODES,
  samePreferences,
  toPayload,
  validatePreferencesDraft,
  type FoodPreference,
  type PreferenceField,
  type PreferenceFieldErrors,
  type PreferredTransportMode,
  type RiskTolerance,
  type TravelPace,
  type TravelPreferenceOptions,
  type TravelPreferences,
} from './travelPreferencesTypes';

interface TravelPreferencesFormProps {
  options: TravelPreferenceOptions;
  initialPreferences: TravelPreferences;
  onSaved?: (preferences: TravelPreferences) => void;
  /** Called for 401/403 so the page can show the session or permission state. */
  onAccessProblem?: (kind: Extract<PreferencesFailureKind, 'sessionExpired' | 'forbidden'>) => void;
}

type Feedback = { tone: 'success' | 'error' | 'warning'; message: string };

const chipBase =
  'inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B5F]';
const chipActive = 'border-[#006B5F] bg-[#006B5F] text-white';
const chipIdle = 'border-[#D8E1E4] bg-white text-[#00152A] hover:bg-[#F3F6F7]';

function FieldError({ id, code }: { id: string; code?: string }) {
  if (!code) return null;
  return (
    <p id={id} className="text-xs font-semibold text-[#8C1030]" role="alert">
      {preferenceErrorText(code)}
    </p>
  );
}

export function TravelPreferencesForm({
  options,
  initialPreferences,
  onSaved,
  onAccessProblem,
}: TravelPreferencesFormProps) {
  const [baseline, setBaseline] = useState<TravelPreferences>(initialPreferences);
  const [draft, setDraft] = useState<TravelPreferences>(initialPreferences);
  const [fieldErrors, setFieldErrors] = useState<PreferenceFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const dirty = useMemo(() => !samePreferences(toPayload(draft), toPayload(baseline)), [draft, baseline]);

  // MSG23: warn before the browser leaves the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = preferenceMessages.locked.MSG23;
      return preferenceMessages.locked.MSG23;
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // MSG23: confirm in-app link navigation (account tabs, breadcrumb) with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;
      if (!window.confirm(preferenceMessages.locked.MSG23)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [dirty]);

  const clearMessages = (field?: PreferenceField) => {
    setFeedback(null);
    setFormError(null);
    if (field) {
      setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  };

  const toggleInterest = (key: string) => {
    clearMessages('interests');
    if (!draft.interests.includes(key) && draft.interests.length >= MAX_INTERESTS) {
      setFieldErrors((previous) => ({ ...previous, interests: PREFERENCE_ERROR_CODES.tooManyInterests }));
      return;
    }
    setDraft((previous) => ({
      ...previous,
      interests: previous.interests.includes(key)
        ? previous.interests.filter((item) => item !== key)
        : [...previous.interests, key],
    }));
  };

  const toggleFood = (key: FoodPreference) => {
    clearMessages('foodPreferences');
    setDraft((previous) => {
      if (previous.foodPreferences.includes(key)) {
        return { ...previous, foodPreferences: previous.foodPreferences.filter((item) => item !== key) };
      }
      // D-05: NoRestriction is exclusive; picking one side clears the other.
      const next =
        key === FOOD_NO_RESTRICTION
          ? [key]
          : [...previous.foodPreferences.filter((item) => item !== FOOD_NO_RESTRICTION), key];
      return { ...previous, foodPreferences: next };
    });
  };

  const selectTransport = (value: PreferredTransportMode) => {
    clearMessages('preferredTransportMode');
    setDraft((previous) => ({
      ...previous,
      preferredTransportMode: previous.preferredTransportMode === value ? null : value,
    }));
  };

  const selectPace = (value: TravelPace) => {
    clearMessages('travelPace');
    setDraft((previous) => ({ ...previous, travelPace: previous.travelPace === value ? null : value }));
  };

  const selectRisk = (value: RiskTolerance) => {
    clearMessages('riskTolerance');
    setDraft((previous) => ({ ...previous, riskTolerance: previous.riskTolerance === value ? null : value }));
  };

  const confirmClear = () => {
    setConfirmingClear(false);
    clearMessages();
    setFieldErrors({});
    setDraft({ ...EMPTY_PREFERENCES, interests: [], foodPreferences: [], updatedAtUtc: baseline.updatedAtUtc });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    clearMessages();

    const payload = toPayload(draft);
    const clientErrors = validatePreferencesDraft(payload);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateTravelPreferences(payload);
      if (result.ok) {
        setBaseline(result.data);
        setDraft(result.data);
        setFieldErrors({});
        setFeedback({ tone: 'success', message: preferenceMessages.locked.MSG21 });
        onSaved?.(result.data);
        return;
      }

      if (result.kind === 'validation') {
        setFieldErrors(result.fieldErrors ?? {});
        if (result.formErrorCode || Object.keys(result.fieldErrors ?? {}).length === 0) {
          setFormError(preferenceErrorText(result.formErrorCode));
        }
        return;
      }

      if (result.kind === 'sessionExpired' || result.kind === 'forbidden') {
        onAccessProblem?.(result.kind);
        return;
      }

      setFeedback({ tone: 'error', message: preferenceMessages.locked.MSG127 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" aria-label="Biểu mẫu sở thích du lịch" noValidate>
      <div aria-live="polite" className="space-y-3">
        {feedback ? <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert> : null}
        {formError ? <FeedbackAlert tone="warning">{formError}</FeedbackAlert> : null}
      </div>

      <div className="rounded-xl border border-[#006B5F]/20 bg-[#E6F4F1] p-4 text-xs leading-relaxed text-[#004D40]">
        Mọi mục đều không bắt buộc. Sở thích là ràng buộc linh hoạt: TripMate dùng chúng để điền sẵn khi lập lịch
        trình và xếp hạng gợi ý, nhưng không vượt qua giờ mở cửa, ngân sách hay an toàn.
      </div>

      {/* 1. Interests */}
      <fieldset className="space-y-3" aria-describedby="interests-hint interests-error">
        <legend className="text-sm font-bold uppercase tracking-wide text-[#00152A]">1. Sở thích trải nghiệm</legend>
        <p id="interests-hint" className="text-xs text-[#59616B]">
          Chọn tối đa {MAX_INTERESTS} chủ đề. Đã chọn: {draft.interests.length} / {MAX_INTERESTS}
        </p>
        {options.interests.length === 0 ? (
          <p className="rounded-lg bg-[#F3F6F7] p-3 text-xs text-[#59616B]">{preferenceMessages.catalog.emptyInterests}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.interests.map((option) => {
              const selected = draft.interests.includes(option.key);
              return (
                <button
                  type="button"
                  key={option.key}
                  aria-pressed={selected}
                  disabled={submitting}
                  onClick={() => toggleInterest(option.key)}
                  className={`${chipBase} ${selected ? chipActive : chipIdle}`}
                >
                  {selected ? (
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      check
                    </span>
                  ) : null}
                  {interestLabel(option.key)}
                </button>
              );
            })}
          </div>
        )}
        <FieldError id="interests-error" code={fieldErrors.interests} />
      </fieldset>

      {/* 2. Transport */}
      <fieldset className="space-y-3 border-t border-[#D8E1E4]/70 pt-4" aria-describedby="transport-error">
        <legend className="text-sm font-bold uppercase tracking-wide text-[#00152A]">2. Phương tiện ưa chuộng</legend>
        <div className="flex flex-wrap gap-2">
          {options.preferredTransportModes.map((key) => {
            const selected = draft.preferredTransportMode === key;
            return (
              <button
                type="button"
                key={key}
                aria-pressed={selected}
                disabled={submitting}
                onClick={() => selectTransport(key)}
                className={`${chipBase} ${selected ? chipActive : chipIdle}`}
              >
                {optionLabel(transportLabels, key)}
              </button>
            );
          })}
        </div>
        <FieldError id="transport-error" code={fieldErrors.preferredTransportMode} />
      </fieldset>

      {/* 3. Pace */}
      <fieldset className="space-y-3 border-t border-[#D8E1E4]/70 pt-4" aria-describedby="pace-error">
        <legend className="text-sm font-bold uppercase tracking-wide text-[#00152A]">3. Nhịp độ tham quan</legend>
        <div className="flex flex-wrap gap-2">
          {options.travelPaces.map((key) => {
            const selected = draft.travelPace === key;
            return (
              <button
                type="button"
                key={key}
                aria-pressed={selected}
                disabled={submitting}
                onClick={() => selectPace(key)}
                className={`${chipBase} ${selected ? chipActive : chipIdle}`}
              >
                {optionLabel(paceLabels, key)}
              </button>
            );
          })}
        </div>
        <FieldError id="pace-error" code={fieldErrors.travelPace} />
      </fieldset>

      {/* 4. Food */}
      <fieldset className="space-y-3 border-t border-[#D8E1E4]/70 pt-4" aria-describedby="food-error">
        <legend className="text-sm font-bold uppercase tracking-wide text-[#00152A]">4. Chế độ ăn uống</legend>
        <div className="flex flex-wrap gap-2">
          {options.foodPreferences.map((key) => {
            const selected = draft.foodPreferences.includes(key);
            return (
              <button
                type="button"
                key={key}
                aria-pressed={selected}
                disabled={submitting}
                onClick={() => toggleFood(key)}
                className={`${chipBase} ${selected ? chipActive : chipIdle}`}
              >
                {optionLabel(foodLabels, key)}
              </button>
            );
          })}
        </div>
        <FieldError id="food-error" code={fieldErrors.foodPreferences} />
      </fieldset>

      {/* 5. Risk tolerance */}
      <fieldset className="space-y-3 border-t border-[#D8E1E4]/70 pt-4" aria-describedby="risk-hint risk-error">
        <legend className="text-sm font-bold uppercase tracking-wide text-[#00152A]">5. Mức chấp nhận rủi ro</legend>
        <p id="risk-hint" className="text-xs text-[#59616B]">
          Mức độ bạn sẵn sàng thử trải nghiệm mạo hiểm. Đây không phải mức nguy hiểm thực tế; cảnh báo an toàn luôn được
          ưu tiên.
        </p>
        <div className="flex flex-wrap gap-2">
          {options.riskTolerances.map((key) => {
            const selected = draft.riskTolerance === key;
            return (
              <button
                type="button"
                key={key}
                aria-pressed={selected}
                disabled={submitting}
                onClick={() => selectRisk(key)}
                className={`${chipBase} ${selected ? chipActive : chipIdle}`}
              >
                {optionLabel(riskLabels, key)}
              </button>
            );
          })}
        </div>
        <FieldError id="risk-error" code={fieldErrors.riskTolerance} />
      </fieldset>

      {confirmingClear ? (
        <div role="alertdialog" aria-labelledby="clear-confirm-text" className="rounded-xl border border-[#F6DCAE] bg-[#FEF3E2] p-4">
          <p id="clear-confirm-text" className="text-xs font-semibold text-[#7C4A03]">
            {preferenceMessages.catalog.clearConfirm}
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={confirmClear} className={`${chipBase} ${chipActive}`}>
              Xác nhận xóa
            </button>
            <button type="button" onClick={() => setConfirmingClear(false)} className={`${chipBase} ${chipIdle}`}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-[#D8E1E4] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setConfirmingClear(true)}
          disabled={submitting}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#D8E1E4] bg-white px-4 py-2.5 text-xs font-semibold text-[#59616B] transition hover:bg-[#F3F6F7] hover:text-[#00152A]"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            restart_alt
          </span>
          Xóa tất cả sở thích
        </button>

        <ActionButton
          type="submit"
          variant="primary"
          loading={submitting}
          className="!bg-[#006B5F] hover:!bg-[#00574D] sm:min-w-[170px]"
        >
          Lưu sở thích
        </ActionButton>
      </div>
    </form>
  );
}

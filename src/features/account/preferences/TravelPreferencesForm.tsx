'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';

import {
  resetTravelPreferences,
  updateTravelPreferences,
} from './travelPreferencesApi';
import {
  BUDGET_LEVEL_OPTIONS,
  DEFAULT_PREFERENCES,
  FOOD_OPTIONS,
  INTEREST_OPTIONS,
  PACE_OPTIONS,
  TRANSPORT_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  type BudgetLevelId,
  type FoodPreferenceId,
  type PreferredTransportId,
  type TravelInterestId,
  type TravelPaceId,
  type TravelPreferencesData,
  type TravelStyleId,
} from './travelPreferencesTypes';

interface TravelPreferencesFormProps {
  initialPreferences?: TravelPreferencesData;
  userId?: string | number | null;
  onSaved?: (preferences: TravelPreferencesData) => void;
}

export function TravelPreferencesForm({
  initialPreferences,
  userId,
  onSaved,
}: TravelPreferencesFormProps) {
  const [preferences, setPreferences] = useState<TravelPreferencesData>(
    () => initialPreferences ?? DEFAULT_PREFERENCES,
  );
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'warning' | 'error' | 'info';
    title?: string;
    message: string;
    notice?: string;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Toggle multi-select interest tags
  const toggleInterest = (id: TravelInterestId) => {
    setFeedback(null);
    setValidationError(null);
    setPreferences((prev) => {
      const exists = prev.interests.includes(id);
      const nextInterests = exists
        ? prev.interests.filter((item) => item !== id)
        : [...prev.interests, id];
      return { ...prev, interests: nextInterests };
    });
  };

  // Select single travel style
  const selectStyle = (id: TravelStyleId) => {
    setFeedback(null);
    setValidationError(null);
    setPreferences((prev) => ({
      ...prev,
      travelStyle: prev.travelStyle === id ? null : id,
    }));
  };

  // Select single budget level
  const selectBudget = (id: BudgetLevelId) => {
    setFeedback(null);
    setValidationError(null);
    setPreferences((prev) => ({
      ...prev,
      budgetLevel: prev.budgetLevel === id ? null : id,
    }));
  };

  // Select transport
  const selectTransport = (id: PreferredTransportId) => {
    setFeedback(null);
    setPreferences((prev) => ({ ...prev, preferredTransport: id }));
  };

  // Select pace
  const selectPace = (id: TravelPaceId) => {
    setFeedback(null);
    setPreferences((prev) => ({ ...prev, travelPace: id }));
  };

  // Select food
  const selectFood = (id: FoodPreferenceId) => {
    setFeedback(null);
    setPreferences((prev) => ({ ...prev, foodPreference: id }));
  };

  // Toggle auto-apply
  const toggleAutoApply = () => {
    setFeedback(null);
    setPreferences((prev) => ({ ...prev, autoApplyToPlans: !prev.autoApplyToPlans }));
  };

  // Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setValidationError(null);

    // Business validation (MSG22)
    if (!preferences.travelStyle || !preferences.budgetLevel) {
      setValidationError('Vui lòng chọn phong cách du lịch và mức ngân sách dự kiến (MSG22).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateTravelPreferences(preferences, { userId });
      setFeedback({
        tone: 'info',
        title: 'Đã lưu trên thiết bị',
        message: res.message,
        notice: res.notice,
      });
      onSaved?.(res.preferences);
    } catch {
      setFeedback({
        tone: 'error',
        title: 'Không thể lưu sở thích',
        message:
          'TripMate tạm thời không thể kết nối tới máy chủ lưu trữ sở thích. Vui lòng thử lại sau (MSG127).',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reset to default
  const handleReset = () => {
    setResetting(true);
    setValidationError(null);
    const resetData = resetTravelPreferences(userId);
    setPreferences(resetData);
    setFeedback({
      tone: 'info',
      title: 'Đã đặt lại mặc định',
      message: 'Các tùy chọn sở thích đã được khôi phục về giá trị khuyến nghị ban đầu.',
    });
    setResetting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" aria-label="Biểu mẫu sở thích du lịch">
      {/* Alert Feedback Messages */}
      {validationError ? (
        <FeedbackAlert tone="warning" title="Thiếu thông tin bắt buộc">
          {validationError}
        </FeedbackAlert>
      ) : null}

      {feedback ? (
        <div className="space-y-3">
          <FeedbackAlert tone={feedback.tone} title={feedback.title}>
            {feedback.message}
          </FeedbackAlert>
          {feedback.notice ? (
            <FeedbackAlert tone="warning" title="Chờ tích hợp máy chủ">
              {feedback.notice}
            </FeedbackAlert>
          ) : null}
        </div>
      ) : null}

      {/* Intro Context Banner */}
      <div className="rounded-xl border border-[#006B5F]/20 bg-[#E6F4F1] p-4 text-xs text-[#006B5F]">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined mt-0.5 text-base shrink-0" aria-hidden="true">
            auto_awesome
          </span>
          <div>
            <p className="font-bold">Cá nhân hóa hành trình thông minh</p>
            <p className="mt-0.5 leading-relaxed text-[#004D40]">
              Các tùy chọn sở thích đóng vai trò là ràng buộc linh hoạt (soft constraints). Thuật toán lập lịch trình (UC-10) và gợi ý điểm đến (UC-25) sẽ ưu tiên kết hợp các địa điểm phù hợp nhất với phong cách của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTEREST TAGS */}
      <section aria-labelledby="section-interests" className="space-y-4">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div>
            <h2 id="section-interests" className="text-sm font-bold tracking-wide text-[#00152A] uppercase">
              1. Sở thích trải nghiệm nổi bật
            </h2>
            <p className="text-xs text-[#59616B]">
              Chọn các chủ đề bạn hào hứng nhất khi khám phá một vùng đất mới.
            </p>
          </div>
          <span className="self-start rounded-full bg-[#F3F6F7] px-2.5 py-1 text-[11px] font-semibold text-[#006B5F] sm:self-auto">
            Đã chọn: {preferences.interests.length} / {INTEREST_OPTIONS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {INTEREST_OPTIONS.map((item) => {
            const isSelected = preferences.interests.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => toggleInterest(item.id)}
                aria-pressed={isSelected}
                disabled={submitting}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  isSelected
                    ? 'border-[#006B5F] bg-[#E6F4F1]/60 shadow-xs'
                    : 'border-[#D8E1E4] bg-white hover:border-[#B2DFDB] hover:bg-[#F3F6F7]/50'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-[#006B5F] text-white' : 'bg-[#F3F6F7] text-[#59616B]'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00152A]">{item.label}</span>
                    {isSelected ? (
                      <span className="material-symbols-outlined text-sm font-bold text-[#006B5F]" aria-hidden="true">
                        check
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-[#59616B] leading-tight">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: TRAVEL STYLE */}
      <section aria-labelledby="section-travel-style" className="space-y-4 pt-2 border-t border-[#D8E1E4]/70">
        <div>
          <h2 id="section-travel-style" className="text-sm font-bold tracking-wide text-[#00152A] uppercase">
            2. Phong cách chuyến đi
          </h2>
          <p className="text-xs text-[#59616B]">
            Bạn thường đi du lịch cùng ai và mong muốn không gian trải nghiệm như thế nào?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="section-travel-style">
          {TRAVEL_STYLE_OPTIONS.map((style) => {
            const isSelected = preferences.travelStyle === style.id;
            return (
              <div
                key={style.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => selectStyle(style.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    selectStyle(style.id);
                  }
                }}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  isSelected
                    ? 'border-[#006B5F] bg-[#E6F4F1]/60 shadow-xs ring-1 ring-[#006B5F]'
                    : 'border-[#D8E1E4] bg-white hover:border-[#B2DFDB] hover:bg-[#F3F6F7]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-[#006B5F] text-white' : 'bg-[#F3F6F7] text-[#59616B]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      {style.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00152A]">{style.label}</span>
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#006B5F] bg-[#006B5F] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#59616B] leading-normal">{style.subtitle}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: BUDGET LEVEL */}
      <section aria-labelledby="section-budget" className="space-y-4 pt-2 border-t border-[#D8E1E4]/70">
        <div>
          <h2 id="section-budget" className="text-sm font-bold tracking-wide text-[#00152A] uppercase">
            3. Mức ngân sách dự kiến
          </h2>
          <p className="text-xs text-[#59616B]">
            Mức chi tiêu trung bình mỗi ngày để TripMate tối ưu chi phí ẩm thực, lưu trú và vé tham quan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-labelledby="section-budget">
          {BUDGET_LEVEL_OPTIONS.map((budget) => {
            const isSelected = preferences.budgetLevel === budget.id;
            return (
              <div
                key={budget.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => selectBudget(budget.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    selectBudget(budget.id);
                  }
                }}
                className={`cursor-pointer rounded-xl border p-4 text-center transition ${
                  isSelected
                    ? 'border-[#006B5F] bg-[#E6F4F1]/60 shadow-xs ring-1 ring-[#006B5F]'
                    : 'border-[#D8E1E4] bg-white hover:border-[#B2DFDB] hover:bg-[#F3F6F7]/50'
                }`}
              >
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-[#006B5F] text-white' : 'bg-[#F3F6F7] text-[#59616B]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">
                    {budget.icon}
                  </span>
                </div>
                <h3 className="mt-2 text-xs font-bold text-[#00152A]">{budget.label}</h3>
                <p className="mt-1 text-[11px] font-semibold text-[#006B5F]">{budget.rangeDescription}</p>
                <p className="mt-0.5 text-[10.5px] text-[#59616B] leading-tight">{budget.subtitle}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: LOGISTICS & PACE PREFERENCES */}
      <section aria-labelledby="section-logistics" className="space-y-5 pt-2 border-t border-[#D8E1E4]/70">
        <div>
          <h2 id="section-logistics" className="text-sm font-bold tracking-wide text-[#00152A] uppercase">
            4. Tùy chọn di chuyển &amp; Nhịp độ
          </h2>
          <p className="text-xs text-[#59616B]">
            Tinh chỉnh thêm để thuật toán gợi ý thời gian di chuyển và mật độ điểm dừng hợp lý.
          </p>
        </div>

        {/* Transport Mode */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#00152A]">Phương tiện di chuyển ưa chuộng:</label>
          <div className="flex flex-wrap gap-2">
            {TRANSPORT_OPTIONS.map((item) => {
              const active = preferences.preferredTransport === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectTransport(item.id)}
                  disabled={submitting}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    active
                      ? 'border-[#006B5F] bg-[#006B5F] text-white'
                      : 'border-[#D8E1E4] bg-white text-[#00152A] hover:bg-[#F3F6F7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Travel Pace */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#00152A]">Nhịp độ tham quan:</label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {PACE_OPTIONS.map((item) => {
              const active = preferences.travelPace === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectPace(item.id)}
                  disabled={submitting}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    active
                      ? 'border-[#006B5F] bg-[#E6F4F1] text-[#006B5F] ring-1 ring-[#006B5F]'
                      : 'border-[#D8E1E4] bg-white text-[#59616B] hover:bg-[#F3F6F7]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#00152A]">{item.label}</div>
                  <div className="mt-0.5 text-[10.5px] leading-tight">{item.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#00152A]">Chế độ ăn uống:</label>
          <div className="flex flex-wrap gap-2">
            {FOOD_OPTIONS.map((item) => {
              const active = preferences.foodPreference === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectFood(item.id)}
                  disabled={submitting}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    active
                      ? 'border-[#006B5F] bg-[#006B5F] text-white'
                      : 'border-[#D8E1E4] bg-white text-[#00152A] hover:bg-[#F3F6F7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto Apply Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[#D8E1E4] bg-white p-3.5">
          <div className="pr-4">
            <span className="text-xs font-bold text-[#00152A]">
              Tự động áp dụng sở thích cho mọi kế hoạch mới
            </span>
            <p className="mt-0.5 text-[11px] text-[#59616B]">
              Khi tạo lịch trình mới (UC-10), hệ thống sẽ tự động điền sẵn các tiêu chí này.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.autoApplyToPlans}
            onClick={toggleAutoApply}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B5F] ${
              preferences.autoApplyToPlans ? 'bg-[#006B5F]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                preferences.autoApplyToPlans ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* ACTION BUTTONS & FOOTER */}
      <div className="flex flex-col-reverse gap-3 pt-4 border-t border-[#D8E1E4] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting || resetting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8E1E4] bg-white px-4 py-2.5 text-xs font-semibold text-[#59616B] transition hover:bg-[#F3F6F7] hover:text-[#00152A]"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              restart_alt
            </span>
            Đặt lại mặc định
          </button>

          <Link
            href={ROUTES.account.profile}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#59616B] hover:text-[#006B5F] hover:underline px-2 py-2"
          >
            ← Bỏ qua &amp; Quay lại
          </Link>
        </div>

        <ActionButton
          type="submit"
          variant="primary"
          loading={submitting}
          className="!bg-[#006B5F] hover:!bg-[#00574D] sm:min-w-[170px]"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            check
          </span>
          Lưu sở thích
        </ActionButton>
      </div>
    </form>
  );
}

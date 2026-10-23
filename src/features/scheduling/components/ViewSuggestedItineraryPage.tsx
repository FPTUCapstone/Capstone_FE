'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { getMapboxPublicToken } from '@/lib/mapboxToken';
import { ROUTES } from '@/lib/routes';

import {
  acceptItinerary,
  getItineraryById,
  ItineraryHttpError,
  NAVIGATION_IN_PROGRESS_CODE,
  regenerateItinerary,
  StopInfeasibleError,
  updateItineraryStops,
} from '../services/schedulingApi';
import {
  formatVietnamDayLabel,
  formatVietnamTime,
  ItineraryDetailDto,
  ItineraryDetailItemDto,
  ItineraryStopInput,
  ItinerarySuggestionDto,
  SuggestionQuery,
  vietnamDayKey,
} from '../types/schedulingTypes';
import { handOffEdit, LastItineraryEdit, takeEditHandoff } from '../utils/itineraryEditHandoff';
import {
  describeStopInfeasible,
  diffArrivalMinutes,
  formatMinutes,
  stopDisplayName,
} from '../utils/itineraryPresentation';
import {
  currentStops,
  insertAfterItem,
  removeStop,
  reorderStops,
  replaceStop,
  withLegMode,
} from '../utils/itineraryStops';
import { buildItineraryMapModel, MARKER_COLORS, MapMarkerKind } from '../utils/mapGeometry';
import { ItineraryReviewsDialog } from './ItineraryReviewsDialog';
import { LazyItineraryMap } from './maps/LazyMaps';
import { ItinerarySuggestionsDialog } from './ItinerarySuggestionsDialog';
import { ItinerarySummaryCards } from './ItinerarySummaryCards';
import { ItineraryTimeline } from './ItineraryTimeline';

/** How long the Undo toast stays after an edit (Review 2, D11-4). */
const UNDO_VISIBLE_MS = 8000;

const REMOVE_MANDATORY_CONFIRM = 'Đây là điểm bạn đã chọn, chắc chắn bỏ?';

const NO_SHIFTS: ReadonlyMap<number, number> = new Map();

const MAP_LEGEND: Array<{ kind: MapMarkerKind; label: string }> = [
  { kind: 'start', label: 'Xuất phát (B)' },
  { kind: 'attraction', label: 'Tham quan' },
  { kind: 'food', label: 'Ăn uống' },
  { kind: 'end', label: 'Kết thúc (K)' },
];

/** Where a chosen suggestion goes: after an item (food) or in place of a stop (replace). */
type SuggestionTarget = { query: SuggestionQuery; title: string; item: ItineraryDetailItemDto };

interface ViewSuggestedItineraryPageProps {
  itineraryId: string;
}

function getErrorPresentation(status?: number): { heading: string; icon: string } {
  switch (status) {
    case 401:
      return { heading: 'Phiên đăng nhập đã hết hạn', icon: 'login' };
    case 403:
      return { heading: 'Bạn không có quyền xem lịch trình này', icon: 'lock' };
    case 404:
      return { heading: 'Không tìm thấy lịch trình', icon: 'search_off' };
    default:
      return { heading: 'Không thể tải chi tiết lịch trình', icon: 'event_busy' };
  }
}

export function ViewSuggestedItineraryPage({ itineraryId }: ViewSuggestedItineraryPageProps) {
  const router = useRouter();
  const { status, context } = useWebSession();
  const userId = context?.userId;
  const role = context?.role;
  const [itinerary, setItinerary] = useState<ItineraryDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState(false);
  const [orderedVisitPoiIds, setOrderedVisitPoiIds] = useState<number[]>([]);
  // Review 2 (D11-3/4): stops whose arrival moved in the last edit, and the stops to restore on undo.
  // Tied to the version they belong to, and handed over when the edit moves the page to a new id.
  const [lastEdit, setLastEdit] = useState<LastItineraryEdit | null>(null);
  const editMatches = Boolean(lastEdit && itinerary && lastEdit.itineraryId === itinerary.itineraryId);
  const arrivalShifts = editMatches && lastEdit ? lastEdit.arrivalShifts : NO_SHIFTS;
  const undoStops = editMatches && lastEdit?.undo ? lastEdit.undo.stops : null;
  const undoUntil = lastEdit?.undo?.until ?? null;
  const [suggestionTarget, setSuggestionTarget] = useState<SuggestionTarget | null>(null);
  const [reviewsFor, setReviewsFor] = useState<ItineraryDetailItemDto | null>(null);
  // Map ↔ timeline synchronization and active marker selection
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const mapboxToken = getMapboxPublicToken();

  const itineraryItems = itinerary?.items;
  const displayedItems = useMemo(() => {
    if (!itineraryItems) return [];
    if (!activeDayKey) return itineraryItems;
    return itineraryItems.filter((item) => vietnamDayKey(item.plannedArrival) === activeDayKey);
  }, [itineraryItems, activeDayKey]);

  const mapModel = useMemo(() => {
    if (!itinerary) return null;
    return buildItineraryMapModel({
      ...itinerary,
      items: displayedItems,
    });
  }, [itinerary, displayedItems]);

  const selectedItem =
    highlightedItemId !== null && itineraryItems
      ? itineraryItems.find((item) => item.itemId === highlightedItemId) ?? null
      : null;

  const destinationLabel = useMemo(() => {
    if (itinerary?.startLocation?.address) {
      const parts = itinerary.startLocation.address.split(',').map((s) => s.trim());
      return parts.slice(-2).join(', ');
    }
    const firstVisit = itinerary?.items.find((i) => i.kind === 'Visit' && i.poiName);
    if (firstVisit?.address) {
      const parts = firstVisit.address.split(',').map((s) => s.trim());
      return parts.slice(-2).join(', ');
    }
    return 'Đà Nẵng & Miền Trung';
  }, [itinerary]);

  const scheduleDateLabel = useMemo(() => {
    if (!itinerary?.validFrom) return null;
    const fromLabel = formatVietnamDayLabel(itinerary.validFrom);
    if (!itinerary.validTo) return fromLabel;
    const toLabel = formatVietnamDayLabel(itinerary.validTo);
    return fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
  }, [itinerary]);

  const uniqueDays = useMemo(() => {
    if (!itinerary?.items || itinerary.items.length === 0) return [];
    const map = new Map<string, { key: string; label: string; count: number }>();
    itinerary.items.forEach((item) => {
      const key = vietnamDayKey(item.plannedArrival);
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          key,
          label: formatVietnamDayLabel(item.plannedArrival),
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [itinerary]);


  const scrollToDay = (dayKey: string) => {
    setActiveDayKey(dayKey);
    const el = document.getElementById(`day-section-${dayKey}`);
    if (el) {
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectFromMap = (itemId: number) => {
    setHighlightedItemId(itemId);
    document.querySelector(`[data-item-id="${itemId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    if (undoUntil === null) return;
    const timer = setTimeout(
      () => setLastEdit((current) => (current ? { ...current, undo: null } : current)),
      Math.max(0, undoUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [undoUntil]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        `${ROUTES.signIn}?returnUrl=${encodeURIComponent(`/itinerary/${itineraryId}`)}`,
      );
    } else if (status === 'authenticated' && role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [status, role, router, itineraryId]);

  useEffect(() => {
    if (status !== 'authenticated' || userId === undefined || role !== 'Traveler') {
      return;
    }

    let isMounted = true;
    async function loadItinerary() {
      const handoff = takeEditHandoff(Number(itineraryId));
      if (handoff) {
        // The edit that moved us here already returned this version.
        setItinerary(handoff.itinerary);
        setLastEdit(handoff.lastEdit);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setItinerary(null);

      try {
        const data = await getItineraryById(itineraryId);
        if (isMounted) {
          setItinerary(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const httpStatus = err instanceof ItineraryHttpError ? err.status : undefined;
          const msg =
            err instanceof Error
              ? err.message
              : 'Không thể tải chi tiết lịch trình. Vui lòng thử lại sau.';
          setError({ status: httpStatus, message: msg });
          setLoading(false);
        }
      }
    }

    void loadItinerary();

    return () => {
      isMounted = false;
    };
  }, [itineraryId, status, userId, role]);

  const errorPresentation = getErrorPresentation(error?.status);
  const signInHref = `${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.itinerary(itineraryId))}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const applyMutation = async (
    operation: () => Promise<ItineraryDetailDto>,
    edit?: {
      /** Stops to restore with Undo; omitted for non-stop mutations and for the undo itself. */
      undoTo?: ItineraryStopInput[];
      /** Names of places not yet in the itinerary, for infeasibility messages. */
      extraNames?: ReadonlyMap<number, string>;
    },
  ) => {
    if (!itinerary || mutationPending) return;
    const before = itinerary;
    setMutationPending(true);
    setMutationError(null);
    setLastEdit((current) => (current ? { ...current, undo: null } : current));
    try {
      const successor = await operation();
      const nextEdit: LastItineraryEdit | null = edit
        ? {
            itineraryId: successor.itineraryId,
            arrivalShifts: diffArrivalMinutes(before.items, successor.items),
            undo: edit.undoTo ? { stops: edit.undoTo, until: Date.now() + UNDO_VISIBLE_MS } : null,
          }
        : null;
      setEditingOrder(false);
      setItinerary(successor);
      setLastEdit(nextEdit);
      if (successor.itineraryId !== before.itineraryId) {
        // The [id] page remounts for the new id: hand it the result so badges and Undo survive.
        handOffEdit({ itinerary: successor, lastEdit: nextEdit });
        router.replace(ROUTES.itinerary(successor.itineraryId));
      }
    } catch (mutationFailure) {
      if (
        mutationFailure instanceof ItineraryHttpError &&
        mutationFailure.code === NAVIGATION_IN_PROGRESS_CODE
      ) {
        // Someone started navigating meanwhile: lock the page like a fresh load would.
        setEditingOrder(false);
        setItinerary({ ...before, isNavigationInProgress: true });
      }
      if (mutationFailure instanceof StopInfeasibleError) {
        const nameOf = (poiId: number | null) =>
          poiId === null
            ? null
            : before.items.find((entry) => entry.poiId === poiId)?.poiName ??
              edit?.extraNames?.get(poiId) ??
              null;
        setMutationError(describeStopInfeasible(mutationFailure.details, nameOf));
      } else {
        setMutationError(
          mutationFailure instanceof Error
            ? mutationFailure.message
            : 'Không thể cập nhật lịch trình. Vui lòng thử lại sau.',
        );
      }
    } finally {
      setMutationPending(false);
    }
  };

  /** Review 2 (§3.4): every stop edit sends the full stops list and can be undone. */
  const applyStops = (stops: ItineraryStopInput[], extraNames?: ReadonlyMap<number, string>) => {
    if (!itinerary) return;
    const itineraryId = itinerary.itineraryId;
    void applyMutation(() => updateItineraryStops(itineraryId, stops), {
      undoTo: currentStops(itinerary.items),
      extraNames,
    });
  };

  const undoLastEdit = () => {
    if (!itinerary || !undoStops) return;
    const itineraryId = itinerary.itineraryId;
    const stops = undoStops;
    void applyMutation(() => updateItineraryStops(itineraryId, stops), {});
  };

  const canEditStops = Boolean(itinerary?.canManage && !itinerary.isNavigationInProgress);

  const openFoodSuggestions = (afterItem: ItineraryDetailItemDto) =>
    setSuggestionTarget({
      query: { kind: 'Food', afterItemId: afterItem.itemId },
      title: `Thêm quán ăn sau ${stopDisplayName(afterItem)}`,
      item: afterItem,
    });

  const openReplaceSuggestions = (target: ItineraryDetailItemDto) => {
    // D4: replacing a stop the traveler chose drops it, so it needs the same confirmation as removing it.
    if (target.isMandatory && !window.confirm(REMOVE_MANDATORY_CONFIRM)) return;
    setSuggestionTarget({
      query: { kind: 'Replace', replaceItemId: target.itemId },
      title: `Thay ${stopDisplayName(target)}`,
      item: target,
    });
  };

  const chooseSuggestion = (suggestion: ItinerarySuggestionDto) => {
    if (!itinerary || !suggestionTarget) return;
    if (suggestion.overflowMinutes && suggestion.overflowMinutes > 0) {
      const confirmMessage = `Địa điểm này cần thêm thời gian di chuyển/ăn uống. Lịch trình sẽ tự động kéo dài thêm ${formatMinutes(suggestion.overflowMinutes)}. Bạn có muốn tiếp tục?`;
      if (!window.confirm(confirmMessage)) return;
    }
    const { query, item } = suggestionTarget;
    setSuggestionTarget(null);
    let stops: ItineraryStopInput[];
    if (query.kind === 'Food') {
      stops = insertAfterItem(itinerary.items, item, suggestion.poiId);
    } else {
      if (item.poiId === null) return;
      stops = replaceStop(currentStops(itinerary.items), item.poiId, suggestion.poiId);
    }
    applyStops(stops, new Map([[suggestion.poiId, suggestion.name]]));
  };

  const removeItem = (item: ItineraryDetailItemDto) => {
    if (!itinerary || item.poiId === null) return;
    // D4: a stop the traveler chose is removed only after confirmation.
    if (item.isMandatory && !window.confirm(REMOVE_MANDATORY_CONFIRM)) return;
    applyStops(removeStop(currentStops(itinerary.items), item.poiId));
  };

  const hasAddedRestaurant = Boolean(
    itinerary?.items.some((item) => item.kind === 'Visit' && item.costKind === 'AverageSpend'),
  );

  const startAdjustingOrder = () => {
    if (!itinerary) return;
    setOrderedVisitPoiIds(
      itinerary.items
        .filter((item) => item.kind === 'Visit' && item.poiId !== null)
        .map((item) => item.poiId!),
    );
    setMutationError(null);
    setEditingOrder(true);
  };

  const moveVisit = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedVisitPoiIds.length) return;
    setOrderedVisitPoiIds((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const editVisitItems = itinerary
    ? orderedVisitPoiIds
        .map((poiId) => itinerary.items.find((item) => item.kind === 'Visit' && item.poiId === poiId))
        .filter((item): item is ItineraryDetailDto['items'][number] => item !== undefined)
    : [];

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">Đang tải kế hoạch du lịch…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || userId === undefined || role !== 'Traveler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-2 text-xs text-slate-500"
          >
            <Link href={ROUTES.home} className="hover:text-[#007d6e] transition">
              Trang chủ
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link href={ROUTES.plan} className="hover:text-[#007d6e] transition">
              Lập lịch trình thông minh
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-semibold text-slate-800">
              Lịch trình #{itineraryId}
            </span>
          </nav>

          {/* Truthful Error Display */}
          {error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined text-3xl">{errorPresentation.icon}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {errorPresentation.heading}
              </h2>
              <div className="mx-auto mt-2 max-w-lg space-y-2">
                <p className="text-xs text-slate-600 sm:text-sm">{error.message}</p>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {error.status === 401 ? (
                  <Link
                    href={signInHref}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    <span>Đăng nhập lại</span>
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.plan}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>Tạo lịch trình mới</span>
                  </Link>
                )}
                <Link
                  href={ROUTES.home}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-sm">home</span>
                  <span>Về trang chủ</span>
                </Link>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Đang tải kế hoạch lịch trình gợi ý…
              </p>
            </div>
          )}

          {/* Main Itinerary Content */}
          {!loading && itinerary && (
            <div className="space-y-8">
              {/* Visible DEMO_ONLY Fixture Warning Banner */}
              {itinerary.status === 'DEMO_FIXTURE' && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <span className="material-symbols-outlined text-sm">science</span>
                    <span>Bản mẫu thử nghiệm (DEMO_ONLY Fixture)</span>
                  </div>
                  <p className="mt-1">
                    Lịch trình này là bản mẫu phục vụ kiểm thử giao diện trong môi trường phát triển.
                  </p>
                </div>
              )}

              {/* Journey Header Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2.5">
                    {/* Meta Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-0.5 text-xs font-bold text-[#007d6e]">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Tối ưu bởi Thuật toán CSP
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Mã: #{itinerary.itineraryId}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        v{itinerary.version}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        itinerary.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : itinerary.status === 'Draft'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {itinerary.status}
                      </span>
                      {!itinerary.canManage && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Chỉ xem
                        </span>
                      )}
                    </div>

                    {/* Itinerary Title */}
                    <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                      {itinerary.title || 'Lịch trình khám phá'}
                    </h1>

                    {/* Destination & Date/Time Range Sub-meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 sm:text-sm">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="material-symbols-outlined text-base text-[#007d6e]">location_on</span>
                        <span>{destinationLabel}</span>
                      </div>
                      {scheduleDateLabel && (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span className="material-symbols-outlined text-base text-slate-400">calendar_today</span>
                          <span className="capitalize">{scheduleDateLabel}</span>
                        </div>
                      )}
                      {itinerary.transportMode && (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span className="material-symbols-outlined text-base text-slate-400">
                            {itinerary.transportMode === 'Walking'
                              ? 'directions_walk'
                              : itinerary.transportMode === 'Car'
                              ? 'directions_car'
                              : 'two_wheeler'}
                          </span>
                          <span>
                            {itinerary.transportMode === 'Walking'
                              ? 'Đi bộ'
                              : itinerary.transportMode === 'Car'
                              ? 'Ô tô / Taxi'
                              : 'Xe máy'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      <span>In lịch trình</span>
                    </button>

                    <Link
                      href={ROUTES.plan}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                    >
                      <span className="material-symbols-outlined text-sm">tune</span>
                      <span>Tùy chỉnh lại</span>
                    </Link>
                    {itinerary.canManage && (
                      <>
                        {itinerary.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => void applyMutation(() => acceptItinerary(itinerary.itineraryId))}
                            disabled={mutationPending}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-sm">task_alt</span>
                            <span>Chấp nhận lịch trình</span>
                          </button>
                        )}
                        {!itinerary.isNavigationInProgress && (
                        <>
                        <button
                          type="button"
                          onClick={() => {
                            const message = hasAddedRestaurant
                              ? 'Tạo phương án khác? Các quán ăn bạn đã thêm sẽ không được giữ lại vì lịch trình được tạo lại từ yêu cầu ban đầu.'
                              : 'Tạo phương án khác? TripMate sẽ ưu tiên những địa điểm chưa có trong lịch trình hiện tại; các điểm bạn muốn ghé được giữ nguyên.';
                            if (window.confirm(message)) {
                              void applyMutation(() => regenerateItinerary(itinerary.itineraryId));
                            }
                          }}
                          disabled={mutationPending}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          <span>Tạo lại lịch trình</span>
                        </button>
                        <button
                          type="button"
                          onClick={startAdjustingOrder}
                          disabled={mutationPending || editingOrder}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-sm">reorder</span>
                          <span>Chỉnh sửa thứ tự</span>
                        </button>
                        </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {itinerary.isNavigationInProgress && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
                >
                  <span className="material-symbols-outlined text-lg">smartphone</span>
                  <span>
                    Chuyến đi đang diễn ra trên ứng dụng TripMate. Lịch trình được khóa chỉnh sửa
                    cho tới khi chuyến kết thúc trên app.
                  </span>
                </div>
              )}

              {mutationError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {mutationError}
                </div>
              )}

              {editingOrder && itinerary.canManage && !itinerary.isNavigationInProgress && (
                <section className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5">
                  <h2 className="text-base font-bold text-slate-900">Sắp xếp lại các điểm tham quan</h2>
                  <p className="mt-1 text-sm text-slate-600">Điểm nghỉ được hệ thống giữ nguyên; bạn chỉ thay đổi thứ tự các điểm tham quan.</p>
                  <ol className="mt-4 space-y-2">
                    {editVisitItems.map((item, index) => (
                      <li key={item.itemId} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-2xs">
                        <span className="w-5 font-bold text-[#007d6e]">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{item.poiName ?? 'Điểm tham quan'}</span>
                        <button type="button" aria-label={`Di chuyển ${item.poiName ?? index + 1} lên`} onClick={() => moveVisit(index, -1)} disabled={index === 0 || mutationPending} className="rounded border px-2 py-1 disabled:opacity-40">↑</button>
                        <button type="button" aria-label={`Di chuyển ${item.poiName ?? index + 1} xuống`} onClick={() => moveVisit(index, 1)} disabled={index === editVisitItems.length - 1 || mutationPending} className="rounded border px-2 py-1 disabled:opacity-40">↓</button>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => applyStops(reorderStops(currentStops(itinerary.items), orderedVisitPoiIds))} disabled={mutationPending || orderedVisitPoiIds.length === 0} className="rounded-xl bg-[#007d6e] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Lưu thứ tự mới</button>
                    <button type="button" onClick={() => setEditingOrder(false)} disabled={mutationPending} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">Hủy</button>
                  </div>
                </section>
              )}

              {/* Summary Stats Cards */}
              <ItinerarySummaryCards itinerary={itinerary} />

              {/* Day Navigation */}
              {uniqueDays.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-sm text-[#007d6e]">calendar_view_day</span>
                    Lộ trình theo ngày:
                  </span>
                  <button
                      type="button"
                      onClick={() => setActiveDayKey(null)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold shadow-2xs transition ${
                        activeDayKey === null
                          ? 'border-[#007d6e] bg-teal-50 text-[#007d6e]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>Tất cả</span>
                      <span className="text-[11px] font-normal text-slate-500">({itinerary.items.length} điểm)</span>
                    </button>
                    {uniqueDays.map((d, idx) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => scrollToDay(d.key)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold shadow-2xs transition ${
                        activeDayKey === d.key
                          ? 'border-[#007d6e] bg-teal-50 text-[#007d6e]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>Ngày {idx + 1}</span>
                      <span className="text-[11px] font-normal text-slate-500">({d.count} điểm)</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 2-Column Main Content Layout: 60% Timeline + 40% Map */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 items-start">
                {/* Left Column: Timeline of Stops (60%) */}
                <div className="lg:col-span-3 min-w-0">
                  <ItineraryTimeline
                    items={itinerary.items}
                    tripStart={itinerary.validFrom}
                    tripTransportMode={itinerary.transportMode}
                    editable={canEditStops}
                    busy={mutationPending}
                    arrivalShifts={arrivalShifts}
                    onChangeLegMode={(fromPoiId, mode) =>
                      applyStops(withLegMode(currentStops(itinerary.items), fromPoiId, mode))
                    }
                    tripEnd={itinerary.validTo}
                    onReplaceStop={openReplaceSuggestions}
                    onRemoveStop={removeItem}
                    onViewReviews={setReviewsFor}
                    onAddFood={openFoodSuggestions}
                    highlightedItemId={highlightedItemId}
                    onHighlightItem={setHighlightedItemId}
                  />
                </div>

                {/* Right Column: Route Map Preview & Information (40%) */}
                <aside className="space-y-6 lg:col-span-2 lg:sticky lg:top-24">
                  {/* Real Interactive Mapbox Map: "Bản đồ lộ trình" */}
                  <section
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                    aria-label="Bản đồ lộ trình"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <span className="material-symbols-outlined text-lg text-[#007d6e]">map</span>
                        Bản đồ lộ trình
                      </h3>
                      {mapModel && mapModel.markers.length > 0 && (
                        <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#007d6e]">
                          {mapModel.markers.length} điểm mốc
                        </span>
                      )}
                    </div>

                    {!mapboxToken ? (
                      /* State 1: Missing Mapbox Access Token */
                      <div
                        data-testid="itinerary-map-fallback-no-token"
                        className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-center"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-2xs">
                          <span className="material-symbols-outlined text-2xl">location_off</span>
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                          Chưa cấu hình Mapbox Access Token
                        </h4>
                        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-600">
                          Bản đồ địa lý tương tác cần biến môi trường{' '}
                          <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono text-amber-900">
                            NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                          </code>{' '}
                          trong tệp{' '}
                          <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono text-amber-900">
                            .env.local
                          </code>{' '}
                          để tải dữ liệu bản đồ số và đường nối các điểm dừng.
                        </p>
                        <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/90 p-2.5 text-left text-[11px] text-slate-600">
                          <p className="font-semibold text-slate-800">Lưu ý hoạt động:</p>
                          <p className="mt-0.5">
                            Dòng thời gian các điểm dừng bên trái vẫn hoạt động đầy đủ với thông tin giờ đến, thứ tự và dự toán kinh phí.
                          </p>
                        </div>
                      </div>
                    ) : mapFailed ? (
                      /* State 2: Mapbox Error / WebGL failure */
                      <div
                        data-testid="itinerary-map-fallback-error"
                        className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 shadow-2xs">
                          <span className="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                          Bản đồ lộ trình chưa khả dụng
                        </h4>
                        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-600">
                          Không thể khởi tạo bản đồ Mapbox. Token có thể không hợp lệ hoặc trình duyệt chưa hỗ trợ công nghệ WebGL.
                        </p>
                      </div>
                    ) : !mapModel || mapModel.markers.length === 0 ? (
                      /* State 3: Empty / No Coordinates */
                      <div
                        data-testid="itinerary-map-fallback-no-coords"
                        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-6 text-center"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-2xs">
                          <span className="material-symbols-outlined text-2xl">pin_drop</span>
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                          Chưa có tọa độ hiển thị
                        </h4>
                        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-600">
                          Các điểm dừng trong lịch trình này chưa có dữ liệu tọa độ GPS khả dụng để đặt điểm mốc trên bản đồ.
                        </p>
                      </div>
                    ) : (
                      /* State 4: Real Interactive Mapbox Map */
                      <>
                        <LazyItineraryMap
                          token={mapboxToken}
                          model={mapModel}
                          highlightedItemId={highlightedItemId}
                          onSelectItem={selectFromMap}
                          onUnavailable={() => setMapFailed(true)}
                        />

                        {/* Selected Stop Floating/Docked Preview Card */}
                        {selectedItem && (
                          <div
                            data-testid="selected-map-stop-card"
                            className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3 shadow-xs transition-all"
                            role="region"
                            aria-label={`Chi tiết điểm dừng đã chọn: ${stopDisplayName(selectedItem)}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-xs"
                                  style={{
                                    backgroundColor:
                                      selectedItem.costKind === 'AverageSpend'
                                        ? MARKER_COLORS.food
                                        : MARKER_COLORS.attraction,
                                  }}
                                >
                                  {selectedItem.sequenceNo}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#007d6e] bg-teal-100/80 px-1.5 py-0.5 rounded">
                                      {selectedItem.costKind === 'AverageSpend' ? 'Quán ăn' : 'Điểm tham quan'}
                                    </span>
                                    {selectedItem.category && (
                                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                                        • {selectedItem.category}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="mt-0.5 truncate text-xs font-bold text-slate-900 sm:text-sm">
                                    {stopDisplayName(selectedItem)}
                                  </h4>
                                  {selectedItem.address && (
                                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                      {selectedItem.address}
                                    </p>
                                  )}
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                                    {selectedItem.plannedArrival && (
                                      <span className="flex items-center gap-1 font-medium">
                                        <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                                        Đến: {formatVietnamTime(selectedItem.plannedArrival)}
                                      </span>
                                    )}
                                    {selectedItem.stayDurationMinutes && (
                                      <span className="text-slate-500">
                                        (Dừng {formatMinutes(selectedItem.stayDurationMinutes)})
                                      </span>
                                    )}
                                    {selectedItem.estimatedCost !== null && selectedItem.estimatedCost > 0 && (
                                      <span className="font-semibold text-teal-800">
                                        ~{selectedItem.estimatedCost.toLocaleString('vi-VN')} đ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setHighlightedItemId(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-teal-100 hover:text-slate-600 transition"
                                title="Đóng chi tiết điểm dừng"
                                aria-label="Đóng chi tiết điểm dừng"
                              >
                                <span className="material-symbols-outlined text-base">close</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Map Marker Legend */}
                        <ul className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-600" aria-label="Chú thích bản đồ">
                          {MAP_LEGEND.map((entry) => (
                            <li key={entry.kind} className="flex items-center gap-1">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: MARKER_COLORS[entry.kind] }}
                              />
                              {entry.label}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[11px] text-slate-500">
                          Đường nối thẳng theo thứ tự ghé, không phải đường đi thực tế.
                        </p>
                      </>
                    )}
                  </section>

                  {/* Mobile App Sync / Live Navigation Note (UC-13 Mobile Feature) */}
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                        <span className="material-symbols-outlined text-xl">smartphone</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-sky-950 sm:text-sm">
                          Điều hướng trực tiếp trên ứng dụng di động
                        </h4>
                        <p className="mt-1 text-xs text-sky-800">
                          Tính năng dẫn đường GPS thời gian thực và Cảnh báo thay đổi lộ trình
                          được tối ưu hóa trên ứng dụng di động <strong>TripMate</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Travel Tips Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-900 sm:text-sm">
                      <span className="material-symbols-outlined text-sm text-[#007d6e]">
                        info
                      </span>
                      Lưu ý khi thực hiện chuyến đi
                    </h4>
                    <ul className="mt-3 space-y-2 text-xs text-slate-600">
                      {(() => {
                        const firstPlannedArrival = itinerary.items[0]?.plannedArrival;
                        const firstArrivalTime = firstPlannedArrival
                          ? formatVietnamTime(firstPlannedArrival)
                          : null;
                        const hasValidDepartureTime = Boolean(
                          firstArrivalTime && firstArrivalTime !== '--:--',
                        );

                        if (!hasValidDepartureTime) return null;

                        return (
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#007d6e] font-bold">•</span>
                            <span>
                              Nên xuất phát đúng giờ dự kiến ({firstArrivalTime}) để đảm bảo khớp giờ
                              mở cửa.
                            </span>
                          </li>
                        );
                      })()}
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#007d6e] font-bold">•</span>
                        <span>Chuẩn bị nước uống, kem chống nắng và điện thoại đầy pin để chụp ảnh.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#007d6e] font-bold">•</span>
                        <span>Bạn có thể xem chi tiết từng điểm tham quan bằng cách nhấp vào tên địa điểm.</span>
                      </li>
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </main>

      {suggestionTarget && itinerary && (
        <ItinerarySuggestionsDialog
          itineraryId={itinerary.itineraryId}
          query={suggestionTarget.query}
          title={suggestionTarget.title}
          nameOf={(poiId) => itinerary.items.find((entry) => entry.poiId === poiId)?.poiName ?? null}
          onChoose={chooseSuggestion}
          onClose={() => setSuggestionTarget(null)}
        />
      )}

      {reviewsFor && reviewsFor.poiId !== null && (
        <ItineraryReviewsDialog
          poiId={reviewsFor.poiId}
          name={stopDisplayName(reviewsFor)}
          onClose={() => setReviewsFor(null)}
        />
      )}

      {undoStops && itinerary && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>Đã cập nhật lịch trình.</span>
          <button
            type="button"
            onClick={undoLastEdit}
            disabled={mutationPending}
            className="rounded-lg px-2 py-1 font-bold text-teal-300 hover:bg-white/10 disabled:opacity-60"
          >
            Hoàn tác
          </button>
        </div>
      )}

      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© 2026 TripMate AI Travel Planner. Nền tảng du lịch thông minh Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}

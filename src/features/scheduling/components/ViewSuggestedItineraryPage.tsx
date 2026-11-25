'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { getMapboxPublicToken } from '@/lib/mapboxToken';
import { formatVnd } from '@/lib/priceLabel';
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
  StopRemovalReason,
  SuggestionQuery,
  vietnamDayKey,
} from '../types/schedulingTypes';
import { mergeExplanations } from '../utils/explanationRefresh';
import { handOffEdit, LastItineraryEdit, takeEditHandoff } from '../utils/itineraryEditHandoff';
import { useExplanationRefresh } from './useExplanationRefresh';
import { useItineraryWeatherTips } from './useItineraryWeatherTips';
import {
  describeProvenance,
  describeStopInfeasible,
  diffArrivalMinutes,
  formatMinutes,
  PROVENANCE_BADGE_CLASS,
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
import { ItineraryReorderDialog } from './ItineraryReorderDialog';
import { ItineraryReviewsDialog } from './ItineraryReviewsDialog';
import { LazyItineraryMap } from './maps/LazyMaps';
import { ROUTE_END_COLOR, ROUTE_LINE_COLOR, ROUTE_START_COLOR, STRAIGHT_LINE_OPACITY } from './maps/mapboxStyle';
import { ItinerarySuggestionsDialog } from './ItinerarySuggestionsDialog';
import { ItinerarySummaryCards } from './ItinerarySummaryCards';
import { ItineraryWeatherTipsCard } from './ItineraryWeatherTipsCard';
import { ItineraryTimeline } from './ItineraryTimeline';
import { StopRemovalReasonDialog } from './StopRemovalReasonDialog';
import { BookedServices } from './BookedServices';

/** How long the Undo toast stays after an edit (Review 2, D11-4). */
const UNDO_VISIBLE_MS = 8000;

const NO_SHIFTS: ReadonlyMap<number, number> = new Map();

const MAP_LEGEND: Array<{ kind: MapMarkerKind; label: string }> = [
  { kind: 'start', label: 'Xuất phát (B)' },
  { kind: 'attraction', label: 'Tham quan' },
  { kind: 'food', label: 'Ăn uống' },
  { kind: 'end', label: 'Kết thúc (K)' },
];

/** Where a chosen suggestion goes: after an item (food) or in place of a stop (replace). */
type SuggestionTarget = { query: SuggestionQuery; title: string; item: ItineraryDetailItemDto };

type PendingConfirmation =
  | {
      kind: 'overtime';
      target: SuggestionTarget;
      suggestion: ItinerarySuggestionDto;
      overflowMinutes: number;
    }
  | { kind: 'remove-mandatory'; item: ItineraryDetailItemDto }
  | { kind: 'replace-mandatory'; item: ItineraryDetailItemDto }
  | { kind: 'regenerate' };

function computeExtendedEndTime(
  itinerary: ItineraryDetailDto,
  overflowMinutes: number,
): { currentEnd: string; extendedEnd: string } | null {
  const baseIso = itinerary.validTo ?? itinerary.items[itinerary.items.length - 1]?.plannedDeparture ?? null;
  if (!baseIso) return null;
  const baseMs = Date.parse(baseIso);
  if (!Number.isFinite(baseMs)) return null;
  const currentEnd = formatVietnamTime(baseIso);
  const extendedEnd = formatVietnamTime(new Date(baseMs + overflowMinutes * 60_000).toISOString());
  if (currentEnd === '--:--' || extendedEnd === '--:--') return null;
  return { currentEnd, extendedEnd };
}

interface ViewSuggestedItineraryPageProps {
  itineraryId: string;
}

function getErrorPresentation(status?: number): { heading: string } {
  switch (status) {
    case 401:
      return { heading: 'Phiên đăng nhập đã hết hạn' };
    case 403:
      return { heading: 'Bạn không có quyền xem lịch trình này' };
    case 404:
      return { heading: 'Không tìm thấy lịch trình' };
    default:
      return { heading: 'Không thể tải chi tiết lịch trình' };
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
  // Review 2 (D11-3/4): stops whose arrival moved in the last edit, and the stops to restore on undo.
  // Tied to the version they belong to, and handed over when the edit moves the page to a new id.
  const [lastEdit, setLastEdit] = useState<LastItineraryEdit | null>(null);
  const editMatches = Boolean(lastEdit && itinerary && lastEdit.itineraryId === itinerary.itineraryId);
  const arrivalShifts = editMatches && lastEdit ? lastEdit.arrivalShifts : NO_SHIFTS;
  const undoStops = editMatches && lastEdit?.undo ? lastEdit.undo.stops : null;
  const undoUntil = lastEdit?.undo?.until ?? null;
  const [suggestionTarget, setSuggestionTarget] = useState<SuggestionTarget | null>(null);
  const [reviewsFor, setReviewsFor] = useState<ItineraryDetailItemDto | null>(null);
  const [removalFor, setRemovalFor] = useState<ItineraryDetailItemDto | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  // Map ↔ timeline synchronization and active marker selection
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);
  // The preview card opens only from a map marker. Opening it on hover changed the page height under the
  // pointer, so at the bottom of a short itinerary the page jumped and the hover toggled in a loop.
  const [pinnedItemId, setPinnedItemId] = useState<number | null>(null);
  const activeItemId = highlightedItemId ?? pinnedItemId;
  const [mapFailed, setMapFailed] = useState(false);
  // Leg shown on its own on the map (id from the map model); null = the whole route.
  const [selectedLegId, setSelectedLegId] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLElement>(null);
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

  const mapShown = Boolean(mapboxToken) && !mapFailed && mapModel !== null && mapModel.markers.length > 0;
  // Legs the map can show right now (the day tab filters the map, so a leg may be out of view).
  const selectableLegIds = useMemo(
    () => new Set<string>(mapShown && mapModel ? mapModel.legs.map((leg) => leg.id) : []),
    [mapShown, mapModel],
  );
  const activeLegId = selectedLegId !== null && selectableLegIds.has(selectedLegId) ? selectedLegId : null;

  const selectLeg = (legId: string) => {
    if (legId === activeLegId) {
      setSelectedLegId(null);
      return;
    }
    setSelectedLegId(legId);
    // Narrow screens: the map may be out of sight; 'nearest' does nothing when it is already visible.
    mapSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    if (activeLegId === null) return;
    const clearOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedLegId(null);
    };
    document.addEventListener('keydown', clearOnEscape);
    return () => document.removeEventListener('keydown', clearOnEscape);
  }, [activeLegId]);

  const selectedItem =
    pinnedItemId !== null && itineraryItems
      ? itineraryItems.find((item) => item.itemId === pinnedItemId) ?? null
      : null;

  // ADR-002 (G3): where the schedule came from; null for itineraries saved before provenance existed.
  const scheduleSource = describeProvenance(itinerary?.provenance);

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
    setPinnedItemId(itemId);
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

  // UC-10: after a create that answered explanationPending, load the detail again until the AI sentences arrive.
  useExplanationRefresh({
    itineraryId: Number(itineraryId),
    itinerary,
    onFresh: (fresh) =>
      setItinerary((current) =>
        current !== null && current.itineraryId === fresh.itineraryId
          ? mergeExplanations(current, fresh)
          : current,
      ),
  });

  // UC-10: weather tips for the day. Asked for after the itinerary loaded; null hides the card.
  const weatherTips = useItineraryWeatherTips({ itineraryId: Number(itineraryId), itinerary });

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

  const openReplaceSuggestionsDialog = (target: ItineraryDetailItemDto) =>
    setSuggestionTarget({
      query: { kind: 'Replace', replaceItemId: target.itemId },
      title: `Thay ${stopDisplayName(target)}`,
      item: target,
    });

  const openReplaceSuggestions = (target: ItineraryDetailItemDto) => {
    // D4: replacing a stop the traveler chose drops it, so it needs the same confirmation as removing it.
    if (target.isMandatory) {
      setPendingConfirm({ kind: 'replace-mandatory', item: target });
      return;
    }
    openReplaceSuggestionsDialog(target);
  };

  const commitChosenSuggestion = (target: SuggestionTarget, suggestion: ItinerarySuggestionDto) => {
    if (!itinerary) return;
    const { query, item } = target;
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

  const chooseSuggestion = (suggestion: ItinerarySuggestionDto) => {
    if (!itinerary || !suggestionTarget) return;
    if (suggestion.overflowMinutes && suggestion.overflowMinutes > 0) {
      setPendingConfirm({
        kind: 'overtime',
        target: suggestionTarget,
        suggestion,
        overflowMinutes: suggestion.overflowMinutes,
      });
      return;
    }
    commitChosenSuggestion(suggestionTarget, suggestion);
  };

  const removeItem = (item: ItineraryDetailItemDto) => {
    if (!itinerary || item.poiId === null) return;
    // D4: a stop the traveler chose is removed only after confirmation.
    if (item.isMandatory) {
      setPendingConfirm({ kind: 'remove-mandatory', item });
      return;
    }
    // UC-10 feedback (D10, D14): picking a reason removes the stop; closing the picker removes nothing.
    setRemovalFor(item);
  };

  const removeWithReason = (reason: StopRemovalReason) => {
    const poiId = removalFor?.poiId ?? null;
    setRemovalFor(null);
    if (!itinerary || poiId === null) return;
    const itineraryId = itinerary.itineraryId;
    const previousStops = currentStops(itinerary.items);
    const stops = removeStop(previousStops, poiId);
    // Only a removal sends removedStops: Undo and every other edit keep sending the plain stops list.
    void applyMutation(
      () => updateItineraryStops(itineraryId, stops, { removedStops: [{ poiId, reason }] }),
      { undoTo: previousStops },
    );
  };

  const hasAddedRestaurant = Boolean(
    itinerary?.items.some((item) => item.kind === 'Visit' && item.costKind === 'AverageSpend' && !item.isMandatory),
  );

  const startAdjustingOrder = () => {
    if (!itinerary) return;
    setMutationError(null);
    setEditingOrder(true);
  };

  const reorderableVisitItems = useMemo(
    () => itinerary?.items.filter((item) => item.kind === 'Visit' && item.poiId !== null) ?? [],
    [itinerary],
  );

  const showAcceptPrimary = Boolean(itinerary?.canManage && itinerary.status === 'Draft');

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#5B6E69]">Đang tải kế hoạch du lịch…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || userId === undefined || role !== 'Traveler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#5B6E69]"
          >
            <Link href={ROUTES.home} className="transition hover:text-[#174B4A]">
              Trang chủ
            </Link>
            <span aria-hidden="true" className="text-[#DCE2DD]">/</span>
            <Link href={ROUTES.plan} className="transition hover:text-[#174B4A]">
              Lập lịch trình
            </Link>
            <span aria-hidden="true" className="text-[#DCE2DD]">/</span>
            <span className="font-semibold text-[#1C2928]">
              Lịch trình #{itineraryId}
            </span>
          </nav>

          {/* Truthful Error Display */}
          {error && (
            <div className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center shadow-2xs">
              <h2 className="text-lg font-bold text-[#1C2928]">
                {errorPresentation.heading}
              </h2>
              <div className="mx-auto mt-2 max-w-lg space-y-2">
                <p className="text-xs text-[#5B6E69] sm:text-sm">{error.message}</p>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {error.status === 401 ? (
                  <Link
                    href={signInHref}
                    className="inline-flex items-center rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#103B39]"
                  >
                    Đăng nhập lại
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.plan}
                    className="inline-flex items-center rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#103B39]"
                  >
                    Tạo lịch trình mới
                  </Link>
                )}
                <Link
                  href={ROUTES.home}
                  className="inline-flex items-center rounded-xl border border-[#DCE2DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#1C2928] shadow-2xs transition hover:border-[#174B4A]/40 hover:bg-[#F7F5EF]"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent" />
              <p className="text-xs font-semibold text-[#5B6E69] sm:text-sm">
                Đang tải kế hoạch lịch trình gợi ý…
              </p>
            </div>
          )}

          {/* Main Itinerary Content */}
          {!loading && itinerary && (
            <div className="space-y-5">
              {/* Visible DEMO_ONLY Fixture Warning Banner */}
              {itinerary.status === 'DEMO_FIXTURE' && (
                <div className="rounded-xl border border-amber-300/80 bg-[#FEF3E2] p-4 text-xs font-medium text-amber-950 shadow-2xs">
                  <p className="font-bold text-amber-900">
                    Bản mẫu thử nghiệm (DEMO_ONLY Fixture)
                  </p>
                  <p className="mt-1">
                    Lịch trình này là bản mẫu phục vụ kiểm thử giao diện trong môi trường phát triển.
                  </p>
                </div>
              )}

              {/* SRS MSG35: the CSP did not finish in time and the fast heuristic produced this plan. */}
              {scheduleSource?.notice && (
                <div
                  data-testid="schedule-source-notice"
                  role="status"
                  className="rounded-xl border border-amber-300/80 bg-[#FEF3E2] p-4 text-xs font-medium text-amber-950 shadow-2xs"
                >
                  <p className="font-bold text-amber-900">{scheduleSource.label}</p>
                  <p className="mt-1">{scheduleSource.notice}</p>
                </div>
              )}

              {/* Journey Header Card */}
              <div className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-2xs sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Quiet Meta Status Row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          itinerary.status === 'Active'
                            ? 'bg-[#E8F0EA] text-[#174B4A]'
                            : itinerary.status === 'Draft'
                            ? 'bg-[#FEF3E2] text-[#995436]'
                            : 'bg-[#F7F5EF] text-[#5B6E69]'
                        }`}
                      >
                        {itinerary.status}
                      </span>
                      <span className="font-medium text-[#5B6E69]">#{itinerary.itineraryId}</span>
                      <span aria-hidden="true" className="text-[#DCE2DD]">•</span>
                      <span className="font-medium text-[#5B6E69]">v{itinerary.version}</span>
                      {scheduleSource && (
                        <span
                          data-testid="schedule-source-badge"
                          title={scheduleSource.detail}
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PROVENANCE_BADGE_CLASS[scheduleSource.tone]}`}
                        >
                          {scheduleSource.label}
                        </span>
                      )}
                      {!itinerary.canManage && (
                        <span className="rounded-full bg-[#FEF3E2] px-2.5 py-0.5 text-xs font-semibold text-[#995436]">
                          Chỉ xem
                        </span>
                      )}
                    </div>

                    {/* Itinerary Title */}
                    <h1 className="text-xl font-bold tracking-tight text-[#1C2928] sm:text-2xl">
                      {itinerary.title || 'Lịch trình khám phá'}
                    </h1>

                    {/* Destination & Date/Time Range Sub-meta */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#5B6E69] sm:text-sm">
                      <span>{destinationLabel}</span>
                      {scheduleDateLabel && (
                        <>
                          <span aria-hidden="true" className="text-[#DCE2DD]">•</span>
                          <span className="capitalize">{scheduleDateLabel}</span>
                        </>
                      )}
                      {itinerary.transportMode && (
                        <>
                          <span aria-hidden="true" className="text-[#DCE2DD]">•</span>
                          <span>
                            {itinerary.transportMode === 'Walking'
                              ? 'Đi bộ'
                              : itinerary.transportMode === 'Car'
                              ? 'Ô tô / Taxi'
                              : 'Xe máy'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
                    {showAcceptPrimary && (
                      <button
                        type="button"
                        onClick={() => void applyMutation(() => acceptItinerary(itinerary.itineraryId))}
                        disabled={mutationPending}
                        className="inline-flex items-center rounded-xl bg-[#174B4A] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#103B39] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Chấp nhận lịch trình
                      </button>
                    )}

                    {itinerary.canManage && !itinerary.isNavigationInProgress && (
                      <>
                        <button
                          type="button"
                          onClick={startAdjustingOrder}
                          disabled={mutationPending || editingOrder}
                          className="inline-flex items-center rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C2928] transition hover:border-[#174B4A]/40 hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Chỉnh sửa thứ tự
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingConfirm({ kind: 'regenerate' })}
                          disabled={mutationPending}
                          className="inline-flex items-center rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C2928] transition hover:border-[#174B4A]/40 hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Tạo lại lịch trình
                        </button>
                      </>
                    )}

                    <Link
                      href={ROUTES.plan}
                      className={
                        showAcceptPrimary
                          ? 'inline-flex items-center rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C2928] transition hover:border-[#174B4A]/40 hover:bg-[#F7F5EF]'
                          : 'inline-flex items-center rounded-xl bg-[#174B4A] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#103B39]'
                      }
                    >
                      Tùy chỉnh lại
                    </Link>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#5B6E69] transition hover:border-[#174B4A]/40 hover:bg-[#F7F5EF] hover:text-[#1C2928]"
                    >
                      In lịch trình
                    </button>
                  </div>
                </div>
              </div>

              {itinerary.isNavigationInProgress && (
                <div
                  role="status"
                  className="rounded-xl border border-[#174B4A]/20 bg-[#E8F0EA]/70 px-4 py-3 text-sm text-[#174B4A]"
                >
                  Chuyến đi đang diễn ra trên ứng dụng TripMate. Lịch trình được khóa chỉnh sửa
                  cho tới khi chuyến kết thúc trên app.
                </div>
              )}

              {mutationError && !editingOrder && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {mutationError}
                </div>
              )}

              {/* Summary Stats Cards */}
              <ItinerarySummaryCards itinerary={itinerary} />
              {weatherTips !== null && <ItineraryWeatherTipsCard tips={weatherTips} />}
              <BookedServices services={itinerary.bookedServices} />

              {/* Day Navigation */}
              {uniqueDays.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="shrink-0 font-semibold text-[#5B6E69]">
                    Lộ trình theo ngày:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDayKey(null)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-semibold shadow-2xs transition ${
                      activeDayKey === null
                        ? 'border-[#174B4A] bg-[#174B4A] text-white'
                        : 'border-[#DCE2DD] bg-white text-[#1C2928] hover:border-[#174B4A]/40 hover:bg-[#E8F0EA]/40'
                    }`}
                  >
                    <span>Tất cả</span>
                    <span className={`text-[11px] font-normal ${activeDayKey === null ? 'text-white/80' : 'text-[#5B6E69]'}`}>
                      ({itinerary.items.length} điểm)
                    </span>
                  </button>
                  {uniqueDays.map((d, idx) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => scrollToDay(d.key)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-semibold shadow-2xs transition ${
                        activeDayKey === d.key
                          ? 'border-[#174B4A] bg-[#174B4A] text-white'
                          : 'border-[#DCE2DD] bg-white text-[#1C2928] hover:border-[#174B4A]/40 hover:bg-[#E8F0EA]/40'
                      }`}
                    >
                      <span>Ngày {idx + 1}</span>
                      <span className={`text-[11px] font-normal ${activeDayKey === d.key ? 'text-white/80' : 'text-[#5B6E69]'}`}>
                        ({d.count} điểm)
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 2-Column Main Content Layout: 60% Timeline + 40% Map */}
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
                {/* Left Column: Timeline of Stops (60%) */}
                <div className="min-w-0 lg:col-span-3">
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
                    highlightedItemId={activeItemId}
                    onHighlightItem={setHighlightedItemId}
                    selectableLegIds={selectableLegIds}
                    selectedLegId={activeLegId}
                    onSelectLeg={selectLeg}
                  />
                </div>

                {/* Right Column: Route Map Preview & Information (40%) */}
                <aside className="space-y-4 lg:col-span-2 lg:sticky lg:top-24">
                  {/* Real Interactive Mapbox Map: "Bản đồ lộ trình" */}
                  <section
                    ref={mapSectionRef}
                    className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs"
                    aria-label="Bản đồ lộ trình"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1C2928]">
                        Bản đồ lộ trình
                      </h3>
                      {mapModel && mapModel.markers.length > 0 && (
                        <span className="rounded-full bg-[#E8F0EA] px-2.5 py-0.5 text-[11px] font-semibold text-[#174B4A]">
                          {mapModel.markers.length} điểm mốc
                        </span>
                      )}
                    </div>

                    {!mapboxToken ? (
                      /* State 1: Missing Mapbox Access Token */
                      <div
                        data-testid="itinerary-map-fallback-no-token"
                        className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-[#FEF3E2]/70 p-6 text-center"
                      >
                        <h4 className="text-sm font-bold text-[#1C2928]">
                          Chưa cấu hình Mapbox Access Token
                        </h4>
                        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#5B6E69]">
                          Bản đồ địa lý tương tác cần biến môi trường{' '}
                          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px] text-amber-900">
                            NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                          </code>{' '}
                          trong tệp{' '}
                          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px] text-amber-900">
                            .env.local
                          </code>{' '}
                          để tải dữ liệu bản đồ số và đường nối các điểm dừng.
                        </p>
                        <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/95 p-2.5 text-left text-[11px] text-[#5B6E69]">
                          <p className="font-semibold text-[#1C2928]">Lưu ý hoạt động:</p>
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
                        <h4 className="text-sm font-bold text-[#1C2928]">
                          Bản đồ lộ trình chưa khả dụng
                        </h4>
                        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#5B6E69]">
                          Không thể khởi tạo bản đồ Mapbox. Token có thể không hợp lệ hoặc trình duyệt chưa hỗ trợ công nghệ WebGL.
                        </p>
                      </div>
                    ) : !mapModel || mapModel.markers.length === 0 ? (
                      /* State 3: Empty / No Coordinates */
                      <div
                        data-testid="itinerary-map-fallback-no-coords"
                        className="flex flex-col items-center justify-center rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-6 text-center"
                      >
                        <h4 className="text-sm font-bold text-[#1C2928]">
                          Chưa có tọa độ hiển thị
                        </h4>
                        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#5B6E69]">
                          Các điểm dừng trong lịch trình này chưa có dữ liệu tọa độ GPS khả dụng để đặt điểm mốc trên bản đồ.
                        </p>
                      </div>
                    ) : (
                      /* State 4: Real Interactive Mapbox Map */
                      <>
                        <div className="relative">
                          <LazyItineraryMap
                            token={mapboxToken}
                            model={mapModel}
                            highlightedItemId={activeItemId}
                            onSelectItem={selectFromMap}
                            selectedLegId={activeLegId}
                            onUnavailable={() => setMapFailed(true)}
                          />
                          {activeLegId !== null && (
                            <button
                              type="button"
                              onClick={() => setSelectedLegId(null)}
                              className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full border border-[#DCE2DD] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#174B4A] shadow-md transition hover:bg-[#E8F0EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A]"
                            >
                              Xem toàn bộ lộ trình
                            </button>
                          )}
                        </div>

                        {/* Selected Stop Floating/Docked Preview Card */}
                        {selectedItem && (
                          <div
                            data-testid="selected-map-stop-card"
                            className="mt-3 rounded-xl border border-[#174B4A]/25 bg-[#F7F5EF] p-3.5 shadow-2xs transition-all"
                            role="region"
                            aria-label={`Chi tiết điểm dừng đã chọn: ${stopDisplayName(selectedItem)}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-start gap-2.5">
                                <span
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs"
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
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-full bg-[#E8F0EA] px-2 py-0.5 text-[10px] font-semibold text-[#174B4A]">
                                      {selectedItem.costKind === 'AverageSpend' ? 'Quán ăn' : 'Điểm tham quan'}
                                    </span>
                                    {selectedItem.category && (
                                      <span className="max-w-[150px] truncate text-[10px] font-medium text-[#5B6E69]">
                                        • {selectedItem.category}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="mt-1 truncate text-xs font-bold text-[#1C2928] sm:text-sm">
                                    {stopDisplayName(selectedItem)}
                                  </h4>
                                  {selectedItem.address && (
                                    <p className="mt-0.5 truncate text-[11px] text-[#5B6E69]">
                                      {selectedItem.address}
                                    </p>
                                  )}
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#5B6E69]">
                                    {selectedItem.plannedArrival && (
                                      <span className="font-medium text-[#1C2928]">
                                        Đến: {formatVietnamTime(selectedItem.plannedArrival)}
                                      </span>
                                    )}
                                    {selectedItem.stayDurationMinutes && (
                                      <span>
                                        Dừng {formatMinutes(selectedItem.stayDurationMinutes)}
                                      </span>
                                    )}
                                    {selectedItem.estimatedCost !== null && selectedItem.estimatedCost > 0 && (
                                      <span className="font-semibold text-[#174B4A]">
                                        ~{selectedItem.estimatedCost.toLocaleString('vi-VN')} đ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPinnedItemId(null);
                                  setHighlightedItemId(null);
                                }}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-[#5B6E69] transition hover:bg-[#DCE2DD]/50 hover:text-[#1C2928]"
                                title="Đóng chi tiết điểm dừng"
                                aria-label="Đóng chi tiết điểm dừng"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Map Marker Legend */}
                        <ul className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#5B6E69]" aria-label="Chú thích bản đồ">
                          {MAP_LEGEND.map((entry) => (
                            <li key={entry.kind} className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: MARKER_COLORS[entry.kind] }}
                              />
                              {entry.label}
                            </li>
                          ))}
                        </ul>
                        {activeLegId !== null && (
                          <p className="mt-2 text-[11px] font-medium text-[#995436]">
                            Đoạn đang xem được tô màu cam đất; các đoạn khác mờ đi.
                          </p>
                        )}
                        <ul className="mt-2.5 space-y-1 border-t border-[#DCE2DD]/70 pt-2.5 text-[11px] text-[#5B6E69]" aria-label="Chú thích đường nối">
                          <li className="flex items-center gap-2">
                            <span
                              data-testid="road-swatch"
                              aria-hidden="true"
                              className="h-1 w-6 shrink-0 rounded-full"
                              style={{ background: `linear-gradient(to right, ${ROUTE_START_COLOR}, ${ROUTE_END_COLOR})` }}
                            />
                            <span>
                              Nét liền: theo đường đi thực tế (Mapbox), đổi màu từ lúc xuất phát đến lúc kết thúc;
                              mũi tên chỉ hướng đi.
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <svg width="24" height="4" aria-hidden="true">
                              <line
                                x1="0"
                                y1="2"
                                x2="24"
                                y2="2"
                                stroke={ROUTE_LINE_COLOR}
                                strokeOpacity={STRAIGHT_LINE_OPACITY}
                                strokeWidth="3"
                                strokeDasharray="5 4"
                              />
                            </svg>
                            <span>
                              Nét đứt: chỉ nối thẳng theo thứ tự ghé khi chưa lấy được đường đi thực tế.
                            </span>
                          </li>
                        </ul>
                      </>
                    )}
                  </section>

                  {/* Mobile App Sync / Live Navigation Note (UC-13 Mobile Feature) */}
                  <div className="rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#174B4A]">
                      Ứng dụng di động
                    </p>
                    <h4 className="mt-1 text-xs font-bold text-[#1C2928] sm:text-sm">
                      Điều hướng trực tiếp trên ứng dụng di động
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-[#5B6E69]">
                      Tính năng dẫn đường GPS thời gian thực và Cảnh báo thay đổi lộ trình
                      được tối ưu hóa trên ứng dụng di động <strong className="text-[#1C2928]">TripMate</strong>.
                    </p>
                  </div>

                  {/* Travel Tips Card */}
                  <div className="rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#1C2928] sm:text-sm">
                      Lưu ý khi thực hiện chuyến đi
                    </h4>
                    <ul className="mt-2.5 space-y-2 text-xs text-[#5B6E69]">
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
                            <span className="font-bold text-[#174B4A]">•</span>
                            <span>
                              Nên xuất phát đúng giờ dự kiến ({firstArrivalTime}) để đảm bảo khớp giờ
                              mở cửa.
                            </span>
                          </li>
                        );
                      })()}
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-[#174B4A]">•</span>
                        <span>Chuẩn bị nước uống, kem chống nắng và điện thoại đầy pin để chụp ảnh.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-[#174B4A]">•</span>
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
          suspended={pendingConfirm?.kind === 'overtime'}
          onChoose={chooseSuggestion}
          onClose={() => setSuggestionTarget(null)}
        />
      )}

      {pendingConfirm && itinerary && (() => {
        if (pendingConfirm.kind === 'overtime') {
          const { target, suggestion, overflowMinutes } = pendingConfirm;
          const endTimeShift = computeExtendedEndTime(itinerary, overflowMinutes);
          const isFood = target.query.kind === 'Food';
          const costText =
            suggestion.estimatedCost === null || suggestion.estimatedCost === undefined
              ? null
              : suggestion.estimatedCost <= 0
              ? 'Miễn phí'
              : formatVnd(suggestion.estimatedCost);
          const detailParts = [
            costText,
            suggestion.closesAt ? `Đóng ${suggestion.closesAt}` : null,
          ].filter((part): part is string => Boolean(part));

          return (
            <ConfirmationDialog
              title={`Kéo dài lịch trình thêm ${formatMinutes(overflowMinutes)}?`}
              cancelLabel="Quay lại"
              confirmLabel={isFood ? 'Tiếp tục thêm quán' : 'Tiếp tục thay điểm'}
              pending={mutationPending}
              onCancel={() => setPendingConfirm(null)}
              onConfirm={() => {
                setPendingConfirm(null);
                commitChosenSuggestion(target, suggestion);
              }}
            >
              <p>
                {isFood ? 'Thêm ' : 'Thay bằng '}
                <span className="font-semibold text-[#1C2928]">{suggestion.name}</span>
                {isFood
                  ? ` sau ${stopDisplayName(target.item)}`
                  : ` thay cho ${stopDisplayName(target.item)}`}{' '}
                cần thêm thời gian di chuyển và dừng chân.
              </p>
              <div className="rounded-xl bg-[#F7F5EF] px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#5B6E69]">
                    {endTimeShift ? 'Giờ kết thúc dự kiến' : 'Thời gian kéo dài thêm'}
                  </span>
                  {endTimeShift ? (
                    <span className="font-semibold tabular-nums text-[#1C2928]">
                      <span className="font-normal text-[#5B6E69] line-through">
                        {endTimeShift.currentEnd}
                      </span>
                      <span className="mx-1.5 text-[#5B6E69]">→</span>
                      <span className="text-[13.5px] font-bold text-[#174B4A]">
                        {endTimeShift.extendedEnd}
                      </span>
                      <span className="ml-1.5 font-semibold text-[#995436]">
                        (+{formatMinutes(overflowMinutes)})
                      </span>
                    </span>
                  ) : (
                    <span className="font-semibold text-[#995436]">
                      +{formatMinutes(overflowMinutes)}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#DCE2DD]/70 pt-2 text-[#5B6E69]">
                  <span className="truncate font-medium text-[#1C2928]">{suggestion.name}</span>
                  {detailParts.length > 0 && (
                    <span className="shrink-0">{detailParts.join(' · ')}</span>
                  )}
                </div>
              </div>
            </ConfirmationDialog>
          );
        }

        if (pendingConfirm.kind === 'remove-mandatory') {
          const { item } = pendingConfirm;
          return (
            <ConfirmationDialog
              title="Bỏ điểm đã chọn bắt buộc?"
              cancelLabel="Giữ lại"
              confirmLabel="Tiếp tục bỏ điểm"
              variant="danger"
              pending={mutationPending}
              onCancel={() => setPendingConfirm(null)}
              onConfirm={() => {
                setPendingConfirm(null);
                setRemovalFor(item);
              }}
            >
              <p>
                <span className="font-semibold text-[#1C2928]">{stopDisplayName(item)}</span> là điểm bạn đã đánh dấu bắt buộc khi lập lịch. Bỏ điểm này sẽ gỡ khỏi danh sách bắt buộc của chuyến đi.
              </p>
            </ConfirmationDialog>
          );
        }

        if (pendingConfirm.kind === 'replace-mandatory') {
          const { item } = pendingConfirm;
          return (
            <ConfirmationDialog
              title="Thay điểm đã chọn bắt buộc?"
              cancelLabel="Giữ lại"
              confirmLabel="Tiếp tục thay điểm"
              variant="danger"
              pending={mutationPending}
              onCancel={() => setPendingConfirm(null)}
              onConfirm={() => {
                setPendingConfirm(null);
                openReplaceSuggestionsDialog(item);
              }}
            >
              <p>
                <span className="font-semibold text-[#1C2928]">{stopDisplayName(item)}</span> là điểm bạn đã đánh dấu bắt buộc khi lập lịch. Thay bằng địa điểm khác sẽ bỏ điểm này khỏi danh sách bắt buộc.
              </p>
            </ConfirmationDialog>
          );
        }

        return (
          <ConfirmationDialog
            title="Tạo phương án lịch trình khác?"
            cancelLabel="Hủy"
            confirmLabel="Tạo lại lịch trình"
            pendingLabel="Đang tạo lại..."
            pending={mutationPending}
            onCancel={() => setPendingConfirm(null)}
            onConfirm={() => {
              setPendingConfirm(null);
              void applyMutation(() => regenerateItinerary(itinerary.itineraryId));
            }}
          >
            <p>
              {hasAddedRestaurant
                ? 'Các quán ăn bạn đã thêm sẽ không được giữ lại vì lịch trình được tạo lại từ yêu cầu ban đầu.'
                : 'TripMate sẽ ưu tiên những địa điểm chưa có trong lịch trình hiện tại; các điểm bạn đã chọn bắt buộc vẫn được giữ nguyên.'}
            </p>
          </ConfirmationDialog>
        );
      })()}

      {reviewsFor && reviewsFor.poiId !== null && (
        <ItineraryReviewsDialog
          poiId={reviewsFor.poiId}
          name={stopDisplayName(reviewsFor)}
          onClose={() => setReviewsFor(null)}
        />
      )}

      {removalFor && (
        <StopRemovalReasonDialog
          stopName={stopDisplayName(removalFor)}
          onChoose={removeWithReason}
          onClose={() => setRemovalFor(null)}
        />
      )}

      {editingOrder && itinerary && itinerary.canManage && !itinerary.isNavigationInProgress && (
        <ItineraryReorderDialog
          items={reorderableVisitItems}
          busy={mutationPending}
          error={mutationError}
          onSave={(orderedPoiIds) =>
            applyStops(reorderStops(currentStops(itinerary.items), orderedPoiIds))
          }
          onClose={() => {
            setEditingOrder(false);
            setMutationError(null);
          }}
        />
      )}

      {undoStops && itinerary && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-[#1C2928] px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>Đã cập nhật lịch trình.</span>
          <button
            type="button"
            onClick={undoLastEdit}
            disabled={mutationPending}
            className="rounded-lg px-2 py-1 font-bold text-[#E8F0EA] hover:bg-white/10 disabled:opacity-60"
          >
            Hoàn tác
          </button>
        </div>
      )}

      <footer className="mt-14 border-t border-[#DCE2DD] bg-[#F7F5EF] py-6 text-center text-xs text-[#5B6E69]">
        <div className="mx-auto max-w-7xl px-4">
          <p>© 2026 TripMate AI Travel Planner. Nền tảng du lịch thông minh Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}

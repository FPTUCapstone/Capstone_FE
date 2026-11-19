/**
 * UC-10: carrying "the AI explanation is still being written" from the create form to the detail page, and
 * deciding when it has arrived (specs/UC-10-friendly-explanation-web-spec.md).
 *
 * The backend stores nothing about its waiting list, so the detail has no pending flag. The create response is the
 * only place that knows; it is handed over through this tab-scoped in-memory store, the same pattern as
 * `itineraryEditHandoff.ts`. A reload drops it on purpose: after a reload the stored sentences are already the AI's.
 */

import type {
  ItineraryDetailDto,
  SchedulingResponseDto,
} from '../types/schedulingTypes';

/** Seconds after the create at which the detail is loaded again (BE spec section 6). */
export const EXPLANATION_REFRESH_DELAYS_SECONDS = [20, 45, 75, 110] as const;

export interface ExplanationPendingHandoff {
  itineraryId: number;
  /** Epoch milliseconds of the create response; the refresh schedule is measured from here. */
  createdAt: number;
  /** Trimmed template sentence per `sequenceNo` as the create response returned it ('' when there was none). */
  template: ReadonlyMap<number, string>;
}

const pending = new Map<number, ExplanationPendingHandoff>();

/** Registers the response only when the backend said the AI sentences are still being written. */
export function registerExplanationPending(response: SchedulingResponseDto, now: number = Date.now()): void {
  if (response.explanationPending !== true) return;
  const template = new Map<number, string>();
  for (const item of response.items) {
    template.set(item.sequenceNo, item.friendlyExplanation?.trim() ?? '');
  }
  pending.set(response.itineraryId, { itineraryId: response.itineraryId, createdAt: now, template });
}

/** Returns and removes the entry of exactly this itinerary; other entries stay. */
export function takeExplanationPending(itineraryId: number): ExplanationPendingHandoff | null {
  const handoff = pending.get(itineraryId) ?? null;
  pending.delete(itineraryId);
  return handoff;
}

type ExplanationItem = { sequenceNo: number; friendlyExplanation?: string | null };

/** True when some stop has a non-empty sentence that differs from its template sentence. */
export function hasNewExplanation(
  template: ReadonlyMap<number, string>,
  items: readonly ExplanationItem[],
): boolean {
  return items.some((item) => {
    const sentence = item.friendlyExplanation?.trim();
    return !!sentence && sentence !== (template.get(item.sequenceNo) ?? '');
  });
}

/**
 * Takes only `friendlyExplanation` from `fresh`, matched by `sequenceNo`, so nothing else on the page (an edit in
 * progress, a newer version) is overwritten. Returns `current` itself when nothing changes.
 */
export function mergeExplanations(current: ItineraryDetailDto, fresh: ItineraryDetailDto): ItineraryDetailDto {
  const freshBySequence = new Map<number, string>();
  for (const item of fresh.items) {
    const sentence = item.friendlyExplanation?.trim();
    if (sentence) freshBySequence.set(item.sequenceNo, sentence);
  }

  let changed = false;
  const items = current.items.map((item) => {
    const sentence = freshBySequence.get(item.sequenceNo);
    if (sentence === undefined || sentence === item.friendlyExplanation) return item;
    changed = true;
    return { ...item, friendlyExplanation: sentence };
  });

  return changed ? { ...current, items } : current;
}

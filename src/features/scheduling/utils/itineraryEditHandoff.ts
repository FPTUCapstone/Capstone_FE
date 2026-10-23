/**
 * Every stop edit returns a new itinerary id, and the App Router remounts `/itinerary/[id]` for it. The
 * edit result (new version, change badges, Undo) is handed to the remounted page through this
 * tab-scoped store, keyed by the new id and read once (Review 2, D11-3/4).
 */

import type { ItineraryDetailDto, ItineraryStopInput } from '../types/schedulingTypes';

export interface LastItineraryEdit {
  /** The version these badges and this undo belong to. */
  itineraryId: number;
  /** Arrival shift in minutes per POI. */
  arrivalShifts: ReadonlyMap<number, number>;
  /** Stops to restore, until the given epoch milliseconds. */
  undo: { stops: ItineraryStopInput[]; until: number } | null;
}

interface EditHandoff {
  itinerary: ItineraryDetailDto;
  lastEdit: LastItineraryEdit | null;
}

const pending = new Map<number, EditHandoff>();

export function handOffEdit(handoff: EditHandoff): void {
  pending.set(handoff.itinerary.itineraryId, handoff);
}

export function takeEditHandoff(itineraryId: number): EditHandoff | null {
  const handoff = pending.get(itineraryId) ?? null;
  pending.delete(itineraryId);
  return handoff;
}

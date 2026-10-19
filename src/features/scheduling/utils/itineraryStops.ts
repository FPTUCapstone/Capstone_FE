/**
 * Builds the `stops` body of PUT /itineraries/{id}/items (§3.4) from the current itinerary: every edit
 * (leg mode, add, replace, remove, reorder, undo) sends the full ordered list of visits. Client mode
 * rules (§3.4, same on mobile): insert → the new stop gets no mode and the anchor keeps its own; replace →
 * the replacing stop takes the replaced stop's mode; reorder → a stop keeps its mode only while the stop
 * after it is unchanged. The last stop never carries a mode.
 */

import {
  ItineraryDetailItemDto,
  ItineraryStopInput,
  LEG_TRANSPORT_MODES,
  LegTransportMode,
} from '../types/schedulingTypes';

function isVisitStop(item: ItineraryDetailItemDto): item is ItineraryDetailItemDto & { poiId: number } {
  return item.kind === 'Visit' && item.poiId !== null;
}

function asLegMode(value: unknown): LegTransportMode | undefined {
  return LEG_TRANSPORT_MODES.includes(value as LegTransportMode)
    ? (value as LegTransportMode)
    : undefined;
}

function stop(poiId: number, mode: LegTransportMode | undefined): ItineraryStopInput {
  return mode ? { poiId, transportModeToNext: mode } : { poiId };
}

/** The last stop has no outgoing leg. */
function normalize(stops: ItineraryStopInput[]): ItineraryStopInput[] {
  return stops.map((entry, index) =>
    index === stops.length - 1 ? { poiId: entry.poiId } : entry);
}

/** Visit stops in order; each carries the mode of the leg leaving it (the next item's incoming mode). */
export function currentStops(items: ItineraryDetailItemDto[]): ItineraryStopInput[] {
  const stops: ItineraryStopInput[] = [];
  items.forEach((item, index) => {
    if (!isVisitStop(item)) return;
    stops.push(stop(item.poiId, asLegMode(items[index + 1]?.transportModeFromPrevious)));
  });
  return normalize(stops);
}

export function withLegMode(
  stops: ItineraryStopInput[],
  fromPoiId: number,
  mode: LegTransportMode,
): ItineraryStopInput[] {
  return normalize(stops.map((entry) => (entry.poiId === fromPoiId ? stop(entry.poiId, mode) : entry)));
}

/**
 * Inserts a place after the anchor item exactly like the API dry-run that filled `fitsItinerary`:
 * after the last visit at or before the anchor (a rest item anchors to the visit before it). The anchor
 * keeps its own mode for the leg to the new stop; the new stop leaves with the trip default.
 */
export function insertAfterItem(
  items: ItineraryDetailItemDto[],
  anchor: ItineraryDetailItemDto,
  poiId: number,
): ItineraryStopInput[] {
  const stops = currentStops(items);
  const insertIndex = items.filter(
    (item) => isVisitStop(item) && item.sequenceNo <= anchor.sequenceNo,
  ).length;
  const next = [...stops];
  next.splice(insertIndex, 0, { poiId });
  return normalize(next);
}

export function replaceStop(
  stops: ItineraryStopInput[],
  oldPoiId: number,
  newPoiId: number,
): ItineraryStopInput[] {
  return normalize(stops.map((entry) =>
    entry.poiId === oldPoiId ? stop(newPoiId, entry.transportModeToNext) : entry));
}

/**
 * Stops in a new order (§3.4 client rule, same on mobile): a stop keeps its mode only while the stop
 * after it is unchanged; otherwise it falls back to the trip default. A walk between two neighbours must
 * not become a walk to a different, possibly far, stop.
 */
export function reorderStops(stops: ItineraryStopInput[], orderedPoiIds: number[]): ItineraryStopInput[] {
  const nextOf = new Map(stops.map((entry, index) => [entry.poiId, stops[index + 1]?.poiId ?? null]));
  const modeOf = new Map(stops.map((entry) => [entry.poiId, entry.transportModeToNext]));
  return normalize(
    orderedPoiIds.map((poiId, index) =>
      stop(poiId, nextOf.get(poiId) === (orderedPoiIds[index + 1] ?? null) ? modeOf.get(poiId) : undefined)),
  );
}

export function removeStop(stops: ItineraryStopInput[], poiId: number): ItineraryStopInput[] {
  return normalize(stops.filter((entry) => entry.poiId !== poiId));
}

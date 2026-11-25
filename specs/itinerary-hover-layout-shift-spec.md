# Itinerary page — hover layout shift ("page jumps")

## Problem
On `/itinerary/{id}`, hovering a timeline stop set `highlightedItemId`, which also inserted the
"selected stop" preview card into the page flow below the map (~124 px). On short itineraries the right
column is taller than the timeline, so the card changed the page height. At the bottom of the page the
browser clamped the scroll position, the timeline moved under the pointer, the hover changed, and the card
toggled again: the page jumped continuously and "+ Thêm quán ăn" was hard to click.

Measured on a 3-stop itinerary, 1420×820 viewport: page height 1500 → 1624 px on hover; scroll jumped 680 → 803
without the user scrolling.

## Change
- Hover/focus on a timeline stop only highlights it (timeline ring + map marker). No layout change.
- The preview card opens from a map marker click (`pinnedItemId`) and stays until closed with ×.
- Map and timeline highlight `highlightedItemId ?? pinnedItemId`.

Overlaying the card on the map was rejected: it would cover the Mapbox attribution or the zoom controls.

## Acceptance
- Hovering a stop does not render `selected-map-stop-card`; marker and timeline still highlight.
- Clicking a marker shows the card. The card stays while the pointer moves over the timeline.
- Page height stays constant while hovering stops (manual check, 3-stop itinerary).

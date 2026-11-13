# UC-10: Honest schedule provenance on the Web (ADR-002 G3)

## Context

Backend ADR-002 G2 (`Capstone_BE` branch `feature/phuctv-uc10-weighted-personalization`) returns a `provenance` object on
the create response and on the itinerary detail:

| Field | Meaning |
|---|---|
| `solverOutcome` | How the plan was produced |
| `solverKind` | `Csp`, `CspFallback`, `Heuristic`, `MiniRouting`, or null for `manual_order` |
| `objectiveMode` | Objective used by the CSP |
| `searchCompleted` | Whether the CSP proved its plan |
| `timeOfDayRefined` | Whether the order was changed after the CSP |

Before this change the Web said "Tối ưu bởi Thuật toán CSP" and "Tối ưu hoàn tất" for every itinerary. Those claims
also appeared for heuristic fallbacks, node-limited plans and the traveler's own order. In addition:

- the form waited 1.4 s on scripted "CSP" progress steps before it sent the request;
- every 422 was replaced by a client-side estimate of missing minutes.

## Scope

1. `SchedulingProvenanceDto` and `isValidSchedulingProvenance`. Both DTO validators accept the field when it is missing or
   null, and reject it when it is malformed.
2. `describeProvenance` in `utils/itineraryPresentation.ts` is the only mapping from provenance to UI text:

   | Provenance | Label | Notice |
   |---|---|---|
   | `Csp`, search completed, order not refined | Tối ưu bởi Thuật toán CSP | — |
   | `Csp`, search not completed | Lịch tốt nhất CSP tìm được | — |
   | `Csp`, order refined for the time of day | Xếp bởi Thuật toán CSP | — |
   | `CspFallback` | Chế độ heuristic nhanh | SRS MSG35 |
   | `manual_order` | Thứ tự do bạn sắp xếp | — |
   | Other kinds | Xếp bởi thuật toán heuristic | — |
   | Missing (older itinerary) | Nothing is claimed | — |

3. Detail page:
   - the header badge comes from `describeProvenance`;
   - the MSG35 notice is shown when there is one;
   - the timeline no longer repeats "Sắp xếp tối ưu bởi thuật toán CSP".
4. Summary card 4 becomes "Nguồn lịch trình". It shows the label, or "Chưa ghi nhận" when the itinerary has no provenance.
5. Create:
   - the success message comes from `creationSuccessMessage`: MSG35 for a fallback, and an optimum claim only for a proven
     CSP plan;
   - the scripted delay and the duplicate pre-POST re-check are removed (`validate()` already checks that the start is
     in the future);
   - a 422 shows the backend reason, and the "extend the trip" quick fix remains as an option.
6. `planning.generation_timeout` (create) and `itinerary.generation_timeout` (regenerate) show a Vietnamese retry message.

## Out of scope

- Marketing copy shown before submit ("Tạo lịch trình tối ưu", the hero text).
- The UC-11 "Tối ưu lịch trình" badge for compressed visit durations.
- Demo fixtures.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

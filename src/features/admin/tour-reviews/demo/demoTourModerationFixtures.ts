import type { PendingTourPost } from '../types';

/**
 * DEMO ONLY. Deterministic sample tour posts for interface review behind the demo gate.
 * Production code paths never read these records.
 */

interface DemoTourTemplate {
  readonly tourName: string;
  readonly operatorName: string;
  readonly location: string;
  readonly category: string;
  readonly languages: string;
  readonly basePriceVnd: number;
  readonly durationHours: number;
  readonly capacity: number;
  readonly overview: string;
  readonly includedServices: readonly string[];
  readonly excludedServices: readonly string[];
  readonly cancellationPolicy: string;
  readonly stops: readonly { readonly offsetMinutes: number; readonly title: string; readonly description: string }[];
}

const TEMPLATES: readonly DemoTourTemplate[] = [
  {
    tourName: 'Hoi An Ancient Town Walking Tour',
    operatorName: 'Hoi An Heritage Travel',
    location: 'Hoi An, Quang Nam',
    category: 'Culture',
    languages: 'English, Vietnamese',
    basePriceVnd: 450000,
    durationHours: 4,
    capacity: 12,
    overview:
      'A guided walk through the ancient town covering assembly halls, old houses and the Japanese Covered Bridge.',
    includedServices: ['Licensed guide', 'Entrance tickets', 'Bottled water'],
    excludedServices: ['Lunch', 'Personal expenses'],
    cancellationPolicy: 'Full refund when cancelled at least 24 hours before departure.',
    stops: [
      { offsetMinutes: 0, title: 'Meeting point', description: 'Briefing at the ancient town ticket office.' },
      { offsetMinutes: 60, title: 'Japanese Covered Bridge', description: 'Guided visit and history talk.' },
      { offsetMinutes: 150, title: 'Tan Ky Old House', description: 'Visit to a preserved merchant house.' },
      { offsetMinutes: 240, title: 'Tour ends', description: 'Return to the meeting point.' },
    ],
  },
  {
    tourName: 'Son Tra Peninsula Morning Ride',
    operatorName: 'Da Nang Coastal Adventures',
    location: 'Son Tra, Da Nang',
    category: 'Nature',
    languages: 'English',
    basePriceVnd: 690000,
    durationHours: 5,
    capacity: 8,
    overview: 'A motorbike ride along the Son Tra coastal road with stops at viewpoints and Linh Ung Pagoda.',
    includedServices: ['Motorbike and helmet', 'Guide', 'Breakfast'],
    excludedServices: ['Travel insurance'],
    cancellationPolicy: 'Full refund when cancelled at least 48 hours before departure.',
    stops: [
      { offsetMinutes: 0, title: 'Pick-up', description: 'Hotel pick-up in the city centre.' },
      { offsetMinutes: 90, title: 'Linh Ung Pagoda', description: 'Visit to the pagoda and Lady Buddha statue.' },
      { offsetMinutes: 180, title: 'Ban Co Peak', description: 'Viewpoint stop when weather permits.' },
      { offsetMinutes: 300, title: 'Drop-off', description: 'Return to the hotel.' },
    ],
  },
  {
    tourName: 'Marble Mountains and Non Nuoc Beach',
    operatorName: 'Central Coast Journeys',
    location: 'Ngu Hanh Son, Da Nang',
    category: 'Sightseeing',
    languages: 'English, Korean',
    basePriceVnd: 520000,
    durationHours: 4,
    capacity: 15,
    overview: 'A half-day visit to the Marble Mountains caves followed by free time at Non Nuoc Beach.',
    includedServices: ['Guide', 'Entrance tickets', 'Transfer'],
    excludedServices: ['Elevator ticket', 'Drinks'],
    cancellationPolicy: 'Full refund when cancelled at least 24 hours before departure.',
    stops: [
      { offsetMinutes: 0, title: 'Pick-up', description: 'Transfer from the hotel.' },
      { offsetMinutes: 45, title: 'Thuy Son Mountain', description: 'Caves and pagodas visit.' },
      { offsetMinutes: 180, title: 'Non Nuoc Beach', description: 'Free time at the beach.' },
      { offsetMinutes: 240, title: 'Drop-off', description: 'Return transfer.' },
    ],
  },
  {
    tourName: 'Cam Thanh Coconut Village Basket Boat',
    operatorName: 'Hoi An Heritage Travel',
    location: 'Cam Thanh, Hoi An',
    category: 'Local life',
    languages: 'English, Vietnamese',
    basePriceVnd: 380000,
    durationHours: 3,
    capacity: 10,
    overview: 'A basket boat trip through the water coconut forest with a local fishing demonstration.',
    includedServices: ['Basket boat', 'Guide', 'Life jacket'],
    excludedServices: ['Tips'],
    cancellationPolicy: 'Full refund when cancelled at least 24 hours before departure.',
    stops: [
      { offsetMinutes: 0, title: 'Meeting point', description: 'Safety briefing at the village pier.' },
      { offsetMinutes: 30, title: 'Coconut forest', description: 'Basket boat ride with a local boatman.' },
      { offsetMinutes: 120, title: 'Fishing demonstration', description: 'Net casting demonstration.' },
      { offsetMinutes: 180, title: 'Tour ends', description: 'Return to the pier.' },
    ],
  },
  {
    tourName: 'Ba Na Hills Day Trip',
    operatorName: 'Da Nang Coastal Adventures',
    location: 'Hoa Vang, Da Nang',
    category: 'Sightseeing',
    languages: 'English',
    basePriceVnd: 1450000,
    durationHours: 9,
    capacity: 20,
    overview: 'A full-day trip to Ba Na Hills including the cable car and the Golden Bridge.',
    includedServices: ['Cable car ticket', 'Guide', 'Buffet lunch', 'Transfer'],
    excludedServices: ['Wax museum ticket'],
    cancellationPolicy: 'Full refund when cancelled at least 72 hours before departure.',
    stops: [
      { offsetMinutes: 0, title: 'Pick-up', description: 'Transfer from the hotel.' },
      { offsetMinutes: 60, title: 'Cable car', description: 'Ride to the mountain top.' },
      { offsetMinutes: 120, title: 'Golden Bridge', description: 'Guided visit.' },
      { offsetMinutes: 540, title: 'Drop-off', description: 'Return transfer.' },
    ],
  },
  {
    tourName: 'Da Nang Street Food Evening',
    operatorName: 'Central Coast Journeys',
    location: 'Hai Chau, Da Nang',
    category: 'Food',
    languages: 'English, Vietnamese',
    basePriceVnd: 590000,
    durationHours: 3,
    capacity: 10,
    overview: 'An evening tasting tour of local dishes at family-run stalls around Han Market.',
    includedServices: ['Food tastings', 'Guide', 'Soft drinks'],
    excludedServices: ['Alcoholic drinks'],
    cancellationPolicy: 'Full refund when cancelled at least 24 hours before departure.',
    stops: [
      { offsetMinutes: 0, title: 'Han Market', description: 'Meeting point and first tasting.' },
      { offsetMinutes: 60, title: 'Noodle stall', description: 'Mi Quang tasting.' },
      { offsetMinutes: 120, title: 'Dessert stop', description: 'Local sweet soup tasting.' },
      { offsetMinutes: 180, title: 'Tour ends', description: 'Finish near the Dragon Bridge.' },
    ],
  },
];

const DEMO_TOUR_COUNT = 24;
const SUBMITTED_BASE_UTC = Date.UTC(2026, 9, 1, 1, 0, 0);
const DEPARTURE_BASE_UTC = Date.UTC(2026, 10, 2, 1, 30, 0);
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function buildDemoTour(index: number): PendingTourPost {
  const template = TEMPLATES[index % TEMPLATES.length];
  const sequence = String(index + 1).padStart(2, '0');
  const departureMs = DEPARTURE_BASE_UTC + index * 24 * HOUR_MS;
  const edition = Math.floor(index / TEMPLATES.length) + 1;

  return {
    id: `demo-tour-${sequence}`,
    tourName: edition === 1 ? template.tourName : `${template.tourName} (Edition ${edition})`,
    operatorName: template.operatorName,
    location: template.location,
    category: template.category,
    languages: template.languages,
    submittedAtUtc: new Date(SUBMITTED_BASE_UTC + index * 7 * HOUR_MS).toISOString(),
    departureAtUtc: new Date(departureMs).toISOString(),
    priceVnd: template.basePriceVnd + edition * 10000 - 10000,
    durationHours: template.durationHours,
    capacity: template.capacity,
    imageCount: 3 + (index % 4),
    overview: template.overview,
    includedServices: template.includedServices,
    excludedServices: template.excludedServices,
    cancellationPolicy: template.cancellationPolicy,
    itinerary: template.stops.map((stop, stopIndex) => ({
      id: `demo-tour-${sequence}-stop-${stopIndex + 1}`,
      startsAtUtc: new Date(departureMs + stop.offsetMinutes * MINUTE_MS).toISOString(),
      title: stop.title,
      description: stop.description,
    })),
  };
}

export const DEMO_PENDING_TOUR_POSTS: readonly PendingTourPost[] = Array.from(
  { length: DEMO_TOUR_COUNT },
  (_, index) => buildDemoTour(index),
);

/** DEMO ONLY. Stable semantic rejection categories; the specification defines no canonical codes. */
export const DEMO_REJECTION_REASON_CATEGORIES = [
  { value: 'content', label: 'Incomplete or unclear content' },
  { value: 'images', label: 'Inappropriate or missing images' },
  { value: 'pricing', label: 'Implausible pricing' },
  { value: 'policy', label: 'Policy non-compliance' },
  { value: 'itinerary', label: 'Infeasible itinerary' },
  { value: 'other', label: 'Other' },
] as const;

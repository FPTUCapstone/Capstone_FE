import type { PendingOperatorApplication } from '../types';

/**
 * DEMO ONLY. Deterministic sample applications for interface review behind the demo gate.
 * Production code paths never read these records.
 */
const COMPANIES = [
  'Hoi An Heritage Travel',
  'Hanoi Old Quarter Cycling',
  'Mekong Delta Discovery',
  'Sapa Highland Treks',
  'Da Nang Coastal Tours',
  'Hue Imperial Journeys',
  'Phu Quoc Island Escapes',
  'Ha Long Bay Cruises',
  'Saigon Street Food Walks',
  'Dalat Pine Forest Adventures',
  'Ninh Binh Landscape Tours',
  'Nha Trang Dive Centre',
] as const;

const TOTAL = 25;
/** Index of the one sample row that has no submission date, to exercise the fallback. */
const NO_DATE_INDEX = 7;

export const DEMO_PENDING_OPERATOR_APPLICATIONS: readonly PendingOperatorApplication[] = Array.from(
  { length: TOTAL },
  (_, index) => {
    const sequence = index + 1;
    const company = COMPANIES[index % COMPANIES.length];
    return {
      userId: 9000 + sequence,
      companyName: sequence > COMPANIES.length ? `${company} ${Math.ceil(sequence / COMPANIES.length)}` : company,
      taxCode: `01${String(10000000 + sequence * 137).slice(0, 8)}`,
      businessLicenseNumber: `LIC-DEMO-${String(sequence).padStart(4, '0')}`,
      submittedAtUtc:
        index === NO_DATE_INDEX ? null : new Date(Date.UTC(2026, 9, 1 + (index % 10), 2 + (index % 12), 15)).toISOString(),
    };
  },
);

import { describe, expect, it } from 'vitest';

import {
  CSP_FALLBACK_NOTICE,
  creationSuccessMessage,
  describeProvenance,
} from '../utils/itineraryPresentation';
import { SchedulingProvenanceDto, isValidSchedulingProvenance } from '../types/schedulingTypes';

function provenance(overrides: Partial<SchedulingProvenanceDto>): SchedulingProvenanceDto {
  return {
    solverOutcome: 'csp',
    solverKind: 'Csp',
    objectiveMode: 'Lexicographic',
    searchCompleted: true,
    timeOfDayRefined: false,
    ...overrides,
  };
}

// ADR-002 (G3): the client claims "optimal by CSP" only when the backend says the CSP proved its plan.
describe('describeProvenance', () => {
  it('claims a CSP optimum only for a completed, unrefined CSP search', () => {
    expect(describeProvenance(provenance({}))).toEqual(
      expect.objectContaining({ label: 'Tối ưu bởi Thuật toán CSP', tone: 'optimal', notice: null }),
    );
  });

  it('calls a node-limited CSP plan the best one found, not an optimum', () => {
    const view = describeProvenance(provenance({ searchCompleted: false }));

    expect(view?.label).toBe('Lịch tốt nhất CSP tìm được');
    expect(view?.tone).toBe('best');
    expect(view?.label).not.toMatch(/Tối ưu/);
  });

  it('says the order was adjusted for the time of day after the CSP', () => {
    const view = describeProvenance(provenance({ timeOfDayRefined: true }));

    expect(view?.label).toBe('Xếp bởi Thuật toán CSP');
    expect(view?.detail).toMatch(/giờ trong ngày/);
  });

  it('shows the MSG35 notice for a heuristic fallback', () => {
    const view = describeProvenance(
      provenance({
        solverOutcome: 'heuristic_fallback_csp_time_limit',
        solverKind: 'CspFallback',
        searchCompleted: false,
      }),
    );

    expect(view?.tone).toBe('fallback');
    expect(view?.notice).toBe(CSP_FALLBACK_NOTICE);
    expect(view?.label).not.toMatch(/CSP/);
  });

  it('labels the traveler’s own order and plain heuristic plans without CSP claims', () => {
    expect(
      describeProvenance(provenance({ solverOutcome: 'manual_order', solverKind: null, objectiveMode: null, searchCompleted: null })),
    ).toEqual(expect.objectContaining({ label: 'Thứ tự do bạn sắp xếp', tone: 'manual' }));
    expect(
      describeProvenance(provenance({ solverOutcome: 'heuristic', solverKind: 'Heuristic', objectiveMode: null, searchCompleted: null })),
    ).toEqual(expect.objectContaining({ label: 'Xếp bởi thuật toán heuristic', tone: 'heuristic' }));
  });

  it('returns nothing for itineraries saved before provenance existed', () => {
    expect(describeProvenance(null)).toBeNull();
    expect(describeProvenance(undefined)).toBeNull();
  });
});

describe('creationSuccessMessage', () => {
  it('uses MSG35 for a fallback and claims an optimum only for a proven CSP plan', () => {
    expect(creationSuccessMessage(provenance({}))).toEqual({
      messageCode: 'MSG30',
      message: 'Khởi tạo lịch trình thành công! Thuật toán CSP đã tìm ra phương án tối ưu.',
    });
    expect(creationSuccessMessage(provenance({ searchCompleted: false })).message).not.toMatch(/tối ưu/);
    expect(
      creationSuccessMessage(provenance({ solverOutcome: 'heuristic_fallback_csp_time_limit', solverKind: 'CspFallback' })),
    ).toEqual({ messageCode: 'MSG35', message: CSP_FALLBACK_NOTICE });
    expect(creationSuccessMessage(null)).toEqual({
      messageCode: 'MSG30',
      message: 'Khởi tạo lịch trình thành công!',
    });
  });
});

describe('isValidSchedulingProvenance', () => {
  it('accepts the backend shape and rejects malformed values', () => {
    expect(isValidSchedulingProvenance(provenance({}))).toBe(true);
    expect(isValidSchedulingProvenance(provenance({ solverKind: null, objectiveMode: null, searchCompleted: null }))).toBe(true);
    expect(isValidSchedulingProvenance({ ...provenance({}), solverOutcome: 7 })).toBe(false);
    expect(isValidSchedulingProvenance({ ...provenance({}), timeOfDayRefined: 'yes' })).toBe(false);
    expect(isValidSchedulingProvenance('csp')).toBe(false);
  });
});

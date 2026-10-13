import { describe, expect, it } from 'vitest';

import { DEMO_PENDING_OPERATOR_APPLICATIONS } from '../demo/demoOperatorApplicationFixtures';
import {
  OPERATOR_APPLICATION_PAGE_SIZE,
  getPendingOperatorApplications,
} from './operatorApplicationQueueService';

describe('getPendingOperatorApplications', () => {
  it('returns NO_BACKEND and never touches fixtures when the demo gate is closed', () => {
    expect(getPendingOperatorApplications({ page: 1, keyword: '' }, { demo: false })).toEqual({
      status: 'NO_BACKEND',
    });
  });

  it('pages demo rows 20 at a time (CR-01)', () => {
    expect(OPERATOR_APPLICATION_PAGE_SIZE).toBe(20);
    const first = getPendingOperatorApplications({ page: 1, keyword: '' }, { demo: true });
    if (first.status !== 'DEMO') throw new Error('expected DEMO');
    expect(first.items).toHaveLength(20);
    expect(first.totalCount).toBe(DEMO_PENDING_OPERATOR_APPLICATIONS.length);
    expect(first.totalPages).toBe(Math.ceil(DEMO_PENDING_OPERATOR_APPLICATIONS.length / 20));

    const second = getPendingOperatorApplications({ page: 2, keyword: '' }, { demo: true });
    if (second.status !== 'DEMO') throw new Error('expected DEMO');
    expect(second.items.length).toBe(DEMO_PENDING_OPERATOR_APPLICATIONS.length - 20);
    expect(second.items[0]).not.toEqual(first.items[0]);
  });

  it('clamps an out-of-range page to the last page', () => {
    const result = getPendingOperatorApplications({ page: 999, keyword: '' }, { demo: true });
    if (result.status !== 'DEMO') throw new Error('expected DEMO');
    expect(result.page).toBe(result.totalPages);
  });

  it('filters case-insensitively by company name, tax code and licence number', () => {
    const sample = DEMO_PENDING_OPERATOR_APPLICATIONS[0];
    for (const keyword of [sample.companyName.toUpperCase(), sample.taxCode, sample.businessLicenseNumber]) {
      const result = getPendingOperatorApplications({ page: 1, keyword }, { demo: true });
      if (result.status !== 'DEMO') throw new Error('expected DEMO');
      expect(result.items.map((item) => item.userId)).toContain(sample.userId);
    }
  });

  it('returns an empty first page with one total page when nothing matches', () => {
    const result = getPendingOperatorApplications({ page: 4, keyword: 'zzz-no-match' }, { demo: true });
    expect(result).toMatchObject({ status: 'DEMO', items: [], totalCount: 0, page: 1, totalPages: 1 });
  });

  it('contains at least one demo row without a submission date to exercise the fallback', () => {
    expect(DEMO_PENDING_OPERATOR_APPLICATIONS.some((item) => item.submittedAtUtc === null)).toBe(true);
  });
});

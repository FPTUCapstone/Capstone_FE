import { describe, expect, it } from 'vitest';
import { readStatementPage, safePayOsCheckout } from './commission';

describe('monthly commission contract', () => {
  it('reads the paginated backend contract instead of silently discarding statements', () => {
    const result = readStatementPage({ data: { items: [{ id: 1, period: '2026-10', eligibleBaseVnd: 100000, commissionRateSnapshot: .1, commissionAmountVnd: 10000, status: 'Issued', allowedActions: ['Pay'] }], totalCount: 1, pageNumber: 1, pageSize: 20 } });
    expect(result.items[0].commissionAmountVnd).toBe(10000);
    expect(result.totalCount).toBe(1);
    expect(() => readStatementPage({ unexpected: [] })).toThrow();
  });
  it('only opens HTTPS payOS checkout addresses', () => {
    expect(safePayOsCheckout('https://pay.payos.vn/web/a')).toBe(true);
    expect(safePayOsCheckout('https://payos.vn.attacker.test/')).toBe(false);
    expect(safePayOsCheckout('javascript:alert(1)')).toBe(false);
    expect(safePayOsCheckout('http://pay.payos.vn/web/a')).toBe(false);
    expect(safePayOsCheckout('https://attacker@pay.payos.vn/web/a')).toBe(false);
  });
});

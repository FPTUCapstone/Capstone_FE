import { beforeEach, describe, expect, it, vi } from 'vitest';

import { searchSelectablePois } from '../services/placeSearchApi';

describe('searchSelectablePois', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
  });

  it('asks the API to leave restaurants out for must-see places (Review 2, D2)', async () => {
    await searchSelectablePois({ query: 'bảo tàng', excludeFoodAndDrink: true });

    const url = String(vi.mocked(global.fetch).mock.calls[0][0]);
    expect(new URL(url, 'http://localhost').searchParams.get('excludeFoodAndDrink')).toBe('true');
  });

  it('does not send the flag otherwise', async () => {
    await searchSelectablePois({ query: 'bảo tàng' });

    const url = String(vi.mocked(global.fetch).mock.calls[0][0]);
    expect(new URL(url, 'http://localhost').searchParams.has('excludeFoodAndDrink')).toBe(false);
  });
});

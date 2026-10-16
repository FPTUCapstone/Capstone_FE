import { describe, expect, it } from 'vitest';

import robots from './robots';

describe('robots.txt (Review 2, Terra review policy)', () => {
  it('keeps crawlers away from the Tripadvisor review paths served through the Web origin', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallowed = rules.flatMap((rule) =>
      rule.disallow === undefined ? [] : Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow],
    );

    expect(disallowed).toContain('/api/v1/pois/*/external-reviews');
    expect(rules.some((rule) => rule.userAgent === '*')).toBe(true);
  });
});

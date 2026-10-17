import { describe, expect, it } from 'vitest';

import { usableDecisionMessage } from './decisionMessage';

describe('Backend decision message handling', () => {
  it('returns a trimmed plain-text Backend message', () => {
    expect(usableDecisionMessage('  Application rejected. Notification sent to operator.  ')).toBe(
      'Application rejected. Notification sent to operator.',
    );
  });

  it.each([
    ['missing', undefined],
    ['null', null],
    ['non-string', 42],
    ['empty', ''],
    ['whitespace', '   '],
    ['raw message identifier', 'MSG116'],
    ['raw message identifier with spaces', ' msg-116 '],
    ['markup', '<b>Approved</b>'],
    ['overlong', 'a'.repeat(301)],
  ])('rejects a %s message', (_label, value) => {
    expect(usableDecisionMessage(value)).toBeNull();
  });
});

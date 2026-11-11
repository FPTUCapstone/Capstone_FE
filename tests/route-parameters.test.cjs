/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readdirSync } = require('node:fs');
const { join, relative, resolve, sep } = require('node:path');
const { loadTs } = require('./load-ts.cjs');

test('App Router uses consistent dynamic parameter names at each URL position', () => {
  const appRoot = resolve(__dirname, '../app');
  const namesByPosition = new Map();
  const conflicts = new Set();

  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        inspect(path);
        continue;
      }
      if (!/^(page|route)\.[cm]?[jt]sx?$/.test(entry.name)) continue;
      const segments = relative(appRoot, directory).split(sep)
        .filter((segment) => segment && !/^\(.*\)$/.test(segment) && !segment.startsWith('@'));
      const position = [];
      for (const segment of segments) {
        const match = /^(\[\[\.\.\.(.+)\]\]|\[\.\.\.(.+)\]|\[(.+)\])$/.exec(segment);
        if (!match) {
          position.push(segment);
          continue;
        }
        const kind = match[2] ? 'optional-catchall' : match[3] ? 'catchall' : 'dynamic';
        const key = [...position, `<${kind}>`].join('/');
        const previous = namesByPosition.get(key);
        if (previous && previous !== segment) conflicts.add(`${key}: ${previous} conflicts with ${segment}`);
        namesByPosition.set(key, segment);
        position.push(`<${kind}>`);
      }
    }
  }

  inspect(appRoot);
  assert.deepEqual([...conflicts], [], 'Conflicting parameter names prevent Next.js from starting');
});

for (const method of ['GET', 'POST', 'PUT']) {
  test(`booking review ${method} forwards the captured string bookingId unchanged`, async () => {
    const bookingId = '9223372036854775807';
    const request = new Request(`http://localhost/api/v1/bookings/${bookingId}/review`, { method });
    const expectedResponse = new Response(null, { status: 204 });
    const calls = [];
    const handler = loadTs('app/api/v1/bookings/[bookingId]/review/route.ts', {
      '@/features/reviews/services/canonicalReviewProxy': {
        proxyCanonicalReview: async (...args) => {
          calls.push(args);
          return expectedResponse;
        },
      },
    });
    assert.equal(await handler[method](request, { params: Promise.resolve({ bookingId }) }), expectedResponse);
    assert.deepEqual(calls, [[request, 'commerceBooking', bookingId]]);
  });
}

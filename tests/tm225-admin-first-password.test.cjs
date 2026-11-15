/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

test('signed admin sessions preserve a first-password restriction', () => {
  const { createAdminSessionSeal, verifyAdminSession } = loadTs('src/lib/server/adminSession.ts');
  const nowMs = Date.now();
  const secret = Buffer.alloc(32, 19).toString('base64url');
  const token = 'opaque-token';
  const sealed = createAdminSessionSeal({ token, role: 'Staff', expiresAt: new Date(nowMs + 600000), nowMs, secret, mustChangePassword: true });
  assert.ok(sealed);
  assert.equal(verifyAdminSession({ token, seal: sealed.seal, nowMs, secret }).mustChangePassword, true);
});

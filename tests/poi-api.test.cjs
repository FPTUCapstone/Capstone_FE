/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { createPoi, loadCatalogue, PoiApiError } = loadTs('src/features/admin/create-poi/services/poi-api.ts');

test('create sends flat DTO once and only accepts a real 201 response with ID', async () => {
  const previous = global.fetch;
  let calls = 0;
  global.fetch = async (url, init) => {
    calls++; assert.equal(url, '/api/admin/pois'); assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { name: 'Real POI', confirmDuplicate: false });
    return Response.json({ id: 42, name: 'Real POI', status: 'Active' }, { status: 201 });
  };
  try { assert.equal((await createPoi({ name: 'Real POI', confirmDuplicate: false })).id, 42); assert.equal(calls, 1); }
  finally { global.fetch = previous; }
});
test('conflict preserves BE duplicate ID and validation preserves nested errors', async () => {
  const previous = global.fetch;
  try {
    global.fetch = async () => Response.json({ errorCode: 'Poi.PossibleDuplicate', existingPoiId: 88 }, { status: 409 });
    await assert.rejects(createPoi({}), e => e instanceof PoiApiError && e.status === 409 && e.existingPoiId === 88);
    global.fetch = async () => Response.json({ errors: { 'openingHours[0].closeTime': ['Invalid time'] } }, { status: 400 });
    await assert.rejects(createPoi({}), e => e.errors['openingHours[0].closeTime'][0] === 'Invalid time');
  } finally { global.fetch = previous; }
});
test('network, non-JSON failures and malformed success cannot become successful saves', async () => {
  const previous = global.fetch;
  try {
    for (const response of [new Response('<html>failure</html>', { status: 502 }), Response.json({}, { status: 201 }), Response.json({ id: 1 }, { status: 201 }), Response.json({ id: 1, name: 'A', status: 'Invalid' }, { status: 201 }), Response.json({ id: 1 }, { status: 200 })]) {
      global.fetch = async () => response;
      await assert.rejects(createPoi({}), PoiApiError);
    }
    global.fetch = async () => { throw new TypeError('fetch failed'); };
    await assert.rejects(createPoi({}), e => e instanceof PoiApiError && e.status === 0);
    global.fetch = async () => Response.json({ categories: [{ id: 'fake', name: 'Wrong' }], tags: [] });
    await assert.rejects(loadCatalogue(), PoiApiError);
  } finally { global.fetch = previous; }
});

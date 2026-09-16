/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { toCreatePoiRequest, validatePoiForm, createEmptyPoiForm, mapPoiErrors } = loadTs('src/features/admin/create-poi/services/poi-contract.ts');
const valid = () => ({ ...createEmptyPoiForm(), name: ' A ', category_id: '12', latitude: '0', longitude: '180', tags: [41], operating_schedule: [{ day_of_week: 1, day_name: 'Monday', open_time: '07:00', close_time: '17:30', is_open: true }] });

test('flat BE contract uses real IDs, zero coordinates, trimmed text and TimeOnly format', () => {
  const data = valid();
  data.environment_setting = 'Mixed'; data.avg_visit_duration_minutes = '90'; data.has_shelter = true;
  assert.deepEqual(validatePoiForm(data), {});
  assert.deepEqual(toCreatePoiRequest(data), { name: 'A', categoryId: 12, latitude: 0, longitude: 180, address: null, description: null, indoorOutdoor: 'Mixed', averageVisitDurationMinutes: 90, hasShelter: true, tagIds: [41], openingHours: [{ dayOfWeek: 1, openTime: '07:00:00', closeTime: '17:30:00', isClosed: false }], confirmDuplicate: false });
});
test('closed days send null times; optional duration blank uses BE default', () => {
  const data = valid(); data.avg_visit_duration_minutes = ''; data.operating_schedule[0].is_open = false;
  const dto = toCreatePoiRequest(data, true);
  assert.equal(dto.averageVisitDurationMinutes, null);
  assert.equal(dto.confirmDuplicate, true);
  assert.deepEqual(dto.openingHours[0], { dayOfWeek: 1, openTime: null, closeTime: null, isClosed: true });
});
test('blank coordinates cannot silently become zero; duration must fit positive Int32', () => {
  for (const value of ['', ' ', 'Infinity', '91']) assert.ok(validatePoiForm({ ...valid(), latitude: value }).latitude);
  for (const value of ['0', '-1', '1.5', '2147483648']) assert.ok(validatePoiForm({ ...valid(), avg_visit_duration_minutes: value }).avg_visit_duration_minutes);
  assert.equal(validatePoiForm({ ...valid(), name: 'AB' }).name, undefined);
  assert.ok(validatePoiForm({ ...valid(), category_id: '1.5' }).category_id);
  assert.ok(validatePoiForm({ ...valid(), tags: [1, 1] }).tags);
});
test('opening hours reject malformed, inverted, overnight and duplicate day entries', () => {
  for (const [open, close] of [['07:00 AM', '17:00'], ['18:00', '07:00'], ['08:00', '08:00'], ['25:00', '26:00']]) {
    const data = valid(); data.operating_schedule[0].open_time = open; data.operating_schedule[0].close_time = close;
    assert.ok(validatePoiForm(data)['operating_schedule.1']);
  }
  const data = valid(); data.operating_schedule.push({ ...data.operating_schedule[0] });
  assert.ok(validatePoiForm(data).operating_schedule);
});
test('field errors map camelCase and nested BE row indices to UI day keys', () => {
  const data = valid();
  assert.deepEqual(mapPoiErrors({ categoryId: ['Missing category'], 'openingHours[0].closeTime': ['Invalid closing time'], tagIds: ['Missing tag'] }, data), { category_id: 'Missing category', 'operating_schedule.1': 'Invalid closing time', tags: 'Missing tag' });
});

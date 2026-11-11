import { describe, expect, it } from 'vitest';

import { InvalidTicketResponseError, parseTicket } from './ticketResponse';

const ticketFields = (over: Record<string, string> = {}) => ({
  ticketId: '77',
  ticketCode: '"TK-0000000456"',
  bookingId: '456',
  bookingCode: '"BK-20261017-00001"',
  ticketStatus: '"Valid"',
  tour: '{"tourId":45,"title":"Hoi An Lantern Tour"}',
  operatorName: '"Hoi An Travel Co."',
  schedule:
    '{"startAtUtc":"2026-10-30T01:00:00+00:00","endAtUtc":"2026-10-30T10:00:00+00:00","meetingPoint":"Old Town gate"}',
  participantCount: '3',
  participants: '{"adult":2,"child":1,"infant":0}',
  validity:
    '{"departureDate":"2026-10-30","timeZone":"Asia/Ho_Chi_Minh","validFromUtc":"2026-10-29T17:00:00+00:00","validUntilUtc":"2026-10-30T16:59:59.9999999+00:00"}',
  checkedInAtUtc: 'null',
  qr: '{"content":"TM1.token.signature","issuedAtUtc":"2026-10-24T08:15:00+00:00"}',
  ...over,
});

const body = (fields: Record<string, string>) =>
  `{${Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `"${key}":${value}`)
    .join(',')}}`;

const without = (key: string) => {
  const fields: Record<string, string> = ticketFields();
  delete fields[key];
  return fields;
};

describe('parseTicket', () => {
  it('parses the contract example with ids as decimal strings', () => {
    expect(parseTicket(body(ticketFields()))).toEqual({
      ticketId: '77',
      ticketCode: 'TK-0000000456',
      bookingId: '456',
      bookingCode: 'BK-20261017-00001',
      ticketStatus: 'Valid',
      tour: { tourId: '45', title: 'Hoi An Lantern Tour' },
      operatorName: 'Hoi An Travel Co.',
      schedule: {
        startAtUtc: '2026-10-30T01:00:00+00:00',
        endAtUtc: '2026-10-30T10:00:00+00:00',
        meetingPoint: 'Old Town gate',
      },
      participantCount: 3,
      participants: { adult: 2, child: 1, infant: 0 },
      validity: {
        departureDate: '2026-10-30',
        timeZone: 'Asia/Ho_Chi_Minh',
        validFromUtc: '2026-10-29T17:00:00+00:00',
        validUntilUtc: '2026-10-30T16:59:59.9999999+00:00',
      },
      checkedInAtUtc: null,
      qr: { content: 'TM1.token.signature', issuedAtUtc: '2026-10-24T08:15:00+00:00' },
    });
  });

  it('keeps ids above 2^53 exact', () => {
    const parsed = parseTicket(body(ticketFields({ ticketId: '9007199254740993', bookingId: '9223372036854775807' })));

    expect(parsed.ticketId).toBe('9007199254740993');
    expect(parsed.bookingId).toBe('9223372036854775807');
  });

  it('accepts every contract status', () => {
    for (const status of ['NotYetActive', 'Valid', 'Used', 'Cancelled', 'Expired']) {
      expect(parseTicket(body(ticketFields({ ticketStatus: `"${status}"` }))).ticketStatus).toBe(status);
    }
  });

  it('accepts a null qr, a null meeting point and a check-in time', () => {
    const parsed = parseTicket(
      body(
        ticketFields({
          ticketStatus: '"Used"',
          qr: 'null',
          checkedInAtUtc: '"2026-10-30T00:20:00+00:00"',
          schedule:
            '{"startAtUtc":"2026-10-30T01:00:00+00:00","endAtUtc":"2026-10-30T10:00:00+00:00","meetingPoint":null}',
        }),
      ),
    );

    expect(parsed.qr).toBeNull();
    expect(parsed.schedule.meetingPoint).toBeNull();
    expect(parsed.checkedInAtUtc).toBe('2026-10-30T00:20:00+00:00');
  });

  it('drops fields the contract does not define', () => {
    const parsed = parseTicket(body(ticketFields({ internalNote: '"secret"' })));

    expect(parsed).not.toHaveProperty('internalNote');
  });

  it.each([
    ['an unknown status', body(ticketFields({ ticketStatus: '"Lost"' }))],
    ['a missing ticket id', body(without('ticketId'))],
    ['a missing validity', body(without('validity'))],
    ['a non-object qr', body(ticketFields({ qr: '"TM1.token.signature"' }))],
    ['a qr without content', body(ticketFields({ qr: '{"issuedAtUtc":"2026-10-24T08:15:00+00:00"}' }))],
    ['a zero id', body(ticketFields({ ticketId: '0' }))],
    ['a malformed departure date', body(ticketFields({ validity: '{"departureDate":"30/10/2026","timeZone":"Asia/Ho_Chi_Minh","validFromUtc":"2026-10-29T17:00:00+00:00","validUntilUtc":"2026-10-30T16:59:59+00:00"}' }))],
    ['a negative participant count', body(ticketFields({ participantCount: '-1' }))],
    ['an array body', '[]'],
    ['malformed JSON', '{"ticketId":'],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseTicket(raw)).toThrow(InvalidTicketResponseError);
  });
});

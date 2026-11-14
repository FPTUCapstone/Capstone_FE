import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendSupportMessage, safeSourcePath, SupportChatError } from './supportChatService';

afterEach(() => vi.unstubAllGlobals());

describe('support chat service', () => {
  it.each(['adults=2&children=-1', 'adults=2&children=51', 'adults=50&infants=1',
    'adults=2&children=1&children=2', 'children=1', 'adults=2&infants=1.5'])('rejects unsafe mixed counts %s', async counts => {
    const actions = [{ type: 'navigate', label: 'Book', url: `/tours/101/book?scheduleId=11004&${counts}` }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Review', sources: [], actions }))));
    await expect(sendSupportMessage({ message: 'Book', history: [] }, 'token')).rejects.toBeInstanceOf(SupportChatError);
  });
  it('accepts all participant categories in a server-created booking link', async () => {
    const actions = [{ type: 'navigate', label: 'Book', url: '/tours/101/book?scheduleId=11004&adults=2&children=1&infants=0' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Review', sources: [], actions }))));
    await expect(sendSupportMessage({ message: 'Book', history: [] }, 'token')).resolves.toMatchObject({ actions });
  });
  it('uses the authenticated JSON contract and preserves decimal IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Help', sources: [] })));
    vi.stubGlobal('fetch', fetchMock);
    const request = { message: 'Help', history: [], context: { kind: 'refund' as const, id: '9007199254740993' } };
    const controller = new AbortController();
    await expect(sendSupportMessage(request, 'token', controller.signal)).resolves.toEqual({ answer: 'Help', sources: [] });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/support-chat/messages'), expect.objectContaining({
      method: 'POST', credentials: 'include', signal: controller.signal,
      headers: expect.objectContaining({ Authorization: 'Bearer token' }), body: JSON.stringify(request),
    }));
  });

  it.each([
    { message: '', history: [] },
    { message: ' '.repeat(2), history: [] },
    { message: 'a'.repeat(2001), history: [] },
    { message: 'Hi', history: Array.from({ length: 11 }, () => ({ role: 'user', content: 'Hi' })) },
    { message: 'Hi', history: [{ role: 'user', content: 'a'.repeat(2001) }] },
    { message: 'Hi', history: [{ role: 'system', content: 'Hi' }] },
    { message: 'Hi', history: [{ role: 'user', content: '   ' }] },
    { message: 'Hi', history: [{ role: 'assistant', content: '' }] },
    { message: 'Hi', history: [], context: { kind: 'refund', id: '0' } },
    { message: 'Hi', history: [], context: { kind: 'tour', id: '1\n' } },
    { message: 'Hi', history: [], context: { kind: 'refund', id: '1.2' } },
    { message: 'Hi', history: [], context: { kind: 'refund', id: '9223372036854775808' } },
  ])('rejects invalid requests before fetching %#', async (request) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // Exercise the untrusted request boundary as well as typed callers.
    await expect(sendSupportMessage(request as Parameters<typeof sendSupportMessage>[0], 'token')).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 404, 429, 503])('maps ProblemDetails HTTP %s to a safe error', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'Private internal detail' }), { status })));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).rejects.toMatchObject({ status });
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).rejects.not.toThrow('Private internal detail');
  });

  it('rejects missing credentials and malformed responses', async () => {
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, '')).rejects.toMatchObject({ status: 401 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).rejects.toBeInstanceOf(SupportChatError);
  });

  it('normalizes a general answer with context null to an absent optional context', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'General guidance', sources: [], context: null }))));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).resolves.toEqual({ answer: 'General guidance', sources: [] });
  });

  it('accepts the maximum Int64 context ID without precision loss', async () => {
    const context = { kind: 'refund' as const, id: '9223372036854775807' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Guidance', sources: [], context }))));
    await expect(sendSupportMessage({ message: 'Hi', history: [], context }, 'token')).resolves.toMatchObject({ context });
  });

  it.each(['/account/trips/12', '/itinerary/9007199254740993', '/tours?q=test'])('allows internal source %s', (url) => {
    expect(safeSourcePath(url)).toBe(url);
  });
  it.each(['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', '/%2fevil.test', '/a/../b', '/a\nb'])('rejects unsafe source %s', (url) => {
    expect(safeSourcePath(url)).toBeNull();
  });
});


describe('server-created support actions', () => {
  const request = { message: 'Find a tour', history: [], context: { kind: 'tour' as const, id: '9223372036854775807' } };
  const actions = [
    { type: 'navigate', label: 'Book tour', url: '/tours/12/book?scheduleId=9007199254740993&adults=2', description: 'Review your booking' },
    { type: 'selectContext', label: 'My trip', context: { kind: 'itinerary', id: '15' }, prompt: 'Show this trip' },
  ];
  it('accepts tour context and typed server actions without losing decimal IDs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Available tours', sources: [], context: request.context, actions }))));
    await expect(sendSupportMessage(request, 'token')).resolves.toEqual({ answer: 'Available tours', sources: [], context: request.context, actions });
  });
  it.each([
    {}, [{ type: 'execute', label: 'Run' }], [{ type: 'navigate', label: '   ', url: '/account/trips' }],
    [{ type: 'navigate', label: 'Go', url: 'javascript:alert(1)' }],
    ...['//evil.test', 'https://evil.test/tours/1', '/admin', '/partners/bookings', '/tours/0', '/tours/1\n', '/tours/1/book?adults=2\n', '/tours/9223372036854775808', '/tours/1/../2', '/tours/%31', '/tours/1#x', '/tours/1?next=//evil.test', '/tours/1/book?adults=2&next=/admin', '/tours/1/book?scheduleId=0', '/tours/1/book?adults=0', '/tours/1/book?adults=51', '/tours/1/book?adults=1.5', '/tours/1/book?adults=9007199254740992', '/tours/1/book?adults=2&adults=3', '/account/trips/1', '/bookings/1/delete'].map(url => [{ type: 'navigate', label: 'Go', url }]),
    [{ type: 'selectContext', label: 'Choose', context: { kind: 'tour', id: '0' }, prompt: 'Details' }],
    [{ type: 'selectContext', label: 'Choose', context: { kind: 'tour', id: '1' } }],
    [{ type: 'selectContext', label: 'Choose', context: { kind: 'tour', id: '1' }, prompt: ' '.repeat(2) }],
    [{ type: 'selectContext', label: 'Choose', context: { kind: 'tour', id: '1' }, prompt: 'a'.repeat(2001) }],
    [{ type: 'navigate', label: 'Go', url: '/account/trips', unexpected: true }],
    [{ type: 'navigate', label: 'Go', url: '/account/trips', context: { kind: 'refund', id: '1' } }],
  ].map(actions => ({ actions })))('fails safely for malformed or unsafe actions %#', async ({ actions }) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Help', sources: [], actions }))));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).rejects.toMatchObject({ status: 503 });
  });
  it.each(['/tours/12', '/account/trips', '/itinerary/9007199254740993', '/bookings/12/refund', '/bookings/12/ticket', '/bookings/12/pay'])('accepts known internal action route %s', async (url) => {
    const actions = [{ type: 'navigate', label: 'Open', url }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Help', sources: [], actions }))));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).resolves.toMatchObject({ actions });
  });
});


describe('canonical Backend support action payloads', () => {
  it('normalizes null optional actions to absence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Guidance', sources: [], context: null, actions: null }))));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).resolves.toEqual({ answer: 'Guidance', sources: [] });
  });
  it('accepts nullable inactive fields and known server-appended destinations', async () => {
    const actions = [
      ...['/tours', '/itineraries', '/partner/bookings', '/tours/12/book?scheduleId=15&adults=2'].map(url => ({ type: 'navigate', label: 'Open', url, context: null, prompt: null, description: null })),
      { type: 'selectContext', label: 'Choose', url: null, context: { kind: 'refund', id: '9007199254740993' }, prompt: 'Show this refund', description: null },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Guidance', sources: [], context: null, actions }))));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).resolves.toEqual({ answer: 'Guidance', sources: [], actions: [
      ...['/tours', '/itineraries', '/partner/bookings', '/tours/12/book?scheduleId=15&adults=2'].map(url => ({ type: 'navigate', label: 'Open', url })),
      { type: 'selectContext', label: 'Choose', context: { kind: 'refund', id: '9007199254740993' }, prompt: 'Show this refund' },
    ] });
  });
  it.each([
    { type: 'navigate', label: 'Open', url: '/tours', prompt: 'Unexpected prompt' },
    { type: 'selectContext', label: 'Choose', url: '/tours', context: { kind: 'tour', id: '12' }, prompt: 'Show tour' },
    { type: 'navigate', label: 'Open', url: '/partner/bookings?next=/admin' },
    { type: 'navigate', label: 'Open', url: '/itineraries/12' },
  ])('rejects nonnull conflicting fields and unapproved routes %#', async action => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Guidance', sources: [], actions: [action] }))));
    await expect(sendSupportMessage({ message: 'Hi', history: [] }, 'token')).rejects.toMatchObject({ status: 503 });
  });
});

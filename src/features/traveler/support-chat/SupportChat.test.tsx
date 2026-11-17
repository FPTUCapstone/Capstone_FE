import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';
import { SupportChat } from './SupportChat';
import { sendSupportMessage, SupportChatError } from './services/supportChatService';
import { openSupportChat } from './supportChatEvents';

const route = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));

vi.mock('./services/supportChatService', async (importOriginal) => ({
  ...await importOriginal<typeof import('./services/supportChatService')>(), sendSupportMessage: vi.fn(),
}));
vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({ status: AuthStorage.getContext() ? 'authenticated' : 'unauthenticated', context: AuthStorage.getContext() }),
}));

function login(userId = 1, role = 'Traveler') {
  AuthStorage.accept({ userId, role, fullName: 'Traveler', email: 'user@example.test', status: 'Active',
    accessToken: `token-${userId}`, accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' }, false);
}
function openChat() { fireEvent.click(screen.getByRole('button', { name: 'Support chat' })); }
function send(message = 'How do refunds work?') {
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: message } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  route.pathname = '/';
  AuthStorage.clear();
  login();
  vi.mocked(sendSupportMessage).mockResolvedValue({ answer: 'Refund guidance', sources: [] });
});

describe('SupportChat', () => {
  it('opens the planner action requested from a tour page', async () => {
    route.pathname = '/tours/101';
    vi.mocked(sendSupportMessage).mockResolvedValue({
      answer: 'Bạn có thể lập lịch trình tại đây.', sources: [],
      actions: [{ type: 'navigate', label: 'Lập lịch trình', url: '/plan' }],
    });
    render(<SupportChat />); openChat(); send('Dẫn tôi tới trang lập tình trình');
    const link = await screen.findByRole('link', { name: 'Lập lịch trình' });
    expect(link.getAttribute('href')).toBe('/plan');
    expect(screen.queryByRole('link', { name: 'Xem tour và lịch khởi hành' })).toBeNull();
    link.addEventListener('click', event => event.preventDefault());
    fireEvent.click(link);
    expect(screen.queryByRole('log')).toBeNull();
  });

  it('keeps a complete Unicode character when bounding assistant history', async () => {
    const answer = `${'a'.repeat(1999)}🌴 more`;
    vi.mocked(sendSupportMessage).mockResolvedValue({ answer, sources: [] });
    render(<SupportChat />); openChat(); send('First question');
    await screen.findByText(answer);
    send('Follow-up question');
    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledTimes(2));
    expect(vi.mocked(sendSupportMessage).mock.calls[1][0].history[1].content).toBe('a'.repeat(1999));
  });

  it('opens with the refund selected by a contextual entry point and preserves history', async () => {
    render(<SupportChat />); openChat(); send();
    await screen.findByText('Refund guidance');
    act(() => openSupportChat({ kind: 'refund', id: '9007199254740993' }));
    expect(screen.getByText('Refund guidance')).toBeDefined();
    expect(screen.getByText('refund #9007199254740993')).toBeDefined();
    send('What is the status?');
    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledTimes(2));
    expect(vi.mocked(sendSupportMessage).mock.calls[1][0]).toEqual({ message: 'What is the status?', history: [
      { role: 'user', content: 'How do refunds work?' }, { role: 'assistant', content: 'Refund guidance' },
    ],
      context: { kind: 'refund', id: '9007199254740993' } });
  });

  it('excludes itinerary context for operators', () => {
    route.pathname = '/itinerary/12';
    login(1, 'TourOperator'); render(<SupportChat />); openChat();
    expect(screen.queryByRole('button', { name: 'Clear context' })).toBeNull();
    act(() => openSupportChat({ kind: 'itinerary', id: '12' }));
    expect(screen.queryByLabelText('Context ID')).toBeNull();
  });
  it.each(['Traveler', 'TourOperator'])('provides an entry point for %s', (role) => {
    login(1, role);
    render(<SupportChat />);
    expect(screen.getByRole('button', { name: 'Support chat' })).toBeDefined();
  });
  it.each(['Administrator', 'Staff', 'Guest'])('hides chat for %s', (role) => {
    if (role === 'Guest') AuthStorage.clear(); else login(1, role);
    render(<SupportChat />);
    expect(screen.queryByRole('button', { name: 'Support chat' })).toBeNull();
  });

  it('sends explicit context and renders answer as text with safe sources', async () => {
    vi.mocked(sendSupportMessage).mockResolvedValue({ answer: '<b>Guidance</b>', sources: [
      { id: '1', title: 'Refund policy', url: '/account/trips' },
      { id: '2', title: 'Unsafe source', url: '//evil.test' },
    ] });
    const { container } = render(<SupportChat />);
    openChat();
    act(() => openSupportChat({ kind: 'refund', id: '9007199254740993' }));
    send();
    expect(await screen.findByText('<b>Guidance</b>')).toBeDefined();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByRole('link', { name: 'Refund policy' }).closest('details')?.hasAttribute('open')).toBe(false);
    fireEvent.click(screen.getByText('Sources (2)'));
    expect(screen.getByRole('link', { name: 'Refund policy' }).getAttribute('href')).toBe('/account/trips');
    expect(screen.queryByRole('link', { name: 'Unsafe source' })).toBeNull();
    expect(sendSupportMessage).toHaveBeenCalledWith({ message: 'How do refunds work?', history: [],
      context: { kind: 'refund', id: '9007199254740993' } }, 'token-1', expect.any(AbortSignal));
  });

  it('retries the same failed request and announces pending state', async () => {
    vi.mocked(sendSupportMessage).mockRejectedValueOnce(new SupportChatError(503));
    render(<SupportChat />);
    openChat(); send();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Refund guidance')).toBeDefined();
    expect(vi.mocked(sendSupportMessage).mock.calls[0][0]).toEqual(vi.mocked(sendSupportMessage).mock.calls[1][0]);
  });

  it.each([429, 503])('invalidates retry after editing a draft following a %s error', async (status) => {
    vi.mocked(sendSupportMessage).mockRejectedValueOnce(new SupportChatError(status));
    render(<SupportChat />);
    openChat(); send();
    await screen.findByRole('button', { name: 'Retry' });

    const input = screen.getByLabelText('Message') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'My updated question' } });

    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input.value).toBe('My updated question');
    expect(sendSupportMessage).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Refund guidance');
    expect(sendSupportMessage).toHaveBeenCalledTimes(2);
    expect(vi.mocked(sendSupportMessage).mock.calls[1][0]).toEqual({ message: 'My updated question', history: [] });
    expect(input.value).toBe('');
    expect(screen.getByRole('log').textContent).toContain('My updated question');
    expect(screen.getByRole('log').textContent).not.toContain('How do refunds work?');
  });

  it('bounds history and excludes sources from subsequent requests', async () => {
    render(<SupportChat />); openChat();
    for (let index = 0; index < 7; index++) {
      send(`Question ${index}`);
      await waitFor(() => expect(screen.getByLabelText('Message').hasAttribute('disabled')).toBe(false));
    }
    const request = vi.mocked(sendSupportMessage).mock.calls[6][0];
    expect(request.history).toHaveLength(10);
    expect(request.history[0]).toEqual({ role: 'user', content: 'Question 1' });
  });

  it('handles keyboard send, multiline input and Escape focus restoration', async () => {
    render(<SupportChat />); openChat();
    const input = screen.getByLabelText('Message');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(sendSupportMessage).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByText('Refund guidance');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Support chat' }));
  });

  it('offers relogin on 401 without allowing retry', async () => {
    vi.mocked(sendSupportMessage).mockRejectedValueOnce(new SupportChatError(401));
    render(<SupportChat />); openChat(); send();
    expect(await screen.findByRole('link', { name: 'Sign in again' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    const input = screen.getByLabelText('Message');
    expect(input.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled')).toBe(true);
    fireEvent.change(input, { target: { value: 'My updated question' } });
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Sign in again' })).toBeDefined();
    expect(input.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled')).toBe(true);
    fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form')!);
    expect(sendSupportMessage).toHaveBeenCalledTimes(1);
  });

  it('aborts on session replacement and discards the stale response', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof sendSupportMessage>>) => void;
    vi.mocked(sendSupportMessage).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const view = render(<SupportChat />); openChat(); send('Private question');
    const signal = vi.mocked(sendSupportMessage).mock.calls[0][2];
    login(2); view.rerender(<SupportChat />);
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve({ answer: 'Private reply', sources: [] }));
    openChat();
    expect(screen.queryByText('Private reply')).toBeNull();
    expect(screen.queryByText('Private question')).toBeNull();
  });

  it('allows page navigation while the original reply completes with its original context', async () => {
    route.pathname = '/itinerary/12';
    const view = render(<SupportChat />); openChat(); send();
    await screen.findByText('Refund guidance');
    let resolve!: (value: Awaited<ReturnType<typeof sendSupportMessage>>) => void;
    vi.mocked(sendSupportMessage).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    send('Itinerary question');
    const signal = vi.mocked(sendSupportMessage).mock.calls[1][2];
    route.pathname = '/itinerary/13';
    view.rerender(<SupportChat />);
    expect(signal?.aborted).toBe(false);
    await act(async () => resolve({ answer: 'Old itinerary reply', sources: [] }));
    expect(screen.getByText('Old itinerary reply')).toBeDefined();
    expect(screen.getByText('Refund guidance')).toBeDefined();
    send('New question');
    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledTimes(3));
    expect(vi.mocked(sendSupportMessage).mock.calls[2][0]).toMatchObject({
      context: { kind: 'itinerary', id: '13' }, history: [
        { role: 'user', content: 'How do refunds work?' }, { role: 'assistant', content: 'Refund guidance' },
        { role: 'user', content: 'Itinerary question' }, { role: 'assistant', content: 'Old itinerary reply' },
      ],
    });
  });

  it('does not steal focus from the web page when a reply finishes', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof sendSupportMessage>>) => void;
    vi.mocked(sendSupportMessage).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    render(<><input aria-label="Page search" /><SupportChat /></>);
    openChat(); send();
    const pageInput = screen.getByLabelText('Page search');
    pageInput.focus();
    fireEvent.change(pageInput, { target: { value: 'Đà Nẵng' } });
    await act(async () => resolve({ answer: 'Reply in background', sources: [] }));
    expect(document.activeElement).toBe(pageInput);
    expect((pageInput as HTMLInputElement).value).toBe('Đà Nẵng');
  });

  it('cancels on disposal and clears history after logout', async () => {
    vi.mocked(sendSupportMessage).mockImplementationOnce(() => new Promise(() => {}));
    const view = render(<SupportChat />); openChat(); send();
    const signal = vi.mocked(sendSupportMessage).mock.calls[0][2];
    AuthStorage.clear(); view.rerender(<SupportChat />);
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole('button', { name: 'Support chat' })).toBeNull();
    login(); view.rerender(<SupportChat />); openChat();
    expect(screen.getByRole('log').textContent).toBe('');
    send();
    const nextSignal = vi.mocked(sendSupportMessage).mock.calls[1][2];
    view.unmount();
    expect(nextSignal?.aborted).toBe(true);
  });

  it('clears history when logout and same-user login are batched', async () => {
    render(<SupportChat />); openChat(); send('Private question');
    await screen.findByText('Refund guidance');
    act(() => { AuthStorage.clear(); login(); });
    expect(screen.queryByText('Private question')).toBeNull();
    expect(screen.queryByText('Refund guidance')).toBeNull();
  });
});


describe('unified support conversation', () => {
  it.each([
    ['/tours/9007199254740993', 'tour', '9007199254740993'],
    ['/tours/12/book', 'tour', '12'],
    ['/itinerary/12', 'itinerary', '12'], ['/bookings/15/refund', 'refund', '15'],
  ])('infers %s context without manual selectors', async (pathname, kind, id) => {
    route.pathname = pathname;
    render(<SupportChat />); openChat();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByLabelText('Context ID')).toBeNull();
    expect(screen.getByText(`${kind} #${id}`)).toBeDefined();
    send('Find tours for tomorrow');
    await screen.findByText('Refund guidance');
    expect(vi.mocked(sendSupportMessage).mock.calls[0][0]).toMatchObject({ context: { kind, id } });
  });

  it.each(['/tours/0', '/itinerary/9223372036854775808', '/tours/12/edit', '/bookings/12/pay'])('ignores unsupported page context %s', async pathname => {
    route.pathname = pathname;
    render(<SupportChat />); openChat(); send();
    await screen.findByText('Refund guidance');
    expect(vi.mocked(sendSupportMessage).mock.calls[0][0].context).toBeUndefined();
  });

  it('keeps messages on close/reopen and clears transient memory with Clear chat', async () => {
    render(<SupportChat />); openChat(); send();
    await screen.findByText('Refund guidance');
    fireEvent.click(screen.getByRole('button', { name: 'Close support chat' }));
    openChat();
    expect(screen.getByText('Refund guidance')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Clear chat' }));
    expect(screen.getByRole('log').textContent).toBe('');
    send('Fresh question');
    await screen.findByText('Refund guidance');
    expect(vi.mocked(sendSupportMessage).mock.calls[1][0].history).toEqual([]);
  });

  it('selects a server-suggested record and sends its prompt with the same history', async () => {
    vi.mocked(sendSupportMessage).mockResolvedValueOnce({ answer: 'Choose your trip', sources: [], actions: [
      { type: 'navigate', label: 'Book this tour', url: '/tours/12/book?scheduleId=15&adults=2', description: 'Review the departure' },
      { type: 'selectContext', label: 'My itinerary', context: { kind: 'itinerary', id: '9007199254740993' }, prompt: 'Show this itinerary', description: 'Your saved trip' },
    ] });
    render(<SupportChat />); openChat(); send('Show my trips');
    await screen.findByText('Choose your trip');
    expect(screen.getByRole('link', { name: /Book this tour/ }).getAttribute('href')).toBe('/tours/12/book?scheduleId=15&adults=2');
    expect(screen.getByText('Your saved trip')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /My itinerary/ }));
    await screen.findByText('Refund guidance');
    expect(vi.mocked(sendSupportMessage).mock.calls[1][0]).toEqual({
      message: 'Show this itinerary', context: { kind: 'itinerary', id: '9007199254740993' },
      history: [{ role: 'user', content: 'Show my trips' }, { role: 'assistant', content: 'Choose your trip' }],
    });
    expect(screen.getByText('Choose your trip')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Clear context' }));
    send('General question');
    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledTimes(3));
    expect(vi.mocked(sendSupportMessage).mock.calls[2][0].context).toBeUndefined();
    expect(vi.mocked(sendSupportMessage).mock.calls[2][0].history).toHaveLength(4);
  });

  it('cancels pending work when clearing chat and discards its late reply', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof sendSupportMessage>>) => void;
    vi.mocked(sendSupportMessage).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    render(<SupportChat />); openChat(); send();
    const signal = vi.mocked(sendSupportMessage).mock.calls[0][2];
    fireEvent.click(screen.getByRole('button', { name: 'Clear chat' }));
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve({ answer: 'Discard me', sources: [] }));
    expect(screen.queryByText('Discard me')).toBeNull();
  });

  it('uses one scroll container with the header and composer outside it', async () => {
    const { container } = render(<SupportChat />); openChat(); send();
    await screen.findByText('Refund guidance');
    const scrollers = container.querySelectorAll('.overflow-y-auto');
    expect(scrollers).toHaveLength(1);
    expect(scrollers[0].contains(screen.getByRole('log'))).toBe(true);
    expect(scrollers[0].contains(screen.getByLabelText('Message'))).toBe(false);
    expect(scrollers[0].contains(screen.getByRole('heading', { name: 'TripMate support' }))).toBe(false);
  });
});


it('closes the panel on a navigation handoff and retains the transcript on reopen', async () => {
  vi.mocked(sendSupportMessage).mockResolvedValueOnce({ answer: 'Review your booking', sources: [], actions: [
    { type: 'navigate', label: 'Book tour', url: '/tours/12/book?scheduleId=15&adults=2' },
  ] });
  render(<SupportChat />); openChat(); send();
  const link = await screen.findByRole('link', { name: 'Book tour' });
  link.addEventListener('click', event => event.preventDefault());
  fireEvent.click(link);
  expect(screen.queryByRole('region', { name: 'Support conversation' })).toBeNull();
  openChat();
  expect(screen.getByText('Review your booking')).toBeDefined();
});


it('keeps canSend guards for blank and oversized keyboard submissions', () => {
  render(<SupportChat />); openChat();
  const input = screen.getByLabelText('Message');
  for (const message of ['   ', 'a'.repeat(2001)]) {
    fireEvent.change(input, { target: { value: message } });
    expect(screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled')).toBe(true);
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form')!);
  }
  expect(sendSupportMessage).not.toHaveBeenCalled();
});

it('ignores foreign-user and malformed explicit context events', async () => {
  render(<SupportChat />); openChat(); send();
  await screen.findByText('Refund guidance');
  for (const detail of [
    { userId: 2, context: { kind: 'refund', id: '12' } },
    { userId: 1, context: { kind: 'tour', id: '9223372036854775808' } },
  ]) {
    act(() => window.dispatchEvent(new CustomEvent('tripmate:support-chat-open', { detail })));
  }
  expect(screen.getByText('Refund guidance')).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Clear context' })).toBeNull();
});

it('keeps sign-in recovery after clearing context, clearing chat and page navigation', async () => {
  route.pathname = '/tours/12';
  vi.mocked(sendSupportMessage).mockRejectedValueOnce(new SupportChatError(401));
  const view = render(<SupportChat />); openChat(); send();
  await screen.findByRole('link', { name: 'Sign in again' });
  fireEvent.click(screen.getByRole('button', { name: 'Clear context' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear chat' }));
  route.pathname = '/tours/13'; view.rerender(<SupportChat />);
  expect(screen.getByRole('link', { name: 'Sign in again' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled')).toBe(true);
  expect(sendSupportMessage).toHaveBeenCalledTimes(1);
});


it('retains a failed suggested prompt for editing and invalidates its retry on edit', async () => {
  vi.mocked(sendSupportMessage)
    .mockResolvedValueOnce({ answer: 'Choose a record', sources: [], actions: [
      { type: 'selectContext', label: 'This tour', context: { kind: 'tour', id: '12' }, prompt: 'Show this departure' },
    ] })
    .mockRejectedValueOnce(new SupportChatError(503));
  render(<SupportChat />); openChat(); send();
  await screen.findByRole('button', { name: 'This tour' });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Show this departure' } });
  fireEvent.click(screen.getByRole('button', { name: 'This tour' }));
  await screen.findByRole('button', { name: 'Retry' });
  expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe('Show this departure');
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Show a different departure' } });
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await screen.findByText('Refund guidance');
  expect(vi.mocked(sendSupportMessage).mock.calls[2][0]).toEqual({
    message: 'Show a different departure', context: { kind: 'tour', id: '12' },
    history: [{ role: 'user', content: 'How do refunds work?' }, { role: 'assistant', content: 'Choose a record' }],
  });
});


it('preserves an unrelated typed draft when selecting a suggested record', async () => {
  vi.mocked(sendSupportMessage).mockResolvedValueOnce({ answer: 'Choose a record', sources: [], actions: [
    { type: 'selectContext', label: 'This record', context: { kind: 'tour', id: '12' }, prompt: 'Show departure' },
  ] });
  render(<SupportChat />); openChat(); send();
  await screen.findByRole('button', { name: 'This record' });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'My unsent question' } });
  fireEvent.click(screen.getByRole('button', { name: 'This record' }));
  await screen.findByText('Refund guidance');
  expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe('My unsent question');
});

it('preserves the transcript and cancels a pending reply for an explicit refund handoff', async () => {
  render(<SupportChat />); openChat(); send();
  await screen.findByText('Refund guidance');
  let resolve!: (value: Awaited<ReturnType<typeof sendSupportMessage>>) => void;
  vi.mocked(sendSupportMessage).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  send('Pending question');
  const signal = vi.mocked(sendSupportMessage).mock.calls[1][2];
  act(() => openSupportChat({ kind: 'refund', id: '15' }));
  expect(signal?.aborted).toBe(true);
  await act(async () => resolve({ answer: 'Stale reply', sources: [] }));
  expect(screen.queryByText('Stale reply')).toBeNull();
  expect(screen.getByText('Refund guidance')).toBeDefined();
  send('Refund question');
  await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledTimes(3));
  expect(vi.mocked(sendSupportMessage).mock.calls[2][0].history).toHaveLength(2);
  expect(vi.mocked(sendSupportMessage).mock.calls[2][0].context).toEqual({ kind: 'refund', id: '15' });
});


it('clears an expired-session error across batched logout and same-user login', async () => {
  vi.mocked(sendSupportMessage).mockRejectedValueOnce(new SupportChatError(401));
  render(<SupportChat />); openChat(); send();
  await screen.findByRole('link', { name: 'Sign in again' });
  act(() => { AuthStorage.clear(); login(); });
  openChat();
  expect(screen.queryByRole('alert')).toBeNull();
  send('New session question');
  await screen.findByText('Refund guidance');
});

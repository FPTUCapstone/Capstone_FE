'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AuthStorage } from '@/features/auth/session/authSession';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ActionButton } from '@/components/ui/ActionButton';
import { fieldClassName } from '@/components/ui/FormControls';
import {
  sendSupportMessage, safeSourcePath, SupportChatError, isChatContext,
  type ChatAction, type ChatContext, type ChatMessage, type ChatRequest, type ChatSource,
} from './services/supportChatService';
import { SUPPORT_CHAT_OPEN_EVENT, type SupportChatOpenDetail } from './supportChatEvents';
import { SupportChatAnswer } from './SupportChatAnswer';

type DisplayMessage = ChatMessage & { sources?: ChatSource[]; actions?: ChatAction[] };

export function SupportChat() {
  const { status, context } = useWebSession();
  if (status !== 'authenticated' || !context || !['Traveler', 'TourOperator'].includes(context.role)) return null;
  // Credential replacement also discards old conversations after reauthentication.
  return <SupportChatPanel key={`${context.userId}:${context.accessToken}`} accessToken={context.accessToken} allowItinerary={context.role === 'Traveler'} />;
}

function SupportChatPanel({ accessToken, allowItinerary }: { accessToken: string; allowItinerary: boolean }) {
  const id = useId();
  const pathname = usePathname();
  const pageMatch = /^(?:\/tours\/([0-9]+)(?:\/book)?|\/itinerary\/([0-9]+)|\/bookings\/([0-9]+)\/refund)$/.exec(pathname ?? '');
  const pageContext = pageMatch ? {
    kind: pageMatch[1] ? 'tour' : pageMatch[2] ? 'itinerary' : 'refund',
    id: pageMatch[1] ?? pageMatch[2] ?? pageMatch[3],
  } : undefined;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [selection, setSelection] = useState<{ pathname: string; context: ChatContext | null } | null>(null);
  const selectedContext = selection?.pathname === pathname ? selection.context :
    isChatContext(pageContext) && (allowItinerary || pageContext.kind !== 'itinerary') ? pageContext : undefined;
  const [pending, setPending] = useState<ChatRequest | null>(null);
  const [failed, setFailed] = useState<ChatRequest | null>(null);
  const [error, setError] = useState<SupportChatError | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  // Adjust route-bound state together while retaining the transcript across navigation.
  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    setSelection(null);
  }

  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, pending, error, open]);

  const cancelPending = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setPending(null);
    setFailed(null);
    setError(previous => previous?.status === 401 ? previous : null);
  }, []);

  const resetConversation = useCallback(() => {
    cancelPending();
    setMessages([]);
    setDraft('');
  }, [cancelPending, setMessages, setDraft]);

  useEffect(() => AuthStorage.subscribe(() => {
    if (AuthStorage.getAccessToken() !== accessToken) {
      resetConversation();
      setError(null);
      setSelection(null);
      setOpen(false);
    }
  }), [accessToken, resetConversation]);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<SupportChatOpenDetail>).detail;
      const session = AuthStorage.getContext();
      if (!detail || !isChatContext(detail.context) || session?.accessToken !== accessToken ||
        detail.userId !== session.userId || (!allowItinerary && detail.context.kind === 'itinerary')) return;
      cancelPending();
      setSelection({ pathname, context: detail.context });
      setOpen(true);
      inputRef.current?.focus();
    }
    window.addEventListener(SUPPORT_CHAT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SUPPORT_CHAT_OPEN_EVENT, onOpen);
  }, [accessToken, allowItinerary, pathname, cancelPending]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  async function submit(request: ChatRequest) {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(request);
    setFailed(null);
    setError(null);
    const isCurrent = () => !controller.signal.aborted && requestRef.current === controller &&
      AuthStorage.getAccessToken() === accessToken;
    try {
      const response = await sendSupportMessage(request, accessToken, controller.signal);
      if (!isCurrent()) return;
      setMessages((previous) => [...previous,
        { role: 'user', content: request.message },
        { role: 'assistant', content: response.answer, sources: response.sources, actions: response.actions },
      ]);
      setDraft(current => current.trim() === request.message.trim() ? '' : current);
    } catch (cause) {
      if (!isCurrent()) return;
      setFailed(request);
      setError(cause instanceof SupportChatError ? cause : new SupportChatError(503));
    } finally {
      if (isCurrent()) {
        setPending(null);
        requestRef.current = null;
      }
    }
  }

  const canSend = !!draft.trim() && draft.length <= 2000 && !pending && error?.status !== 401;

  function requestFor(message: string, context?: ChatContext | null): ChatRequest {
    return { message,
      // A UTF-16 length limit can cut an emoji between its surrogate code units.
      history: messages.slice(-10).map(({ role, content }) => ({
        role, content: content.slice(0, 2000).replace(/[\uD800-\uDBFF]$/, ''),
      })),
      ...(context ? { context } : {}),
    };
  }

  function sendDraft() {
    if (!canSend) return;
    void submit(requestFor(draft.trim(), selectedContext));
  }

  function selectAction(action: Extract<ChatAction, { type: 'selectContext' }>) {
    if (requestRef.current || pending || error?.status === 401 || (!allowItinerary && action.context.kind === 'itinerary')) return;
    cancelPending();
    setSelection({ pathname, context: action.context });
    void submit(requestFor(action.prompt, action.context));
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] font-sans text-brand-textPrimary [--font-sans:var(--font-geist-sans)] sm:bottom-6 sm:right-6">
      {open ? (
        <section id={id} aria-label="Support conversation" onKeyDown={(event) => {
          if (event.key === 'Escape') { event.stopPropagation(); close(); }
        }} className="pointer-events-auto mb-3 flex max-h-[calc(100dvh-6rem)] w-[26rem] max-w-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-2xl">
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-brand-border px-4 py-2">
            <h2 className="font-bold">TripMate support</h2>
            <button type="button" onClick={close} className="min-h-11 min-w-11 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-teal" aria-label="Close support chat">Close</button>
          </header>
          {selectedContext ? <div className="flex shrink-0 items-center justify-between gap-2 border-b border-brand-border px-4 py-1 text-xs">
            <span className="min-w-0 break-words">{selectedContext.kind} #{selectedContext.id}</span>
            <button type="button" aria-label="Clear context" className="min-h-11 min-w-11 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-teal" onClick={() => {
              cancelPending(); setSelection({ pathname, context: null });
            }}>Clear</button>
          </div> : null}
          <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" data-lenis-prevent>
            {!messages.length ? <p className="mb-3 text-sm text-brand-textSecondary">Ask about tours, bookings, refunds, or itineraries.</p> : null}
            <div role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions text" className="space-y-3">
              {messages.map((message, index) => (
                <article key={index} className={`rounded-xl p-3 text-sm ${message.role === 'user' ? 'bg-brand-lightTeal' : 'bg-brand-surface'}`}>
                  <p className="mb-2 text-xs font-medium text-brand-textSecondary">{message.role === 'user' ? 'You' : 'TripMate support'}</p>
                  {message.role === 'assistant' ? <SupportChatAnswer text={message.content} /> :
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed [overflow-wrap:anywhere]">{message.content}</p>}
                  {message.actions?.length ? <ul className="mt-3 space-y-2" aria-label="Suggested actions">
                    {message.actions.map((action, actionIndex) => <li key={actionIndex}>
                      {action.type === 'navigate' ? <Link href={action.url} prefetch={false} onClick={close}
                        className="block min-h-11 rounded-xl border border-brand-border bg-white p-3 focus-visible:ring-2 focus-visible:ring-brand-teal">
                        <span className="block break-words font-semibold [overflow-wrap:anywhere]">{action.label}</span>
                        {action.description ? <span className="mt-1 block break-words text-xs text-brand-textSecondary [overflow-wrap:anywhere]">{action.description}</span> : null}
                      </Link> : <button type="button" onClick={() => selectAction(action)}
                        disabled={!!pending || error?.status === 401 || (!allowItinerary && action.context.kind === 'itinerary')}
                        className="block min-h-11 w-full rounded-xl border border-brand-border bg-white p-3 text-left focus-visible:ring-2 focus-visible:ring-brand-teal disabled:opacity-60">
                        <span className="block break-words font-semibold [overflow-wrap:anywhere]">{action.label}</span>
                        {action.description ? <span className="mt-1 block break-words text-xs text-brand-textSecondary [overflow-wrap:anywhere]">{action.description}</span> : null}
                      </button>}
                    </li>)}
                  </ul> : null}
                  {message.sources?.length ? <details className="mt-3 border-t border-brand-border pt-1 text-xs text-brand-textSecondary">
                    <summary className="min-h-11 cursor-pointer content-center rounded-lg focus-visible:ring-2 focus-visible:ring-brand-teal">Sources ({message.sources.length})</summary>
                    <ul className="space-y-1" aria-label="Sources">
                    {message.sources.map((source, sourceIndex) => {
                      const href = safeSourcePath(source.url);
                      return <li key={`${source.id}-${sourceIndex}`} className="break-words [overflow-wrap:anywhere]">
                        {href ? <Link href={href} prefetch={false} className="inline-flex min-h-11 items-center underline focus-visible:ring-2 focus-visible:ring-brand-teal">{source.title}</Link> : source.title}
                      </li>;
                    })}
                    </ul>
                  </details> : null}
                </article>
              ))}
              {pending ? <p className="whitespace-pre-wrap break-words text-sm">{pending.message}</p> : null}
            </div>
            {pending ? <p role="status" className="mt-3 text-sm">Support is replying…</p> : null}
            {error ? <div className="mt-3 text-sm">
              <p role="alert">{error.message}</p>
              {error.status === 401 ? <Link href="/sign-in" className="inline-flex min-h-11 items-center underline focus-visible:ring-2 focus-visible:ring-brand-teal" onClick={() => AuthStorage.clear()}>Sign in again</Link> : null}
              {failed && [429, 503].includes(error.status) ? <ActionButton variant="outline" className="mt-2" onClick={() => void submit(failed)}>Retry</ActionButton> : null}
            </div> : null}
          </div>
          <form className="shrink-0 space-y-2 border-t border-brand-border p-4" onSubmit={(event) => { event.preventDefault(); sendDraft(); }}>
            <label htmlFor={`${id}-message`} className="text-sm font-semibold">Message</label>
            <textarea ref={inputRef} id={`${id}-message`} rows={2} maxLength={2000} value={draft}
              disabled={!!pending || error?.status === 401} className={fieldClassName}
              aria-describedby={`${id}-message-help`} onChange={(event) => {
                setDraft(event.target.value);
                setFailed(null);
                if (error?.status !== 401) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault(); sendDraft();
                }
              }} />
            <p id={`${id}-message-help`} className="text-xs text-brand-textSecondary">{draft.length}/2000 · Enter to send · Shift+Enter for a new line</p>
            <div className="flex flex-wrap justify-between gap-2">
              <ActionButton type="button" variant="outline" onClick={resetConversation}>Clear chat</ActionButton>
              <ActionButton type="submit" disabled={!canSend} loading={!!pending}>Send</ActionButton>
            </div>
          </form>
        </section>
      ) : null}
      <button ref={triggerRef} type="button" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)} className="pointer-events-auto ml-auto flex min-h-11 items-center rounded-full bg-brand-teal px-5 py-3 font-semibold text-white shadow-lg focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2">{pending && !open ? 'Support is replying…' : 'Support chat'}</button>
    </div>
  );
}

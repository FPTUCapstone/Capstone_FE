'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { loadRoutes, RouteApiError, routeMessages, transportLabels } from '../services/route-api';
import type { RouteList } from '../services/route-api';
import { takeRouteCreation } from '../services/route-creation-feedback';

export function RouteDirectoryView() {
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    // Defer consumption until after mount so the Strict Mode effect probe cannot consume it.
    const frame = requestAnimationFrame(() => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('confirmation');
      setShowSuccess(takeRouteCreation(token));
      if (token) {
        url.searchParams.delete('confirmation');
        window.history.replaceState(null, '', url);
      }
    });
    const clear = () => { takeRouteCreation(); setShowSuccess(false); };
    const onRestore = (event: PageTransitionEvent) => { if (event.persisted) clear(); };
    window.addEventListener('popstate', clear);
    window.addEventListener('pageshow', onRestore);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('popstate', clear);
      window.removeEventListener('pageshow', onRestore);
    };
  }, []);
  const [data, setData] = useState<RouteList | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadRoutes(page, controller.signal).then(value => {
      if (!controller.signal.aborted) { setData(value); setError(null); setLoading(false); }
    }, failure => { if (!controller.signal.aborted) { setError(failure instanceof RouteApiError ? failure.message : routeMessages.MSG127); setLoading(false); } });
    return () => controller.abort();
  }, [page, reload]);
  function navigate(next: number) { setLoading(true); setPage(next); }
  return <main className="mx-auto max-w-6xl space-y-6 pb-12 text-text-primary">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 sm:p-8"><div><h1 className="text-2xl font-bold">Routes List</h1><p className="mt-2 text-sm text-text-secondary">Routes connecting points of interest for planning and navigation.</p></div><Link href="/admin/routes/create" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4">Create Route</Link></header>
    {showSuccess && <FeedbackAlert tone="success">{routeMessages.MSG139}</FeedbackAlert>}
    {error && <div className="space-y-3"><FeedbackAlert tone="error">{error}</FeedbackAlert><ActionButton variant="outline" onClick={() => { setLoading(true); setError(null); setReload(value => value + 1); }}>Retry loading</ActionButton></div>}
    {loading ? <p role="status">Loading routes…</p> : data && <section className="overflow-hidden rounded-2xl border border-border bg-surface" aria-label="Routes">
      {data.items.length === 0 ? <p className="p-6 text-text-secondary">No routes found.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Routes retrieved from the server</caption><thead className="bg-brand-surface text-text-secondary"><tr>{['Origin', 'Destination', 'Distance (km)', 'Travel time (minutes)', 'Transport Mode', 'Status'].map(label => <th key={label} scope="col" className="whitespace-nowrap p-4 font-semibold">{label}</th>)}</tr></thead><tbody>{data.items.map(route => <tr key={route.id} className="border-t border-border"><td className="p-4 font-medium">{route.fromPoiName}</td><td className="p-4">{route.toPoiName}</td><td className="p-4">{route.distanceKm}</td><td className="p-4">{route.estimatedDurationMinutes}</td><td className="p-4">{transportLabels[route.transportMode]}</td><td className="p-4">{route.status}</td></tr>)}</tbody></table></div>}
      <nav aria-label="Route pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4"><p className="text-sm text-text-secondary">Page {data.page} · {data.totalCount} routes</p><div className="flex gap-2"><ActionButton variant="outline" disabled={loading || page <= 1} onClick={() => navigate(page - 1)}>Previous</ActionButton><ActionButton variant="outline" disabled={loading || page * data.pageSize >= data.totalCount} onClick={() => navigate(page + 1)}>Next</ActionButton></div></nav>
    </section>}
  </main>;
}

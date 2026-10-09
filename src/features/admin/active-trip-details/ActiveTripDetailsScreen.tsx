'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import {
  DETAIL_MESSAGES,
  formatCoordinate,
  formatVietnamDateTime,
  type ActiveTripDetail,
  type GroupPanel,
} from './activeTripDetails';
import { ActiveTripDetailsError, fetchActiveTripDetails } from './activeTripDetailsService';

type LoadState = 'loading' | 'ready' | 'not-found' | 'forbidden' | 'unavailable';

export function ActiveTripDetailsScreen({ tripId }: { tripId: string }) {
  const { replace } = useRouter();
  const [detail, setDetail] = useState<ActiveTripDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback((signal: AbortSignal) => {
    fetchActiveTripDetails(tripId, signal)
      .then((response) => {
        if (!signal.aborted) { setDetail(response); setState('ready'); }
      })
      .catch((error: unknown) => {
        if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof ActiveTripDetailsError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(`${ROUTES.admin.activeTrips}/${tripId}`)}`);
          return;
        }
        if (error instanceof ActiveTripDetailsError && error.status === 404) setState('not-found');
        else if (error instanceof ActiveTripDetailsError && error.status === 403) setState('forbidden');
        else setState('unavailable');
      });
  }, [replace, tripId]);

  const retry = () => { setState('loading'); setDetail(null); setRetryKey((value) => value + 1); };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, retryKey]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <Link
          href={ROUTES.admin.activeTrips}
          className="inline-flex items-center gap-1 text-sm font-bold text-[#006b5f] hover:underline"
        >
          ← Back to Active Trips
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Administrator monitoring</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-[#00152a]">{detail?.tripCode ?? `TRIP-${tripId}`}</h1>
          {detail ? <Badge>{detail.tripType === 'SelfPlanned' ? 'Self-Planned' : 'Tour'}</Badge> : null}
          {detail ? <Badge alert={detail.currentState === 'Interrupted'}>{detail.currentState}</Badge> : null}
          {state === 'ready' ? (
            <button
              type="button"
              onClick={retry}
              className="ml-auto rounded-xl border border-[#9fb3c8] px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7]"
            >
              Refresh
            </button>
          ) : null}
        </div>
        {detail ? (
          <p className="mt-2 text-sm text-[#486581]">
            {detail.groupOrTraveler}
            {detail.destination ? ` · ${detail.destination}` : ''}
          </p>
        ) : null}
      </header>

      {state === 'loading' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Loading trip details…</div> : null}
      {state === 'not-found' ? <FeedbackAlert tone="error" title="Trip unavailable">{DETAIL_MESSAGES.notFound}</FeedbackAlert> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">{DETAIL_MESSAGES.forbidden}</FeedbackAlert> : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load the active trip details">
          <p>{DETAIL_MESSAGES.unavailable}</p>
          <button type="button" onClick={retry} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button>
        </FeedbackAlert>
      ) : null}

      {state === 'ready' && detail ? <TripDetailSections detail={detail} /> : null}
    </main>
  );
}

function TripDetailSections({ detail }: { detail: ActiveTripDetail }) {
  return (
    <div className="space-y-6">
      <section aria-label="Trip status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Current Day" value={detail.currentDay ?? 'Not available'} />
        <StatusCard label="Members" value={detail.members} />
        <StatusCard label="Open Alerts" value={detail.openAlerts} alert={detail.openAlerts > 0} />
        <StatusCard label="Last Synced" value={formatVietnamDateTime(detail.lastSyncedAtUtc)} />
      </section>

      <section aria-label="Current traveler location" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Current Traveler Location</SectionTitle>
        {detail.currentLocation ? (
          <p className="mt-2 text-sm text-[#102a43]">
            <span className="font-mono">
              {formatCoordinate(detail.currentLocation.latitude)}, {formatCoordinate(detail.currentLocation.longitude)}
            </span>
            <span className="ml-2 text-[#486581]">as of {formatVietnamDateTime(detail.currentLocation.asOfUtc)}</span>
          </p>
        ) : <p className="mt-2 text-sm text-[#486581]">{DETAIL_MESSAGES.notAvailable}</p>}
      </section>

      <GroupPanelSection panels={detail.groupPanel} />

      <section aria-label="Itinerary progress" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Itinerary Progress</SectionTitle>
        {detail.itineraryProgress.length === 0 ? <p className="mt-2 text-sm text-[#486581]">{DETAIL_MESSAGES.empty}</p> :
        <ScrollableTable label="Itinerary progress table" headings={['#', 'Stop', 'Kind', 'Arrival', 'Departure', 'Status']}>
          {detail.itineraryProgress.map((item) => (
            <tr key={item.itemId} className="border-t border-[#e6edf5]">
              <td className="px-4 py-3">{item.sequenceNo}</td>
              <td className="px-4 py-3 font-medium">{item.poiName ?? 'Not available'}</td>
              <td className="px-4 py-3">{item.itemKind === 'Rest' ? 'Rest' : 'Visit'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(item.plannedArrivalUtc)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(item.plannedDepartureUtc)}</td>
              <td className="px-4 py-3"><Badge alert={item.status === 'Skipped'}>{item.status}</Badge></td>
            </tr>
          ))}
        </ScrollableTable>
        }
      </section>

      <section aria-label="FSM state history" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>FSM State History</SectionTitle>
        {detail.stateHistory.length === 0 ? <p className="mt-2 text-sm text-[#486581]">{DETAIL_MESSAGES.empty}</p> : (
          <ol className="mt-3 space-y-3 border-l-2 border-[#d7e2ef] pl-4">
            {detail.stateHistory.map((change, index) => (
              <li key={`${change.changedAtUtc}-${index}`} className="text-sm">
                <p className="font-semibold text-[#102a43]">
                  {change.fromState ? `${change.fromState} → ` : ''}{change.toState}
                </p>
                <p className="text-[#486581]">
                  {formatVietnamDateTime(change.changedAtUtc)}
                  {change.triggeredBy ? ` · ${change.triggeredBy}` : ''}
                  {change.reason ? ` · ${change.reason}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label="Incidents" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Incidents</SectionTitle>
        {detail.incidents.length === 0 ? <p className="mt-2 text-sm text-[#486581]">{DETAIL_MESSAGES.empty}</p> : (
          <ul className="mt-3 space-y-3">
            {detail.incidents.map((incident) => (
              <li key={incident.incidentId} className={`rounded-xl border p-4 ${incident.resolvedAtUtc ? 'border-[#e6edf5]' : 'border-[#f3a79d] bg-[#fff8f6]'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge alert={!incident.resolvedAtUtc}>{incident.resolvedAtUtc ? 'Resolved' : 'Open'}</Badge>
                  <span className="text-sm font-bold text-[#102a43]">{incident.incidentType}</span>
                  <span className="text-xs text-[#486581]">Detected {formatVietnamDateTime(incident.detectedAtUtc)}</span>
                  {incident.resolvedAtUtc ? <span className="text-xs text-[#486581]">Resolved {formatVietnamDateTime(incident.resolvedAtUtc)}</span> : null}
                </div>
                {incident.description ? <p className="mt-1 text-sm text-[#334e68]">{incident.description}</p> : null}
                {incident.weatherEvent ? (
                  <p className="mt-2 rounded-lg bg-[#f0f5fa] p-3 text-sm text-[#334e68]">
                    <Badge alert={incident.weatherEvent.severity === 'Severe' || incident.weatherEvent.severity === 'Extreme'}>
                      Weather {incident.weatherEvent.severity}
                    </Badge>
                    <span className="ml-2 font-semibold">{incident.weatherEvent.eventType}</span>
                    {incident.weatherEvent.regionName ? <span className="ml-2">{incident.weatherEvent.regionName}</span> : null}
                    <span className="ml-2 text-xs text-[#627d98]">
                      {formatVietnamDateTime(incident.weatherEvent.validFromUtc)} → {formatVietnamDateTime(incident.weatherEvent.validToUtc)}
                    </span>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Rerouting events" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Rerouting Events</SectionTitle>
        {detail.reroutingEvents.length === 0 ? <p className="mt-2 text-sm text-[#486581]">{DETAIL_MESSAGES.empty}</p> : (
          <ul className="mt-3 space-y-3">
            {detail.reroutingEvents.map((event) => (
              <li key={event.reroutingId} className="rounded-xl border border-[#e6edf5] p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{event.status}</Badge>
                  <span className="text-xs text-[#486581]">Proposed {formatVietnamDateTime(event.proposedAtUtc)}</span>
                  {event.decidedAtUtc ? <span className="text-xs text-[#486581]">Decided {formatVietnamDateTime(event.decidedAtUtc)}</span> : null}
                </div>
                {event.hasProposedItinerarySnapshot ? (
                  <p className="mt-1 text-xs text-[#627d98]">{DETAIL_MESSAGES.snapshotAvailable}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Location trail" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Location Trail</SectionTitle>
        {detail.locationTrail.length === 0 ? <p className="mt-2 text-sm text-[#486581]">{DETAIL_MESSAGES.empty}</p> :
        <ScrollableTable label="Location trail table" headings={['Latitude', 'Longitude', 'Recorded', 'Captured']}>
          {detail.locationTrail.map((point, index) => (
            <tr key={`${point.recordedAtUtc}-${index}`} className="border-t border-[#e6edf5]">
              <td className="px-4 py-3 font-mono">{formatCoordinate(point.latitude)}</td>
              <td className="px-4 py-3 font-mono">{formatCoordinate(point.longitude)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(point.recordedAtUtc)}</td>
              <td className="px-4 py-3">{point.isOfflineCaptured ? 'Offline' : 'Live'}</td>
            </tr>
          ))}
        </ScrollableTable>
        }
      </section>
    </div>
  );
}

function GroupPanelSection({ panels }: { panels: GroupPanel[] | null }) {
  return (
    <section aria-label="Group panel" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
      <SectionTitle>Group Panel</SectionTitle>
      {panels === null ? <p className="mt-2 text-sm text-[#486581]">{DETAIL_MESSAGES.notAvailable}</p> : (
        <div className="mt-3 space-y-4">
          {panels.map((panel) => (
            <div key={panel.groupId} className="rounded-xl border border-[#e6edf5] p-4">
              <p className="text-sm font-bold text-[#102a43]">
                {panel.groupName} <span className="font-normal text-[#486581]">· Host {panel.hostName}</span>
              </p>
              <ScrollableTable label={`Members table for ${panel.groupName}`} headings={['Member', 'Joined', 'Location Sharing']}>
                {panel.members.map((member) => (
                  <tr key={member.userId} className="border-t border-[#e6edf5]">
                    <td className="px-4 py-3 font-medium">{member.fullName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(member.joinedAtUtc)}</td>
                    <td className="px-4 py-3"><Badge alert={!member.isLocationSharingEnabled}>{member.isLocationSharingEnabled ? 'Enabled' : 'Disabled'}</Badge></td>
                  </tr>
                ))}
              </ScrollableTable>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-bold uppercase tracking-wide text-[#334e68]">{children}</h2>
);

const StatusCard = ({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) => (
  <div className={`rounded-2xl border bg-white p-5 shadow-sm ${alert ? 'border-[#f3a79d]' : 'border-[#d7e2ef]'}`}>
    <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
    <p className={`mt-2 text-2xl font-extrabold ${alert ? 'text-[#b42318]' : 'text-[#00152a]'}`}>{value}</p>
  </div>
);

const Badge = ({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${alert ? 'bg-[#fdecef] text-[#8c1030]' : 'bg-[#e6f7f0] text-[#085b3e]'}`}>{children}</span>
);

const ScrollableTable = ({
  label, headings, children,
}: { label: string; headings: string[]; children: React.ReactNode }) => (
  <div className="mt-3 max-w-full overflow-x-auto rounded-xl border border-[#e6edf5]" tabIndex={0} aria-label={`${label}; scroll horizontally on small screens`}>
    <table className="min-w-[640px] w-full border-collapse text-left text-sm">
      <thead className="bg-[#f0f5fa] text-xs uppercase tracking-wide text-[#334e68]">
        <tr>{headings.map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

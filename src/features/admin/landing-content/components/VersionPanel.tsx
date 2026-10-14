import type { LandingContentState, VersionSummary } from '../landingContent';
import { landingContentEn } from '../resources/en';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh (CR-07). */
export function formatVersionDate(utcIso: string): string {
  const date = new Date(utcIso);
  return Number.isNaN(date.getTime()) ? utcIso : dateFormatter.format(date);
}

interface VersionPanelProps {
  published: LandingContentState['published'];
  history: VersionSummary[];
  onRestore: (versionId: string) => void;
  disabled: boolean;
}

export function VersionPanel({ published, history, onRestore, disabled }: VersionPanelProps) {
  const copy = landingContentEn.versionPanel;

  return (
    <section aria-label={copy.title} className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#00152a]">{copy.publishedHeading}</h2>
      <p className="mt-2 text-base font-bold text-[#1d2939]">
        {copy.versionLabel} {published.versionNumber}
      </p>
      <dl className="mt-2 grid gap-1 text-sm text-[#475467] sm:grid-cols-2">
        <div>
          <dt className="font-semibold">{copy.publishedBy}</dt>
          <dd>{published.publishedByName}</dd>
        </div>
        <div>
          <dt className="font-semibold">{copy.publishedAt}</dt>
          <dd>{formatVersionDate(published.publishedAtUtc)}</dd>
        </div>
      </dl>

      <h3 className="mt-5 text-sm font-bold tracking-wide text-[#344054] uppercase">{copy.historyHeading}</h3>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-[#667085]">{copy.noHistory}</p>
      ) : (
        <ul className="mt-2 divide-y divide-[#eaecf0]">
          {history.map((version) => (
            <li key={version.versionId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>
                {copy.versionLabel} {version.versionNumber} · {version.publishedByName} ·{' '}
                {formatVersionDate(version.publishedAtUtc)}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRestore(version.versionId)}
                aria-label={`${copy.restore} ${version.versionNumber}`}
                className="rounded-lg border border-[#d0d7de] px-3 py-1.5 text-xs font-bold text-[#00152a] hover:bg-[#f2f4f7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copy.restore}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

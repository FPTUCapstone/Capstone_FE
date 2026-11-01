import { formatSettlementStatus, type SettlementStatus } from './payoutSettlement';

export const inputClass = 'mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus-visible:border-[#006b5f] focus-visible:ring-2 focus-visible:ring-[#71f8e4]/40';

const BADGE_TONES: Record<SettlementStatus, string> = {
  ApprovedForSettlement: 'bg-[#e6f7f0] text-[#085b3e]',
  SettlementProcessing: 'bg-[#fff4d6] text-[#7a4b00]',
  Settled: 'bg-[#dff3e4] text-[#0b4d22]',
  SettlementFailed: 'bg-[#fdecef] text-[#8c1030]',
};

export function StatusBadge({ status }: { status: SettlementStatus }) {
  const label = formatSettlementStatus(status);
  return (
    <span
      aria-label={`Payout status: ${label}`}
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${BADGE_TONES[status]}`}
    >
      {label}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-bold uppercase tracking-wide text-[#334e68]">{label}{children}</label>;
}

export function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[#00152a]">{value}</p>
    </div>
  );
}

export function PageButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-lg border border-[#9fb3c8] px-4 py-2 font-bold text-[#243b53] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold uppercase tracking-wide text-[#334e68]">{children}</h2>;
}

export function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
      <p className="mt-2 text-lg font-extrabold text-[#00152a]">{value}</p>
    </div>
  );
}

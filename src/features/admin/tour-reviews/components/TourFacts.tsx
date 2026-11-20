export function FactChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] p-3">
      <dt className="block text-[11px] font-semibold text-[#5B6E69]">{label}</dt>
      <dd className="text-base font-bold text-[#1C2928]">{value}</dd>
    </div>
  );
}

export function ServiceList({ title, items, emptyLabel }: { title: string; items: readonly string[]; emptyLabel?: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-[#1C2928]">{title}</h3>
      {items.length === 0 && emptyLabel ? (
        <p className="text-sm text-[#5B6E69]">{emptyLabel}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#5B6E69]">
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
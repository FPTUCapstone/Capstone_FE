type BrandLogoProps = {
  context?: 'main' | 'partner' | 'admin';
  inverse?: boolean;
  size?: number;
};

const labels = {
  main: 'TripMate',
  partner: 'TripMate Partner',
  admin: 'TripMate Admin',
};

export function BrandLogo({ context = 'main', inverse = false, size = 24 }: BrandLogoProps) {
  const color = inverse ? 'text-white' : 'text-[#007D6E]';

  return (
    <span className={`inline-flex items-center gap-2 ${color}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inverse ? 'text-white' : 'text-brand-brightTeal'}
      >
        <path
          d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"
          className={inverse ? 'fill-white/30' : 'fill-brand-teal/30'}
        />
        <circle cx="12" cy="10" r="3" className="fill-white stroke-white" />
        <path d="M12 7v1" stroke="#FF7043" strokeWidth="2" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight sm:text-2xl">{labels[context]}</span>
    </span>
  );
}

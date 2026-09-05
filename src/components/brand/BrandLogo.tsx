type BrandLogoProps = {
  context?: 'main' | 'partner' | 'admin';
  inverse?: boolean;
};

const labels = {
  main: 'TripMate',
  partner: 'TripMate Partner',
  admin: 'TripMate Admin',
};

export function BrandLogo({ context = 'main', inverse = false }: BrandLogoProps) {
  const color = inverse ? 'text-white' : 'text-[#00152a]';

  return (
    <span className={`inline-flex items-center gap-2 ${color}`}>
      <svg className="h-8 w-8" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path
          d="M20 30 H50 A10 10 0 0 1 60 40 V60 A10 10 0 0 0 70 70 H80"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="20" cy="70" r="8" fill="currentColor" />
        <circle cx="80" cy="30" r="8" fill="currentColor" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight sm:text-2xl">{labels[context]}</span>
    </span>
  );
}

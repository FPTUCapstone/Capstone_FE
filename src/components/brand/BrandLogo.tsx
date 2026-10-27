import {
  TRIPMATE_SYMBOL_VIEWBOX,
  TRIPMATE_SYMBOL_PATH,
  TRIPMATE_SYMBOL_ASPECT_RATIO,
} from './tripMateLogoPaths';

export type BrandLogoProps = {
  context?: 'main' | 'partner' | 'admin';
  inverse?: boolean;
  size?: number;
  variant?: 'full' | 'icon';
  className?: string;
};

const labels = {
  main: 'TripMate',
  partner: 'TripMate Partner',
  admin: 'TripMate Admin',
};

export function BrandLogo({
  context = 'main',
  inverse = false,
  size = 24,
  variant = 'full',
  className = '',
}: BrandLogoProps) {
  const width = Math.round(size * TRIPMATE_SYMBOL_ASPECT_RATIO);
  const color = inverse ? 'text-white' : 'text-[#10283b]';

  return (
    <span className={`inline-flex items-center gap-2 sm:gap-2.5 ${color} ${className}`}>
      <svg
        width={width}
        height={size}
        viewBox={TRIPMATE_SYMBOL_VIEWBOX}
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d={TRIPMATE_SYMBOL_PATH} />
      </svg>
      {variant !== 'icon' && (
        <span className="text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl whitespace-nowrap">
          {labels[context]}
        </span>
      )}
    </span>
  );
}

export default BrandLogo;

import {
  TRIPMATE_SYMBOL_VIEWBOX,
  TRIPMATE_SYMBOL_PATH,
  TRIPMATE_SYMBOL_ASPECT_RATIO,
} from '../brand/tripMateLogoPaths';

export type RegistrationBrandLogoProps = {
  size?: number;
  inverse?: boolean;
  className?: string;
};

export default function BrandLogo({
  size = 24,
  inverse = false,
  className = '',
}: RegistrationBrandLogoProps) {
  const width = Math.round(size * TRIPMATE_SYMBOL_ASPECT_RATIO);
  const color = inverse ? 'text-white' : 'currentColor';

  return (
    <svg
      width={width}
      height={size}
      viewBox={TRIPMATE_SYMBOL_VIEWBOX}
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      className={`${color} ${className}`}
      aria-hidden="true"
    >
      <path d={TRIPMATE_SYMBOL_PATH} />
    </svg>
  );
}

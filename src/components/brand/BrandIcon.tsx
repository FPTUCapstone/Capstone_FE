import {
  TRIPMATE_SYMBOL_VIEWBOX,
  TRIPMATE_SYMBOL_PATH,
  TRIPMATE_SYMBOL_ASPECT_RATIO,
} from './tripMateLogoPaths';

export type BrandIconProps = {
  size?: number;
  inverse?: boolean;
  className?: string;
};

export default function BrandIcon({
  size = 24,
  inverse = false,
  className = '',
}: BrandIconProps) {
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

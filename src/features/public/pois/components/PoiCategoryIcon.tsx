import type { PoiCategoryVisualKind } from '../utils/poiCategoryVisuals';

interface PoiCategoryIconProps {
  kind: PoiCategoryVisualKind;
  className?: string;
}

export function PoiCategoryIcon({ kind, className = 'h-4 w-4' }: PoiCategoryIconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true as const,
  };

  switch (kind) {
    case 'food':
      return (
        <svg {...common}>
          <path d="M4 3v7a3 3 0 0 0 3 3h1v8" />
          <path d="M7 3v5" />
          <path d="M10 3v7a3 3 0 0 1-3 3" />
          <path d="M16 3v18" />
          <path d="M16 3c2.5 0 4 2.2 4 5.5S18.5 14 16 14" />
        </svg>
      );
    case 'beach':
      return (
        <svg {...common}>
          <circle cx="17" cy="6" r="2.5" />
          <path d="M3 16c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 2.6 1 3.6.3" />
          <path d="M3 20c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 2.6 1 3.6.3" />
          <path d="M5 12l4-4 3 3" />
        </svg>
      );
    case 'culture':
      return (
        <svg {...common}>
          <path d="M4 10h16" />
          <path d="M6 10l6-6 6 6" />
          <path d="M7 10v8" />
          <path d="M12 10v8" />
          <path d="M17 10v8" />
          <path d="M4 18h16" />
        </svg>
      );
    case 'museum':
      return (
        <svg {...common}>
          <path d="M3 9l9-5 9 5H3z" />
          <path d="M6 9v9" />
          <path d="M10 9v9" />
          <path d="M14 9v9" />
          <path d="M18 9v9" />
          <path d="M3 18h18" />
          <path d="M2 21h20" />
        </svg>
      );
    case 'nature':
      return (
        <svg {...common}>
          <path d="M3 19l6.5-10 4.5 6.5 3-4L21 19H3z" />
          <path d="M14.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
      );
    case 'entertainment':
      return (
        <svg {...common}>
          <circle cx="12" cy="11" r="6.5" />
          <circle cx="12" cy="11" r="2" />
          <path d="M12 4.5v4.5" />
          <path d="M17.6 7.8l-3.9 2.2" />
          <path d="M6.4 7.8l3.9 2.2" />
          <path d="M8.5 21l3.5-8 3.5 8" />
          <path d="M6 21h12" />
        </svg>
      );
    case 'stay':
      return (
        <svg {...common}>
          <path d="M3 19V7" />
          <path d="M3 14h18v5" />
          <path d="M3 11h8a3 3 0 0 1 3 3" />
          <circle cx="7" cy="8.5" r="1.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
      );
  }
}

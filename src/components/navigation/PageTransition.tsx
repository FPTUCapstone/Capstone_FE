'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Editorial page transition component for public route navigation.
 * Applies a subtle upward settle (6px, 280ms) on route change without blocking.
 * Strictly respects prefers-reduced-motion via CSS and motion-reduce:animate-none.
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className={`animate-page-enter motion-reduce:animate-none ${className}`}
    >
      {children}
    </div>
  );
}

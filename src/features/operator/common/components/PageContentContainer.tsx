import type { ReactNode } from 'react';

export interface PageContentContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContentContainer({
  children,
  className = '',
}: PageContentContainerProps) {
  return (
    <div className={`w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
}

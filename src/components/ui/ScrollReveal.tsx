'use client';

import React, { useEffect, useRef, useState, ElementType, ReactNode } from 'react';

export type RevealAnimation =
  | 'editorial-text'
  | 'card-reveal'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'image-reveal'
  | 'fade';

export interface ScrollRevealProps {
  children: ReactNode;
  animation?: RevealAnimation;
  delay?: number; // milliseconds
  duration?: number; // milliseconds
  className?: string;
  as?: ElementType;
  threshold?: number;
  triggerOnce?: boolean;
}

export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  className = '',
  as: Component = 'div',
  threshold = 0.1,
  triggerOnce = true,
}: ScrollRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Accessibility fallback when in test environment without full motion context
    const isReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)')?.matches &&
      (typeof document === 'undefined' || document.documentElement?.dataset?.motion !== 'full');

    if (isReduced) {
      queueMicrotask(() => {
        setIsRevealed(true);
      });
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Fallback if IntersectionObserver is not available
    if (typeof IntersectionObserver === 'undefined') {
      queueMicrotask(() => {
        setIsRevealed(true);
      });
      return;
    }

    // Check if element is already in viewport on mount (e.g. Hero section above the fold)
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    let observerTimer: NodeJS.Timeout | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            observerTimer = setTimeout(() => {
              setIsRevealed(true);
            }, delay);
          } else {
            setIsRevealed(true);
          }

          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsRevealed(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(element);

    return () => {
      if (observerTimer) {
        clearTimeout(observerTimer);
      }
      observer.disconnect();
    };
  }, [delay, threshold, triggerOnce]);

  const getTransformClasses = () => {
    switch (animation) {
      case 'card-reveal':
        return isRevealed
          ? 'opacity-100 translate-y-0 scale-100 filter-none'
          : 'opacity-0 translate-y-8 scale-[0.97] blur-[2px]';
      case 'editorial-text':
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';
      case 'fade-up':
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7';
      case 'fade-down':
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-7';
      case 'fade-left':
        return isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-7';
      case 'fade-right':
        return isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-7';
      case 'image-reveal':
        return isRevealed ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-4';
      case 'zoom-in':
        return isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95';
      case 'fade':
      default:
        return isRevealed ? 'opacity-100' : 'opacity-0';
    }
  };

  return (
    <Component
      ref={elementRef}
      data-revealed={isRevealed}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-all will-change-[opacity,transform] ${getTransformClasses()} ${className}`}
    >
      {children}
    </Component>
  );
}

/**
 * Editorial Text Reveal helper component
 */
export function EditorialTextReveal({
  children,
  delay = 0,
  duration = 500,
  className = '',
  as = 'div',
}: Omit<ScrollRevealProps, 'animation'>) {
  return (
    <ScrollReveal
      animation="editorial-text"
      delay={delay}
      duration={duration}
      className={className}
      as={as}
    >
      {children}
    </ScrollReveal>
  );
}

/**
 * Image Reveal helper component
 */
export function ImageReveal({
  children,
  delay = 0,
  duration = 700,
  className = '',
  as = 'div',
}: Omit<ScrollRevealProps, 'animation'>) {
  return (
    <ScrollReveal
      animation="image-reveal"
      delay={delay}
      duration={duration}
      className={className}
      as={as}
    >
      {children}
    </ScrollReveal>
  );
}

/**
 * Card Reveal helper component
 */
export function CardReveal({
  children,
  delay = 0,
  duration = 700,
  className = '',
  as = 'div',
}: Omit<ScrollRevealProps, 'animation'>) {
  return (
    <ScrollReveal
      animation="card-reveal"
      delay={delay}
      duration={duration}
      className={className}
      as={as}
    >
      {children}
    </ScrollReveal>
  );
}

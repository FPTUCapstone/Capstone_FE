'use client';

import React, { useEffect, useRef, useState, ElementType, ReactNode } from 'react';
import { getEffectiveMotionPreference } from '@/components/providers/SmoothScrollProvider';

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
  duration = 600,
  className = '',
  as: Component = 'div',
  threshold = 0.05,
  triggerOnce = true,
}: ScrollRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // 1. Accessibility: Bypass if reduced motion requested and force-motion is not enabled
    const isReduced = getEffectiveMotionPreference() === 'reduced';

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

    // 2. Viewport check on mount:
    // Only auto-trigger on mount for elements truly above the fold on initial load.
    // Lower sections (e.g. destinations, csp) wait until scrolled into view via IntersectionObserver.
    const rect = element.getBoundingClientRect();
    const isAboveTheFold =
      rect.height > 0 &&
      rect.bottom > 0 &&
      (window.scrollY > 0
        ? rect.top < window.innerHeight
        : rect.top < window.innerHeight * 0.75);

    if (isAboveTheFold) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    let observerTimer: NodeJS.Timeout | undefined;

    // 3. Look-ahead IntersectionObserver with 60px rootMargin
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

    // 4. Fast-scroll safety listener: ONLY force-reveal if user has already scrolled completely PAST the element above viewport
    function handleFastScrollSafety() {
      if (!elementRef.current) return;
      const currentRect = elementRef.current.getBoundingClientRect();
      if (currentRect.bottom < 0) {
        setIsRevealed(true);
        window.removeEventListener('scroll', handleFastScrollSafety);
      }
    }
    window.addEventListener('scroll', handleFastScrollSafety, { passive: true });

    return () => {
      if (observerTimer) {
        clearTimeout(observerTimer);
      }
      window.removeEventListener('scroll', handleFastScrollSafety);
      observer.disconnect();
    };
  }, [delay, threshold, triggerOnce]);

  const getTransformClasses = () => {
    switch (animation) {
      case 'card-reveal':
        // Editorial camera focus & lift: 32px upward translation with 0.97 scale and subtle blur clear
        return isRevealed
          ? 'opacity-100 translate-y-0 scale-100 filter-none'
          : 'opacity-0 translate-y-8 scale-[0.97] blur-[2px]';
      case 'editorial-text':
        // 12px subtle editorial translation
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';
      case 'fade-up':
        // 14px subtle translation
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';
      case 'fade-down':
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6';
      case 'fade-left':
        return isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6';
      case 'fade-right':
        return isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6';
      case 'image-reveal':
        // Editorial subtle scale 0.985 with 8px upward settle
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
 * 12px upward settle with 450ms duration
 */
export function EditorialTextReveal({
  children,
  delay = 0,
  duration = 450,
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
 * 1.5% scale + 8px settle with 600ms duration
 */
export function ImageReveal({
  children,
  delay = 0,
  duration = 600,
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
 * 32px upward settle with 0.97 scale and subtle camera focus clear
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

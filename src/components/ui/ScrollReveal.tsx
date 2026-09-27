'use client';

import React, { useEffect, useRef, useState, ElementType, ReactNode } from 'react';

export type RevealAnimation =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'fade';

interface ScrollRevealProps {
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
    // Graceful fallback for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      queueMicrotask(() => {
        setIsRevealed(true);
      });
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Check if element is already in viewport on mount (e.g. Hero section above the fold)
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => {
            setIsRevealed(true);
          }, delay);

          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
          return () => clearTimeout(timer);
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
      observer.disconnect();
    };
  }, [delay, threshold, triggerOnce]);

  const getTransformClasses = () => {
    switch (animation) {
      case 'fade-up':
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7';
      case 'fade-down':
        return isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-7';
      case 'fade-left':
        return isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-7';
      case 'fade-right':
        return isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-7';
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

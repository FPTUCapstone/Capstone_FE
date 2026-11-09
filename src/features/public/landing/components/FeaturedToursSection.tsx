/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect, useCallback, useId, useSyncExternalStore, useMemo } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { VERIFIED_TOURS, VerifiedTour } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingEyebrow } from './LandingEyebrow';

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener?.('change', callback);
  return () => mediaQuery.removeEventListener?.('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function FeaturedToursSection() {
  const [filterCity, setFilterCity] = useState<'all' | 'Đà Nẵng' | 'Hội An' | 'Huế'>('all');
  const [selectedTour, setSelectedTour] = useState<VerifiedTour | null>(null);

  const filtered = useMemo(() => {
    if (filterCity === 'all') return VERIFIED_TOURS;
    return VERIFIED_TOURS.filter((t) => t.city === filterCity);
  }, [filterCity]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [stepSize, setStepSize] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const hasDraggedSignificantly = useRef(false);
  const carouselId = useId();

  // Measure card dimensions and track scrollability
  const updateDimensions = useCallback(() => {
    if (!trackRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const track = trackRef.current;
    const containerWidth = container.clientWidth;
    const scrollWidth = track.scrollWidth;

    const firstCard = track.children[0] as HTMLElement | undefined;
    const secondCard = track.children[1] as HTMLElement | undefined;
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth;
      const gap = secondCard
        ? secondCard.offsetLeft - (firstCard.offsetLeft + cardWidth)
        : 24;
      if (cardWidth > 0) {
        setStepSize(cardWidth + gap);
      }
    }

    if (containerWidth > 0 && scrollWidth > 0) {
      const measured = Math.max(0, scrollWidth - containerWidth);
      setMaxScroll(measured);
      setIsMeasured(true);
    }
  }, []);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      updateDimensions();
    });

    const container = containerRef.current;
    if (!container) return () => cancelAnimationFrame(handle);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateDimensions();
      });
      observer.observe(container);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      cancelAnimationFrame(handle);
      observer?.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions, filtered.length]);

  // Determine whether scrolling is possible and compute maxIndex
  const canScroll = useMemo(() => {
    if (isMeasured) {
      return maxScroll > 10;
    }
    // Fallback for SSR / test environments (e.g. jsdom where clientWidth is 0)
    return filtered.length > 3;
  }, [isMeasured, maxScroll, filtered.length]);

  const maxIndex = useMemo(() => {
    if (!canScroll) return 0;
    if (stepSize > 0 && maxScroll > 10) {
      return Math.ceil(maxScroll / stepSize);
    }
    // Fallback when DOM measurement is not available (e.g. jsdom)
    return filtered.length > 3 ? filtered.length - 1 : 0;
  }, [canScroll, stepSize, maxScroll, filtered.length]);

  // Tab visibility: pause autoplay when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Navigation handlers
  // When reaching the end (maxIndex), handleNext returns to 0 and continues
  const handleNext = useCallback(() => {
    if (!canScroll) return;
    setWithTransition(true);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [canScroll, maxIndex]);

  const handlePrev = useCallback(() => {
    if (!canScroll) return;
    setWithTransition(true);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, [canScroll]);

  const handleSelectTour = useCallback((targetIndex: number) => {
    if (!canScroll) return;
    setWithTransition(true);
    setCurrentIndex(Math.min(targetIndex, maxIndex));
  }, [canScroll, maxIndex]);

  // Autoplay timer (4.0s): automatically slides, and upon reaching the end, returns to 0 and continues
  useEffect(() => {
    if (!canScroll || isHovered || isFocused || isDragging || prefersReducedMotion) {
      return;
    }

    const timer = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [canScroll, isHovered, isFocused, isDragging, prefersReducedMotion, handleNext]);

  // Filter change handler: resets active slide
  function handleFilterChange(city: 'all' | 'Đà Nẵng' | 'Hội An' | 'Huế') {
    setFilterCity(city);
    setCurrentIndex(0);
    setDragOffset(0);
  }

  // Pointer / drag handlers
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!canScroll) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    dragStartX.current = e.clientX;
    dragOffsetRef.current = 0;
    pointerIdRef.current = e.pointerId ?? 1;
    isDraggingRef.current = true;
    hasDraggedSignificantly.current = false;
    setIsDragging(true);
    setDragOffset(0);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    if (e.pointerId !== undefined && pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 6) {
      hasDraggedSignificantly.current = true;
    }
    dragOffsetRef.current = delta;
    setDragOffset(delta);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    if (e.pointerId !== undefined && pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    try {
      if (pointerIdRef.current !== null) {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(pointerIdRef.current);
      }
    } catch {
      // Ignored
    }
    pointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);

    const delta = dragOffsetRef.current || (e.clientX ? e.clientX - dragStartX.current : 0);
    dragOffsetRef.current = 0;
    setDragOffset(0);

    const threshold = Math.max(40, (stepSize || 300) * 0.12);

    if (delta < -threshold) {
      handleNext();
    } else if (delta > threshold) {
      handlePrev();
    }

    setTimeout(() => {
      hasDraggedSignificantly.current = false;
    }, 80);
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    if (e.pointerId !== undefined && pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    pointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setTimeout(() => {
      hasDraggedSignificantly.current = false;
    }, 80);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!canScroll) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  }

  function handleOpenTour(tour: VerifiedTour) {
    if (hasDraggedSignificantly.current) return;
    setSelectedTour(tour);
  }

  function handleCloseModal() {
    setSelectedTour(null);
  }

  // Calculate translation offset clamped within boundaries
  const step = stepSize || 360;
  const targetOffset = canScroll
    ? Math.min(currentIndex * step, maxScroll > 0 ? maxScroll : currentIndex * step)
    : 0;

  const visualOffset = canScroll
    ? Math.max(0, Math.min(targetOffset - dragOffset, maxScroll > 0 ? maxScroll + 40 : 9999))
    : 0;

  const transitionStyle = !withTransition || isDragging || prefersReducedMotion
    ? 'none'
    : 'transform 550ms cubic-bezier(0.25, 1, 0.5, 1)';

  // Active clamped index for pagination indicators
  const activeSlideIndex = Math.min(currentIndex, maxIndex);

  return (
    <section id="tours" className="scroll-mt-20 py-16 sm:py-24 bg-[#f8fafc] px-3 sm:px-6 lg:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-7xl xl:max-w-[1440px]">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10">
            <div className="max-w-2xl">
              <LandingEyebrow icon="verified" className="mb-3">
                Tour bản địa được bảo chứng
              </LandingEyebrow>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C2928] tracking-tight">
                Tour Trải Nghiệm Bản Địa <span className="text-[#103B39]">Đã Kiểm Duyệt</span>
              </h2>
              <p className="mt-3 text-slate-500 text-sm sm:text-base leading-relaxed text-pretty">
                Khám phá các tour du lịch tiêu biểu từ những đối tác lữ hành uy tín tại Miền Trung.
                Tích hợp lịch khởi hành chi tiết và bảo chứng thanh toán an toàn.
              </p>
            </div>

            {/* Filter Pills & View All Link: Clean single row anchored to Top-Right Corner */}
            <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 sm:gap-4 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleFilterChange('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterCity === 'all'
                      ? 'bg-[#103B39] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({VERIFIED_TOURS.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('Đà Nẵng')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterCity === 'Đà Nẵng'
                      ? 'bg-[#103B39] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đà Nẵng
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('Hội An')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterCity === 'Hội An'
                      ? 'bg-[#d97706] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hội An
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('Huế')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterCity === 'Huế'
                      ? 'bg-[#7c3aed] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cố Đô Huế
                </button>
              </div>

              <Link
                href={ROUTES.tours}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#103B39] hover:text-teal-800 transition group shrink-0"
              >
                <span>Xem tất cả tour</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Tours Carousel Container */}
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="relative group/carousel">
            <div
              ref={containerRef}
              id={carouselId}
              role="region"
              aria-roledescription="carousel"
              aria-label="Tour Trải Nghiệm Bản Địa Đã Kiểm Duyệt"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsFocused(false);
                }
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              className="relative w-full overflow-hidden select-none touch-pan-y focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#103B39] focus-visible:ring-offset-4 rounded-3xl cursor-grab active:cursor-grabbing py-2 px-1"
            >
              <div
                ref={trackRef}
                style={{
                  transform: `translateX(-${visualOffset}px)`,
                  transition: transitionStyle,
                }}
                className="flex gap-4 sm:gap-5 lg:gap-6 will-change-transform"
              >
                {filtered.map((tour, idx) => (
                  <div
                    key={tour.id}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} / ${filtered.length}: ${tour.title}`}
                    className="shrink-0 flex flex-col w-[calc((100%-1rem)/1.1)] sm:w-[calc((100%-2*1.25rem)/2.2)] lg:w-[calc((100%-3*1.5rem)/3.2)]"
                  >
                    <div className="relative h-full group">
                      <div className="relative z-10 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-teal-300 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                        {/* Tour Thumbnail Image */}
                        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                          <img
                            src={tour.image}
                            alt={tour.title}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none select-none"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-900 backdrop-blur-md shadow-xs">
                            {tour.tag}
                          </span>
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#103B39]/80 text-teal-300 backdrop-blur-md shadow-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-teal-300">verified</span>
                            <span>Đã kiểm duyệt</span>
                          </span>
                        </div>

                        {/* Tour Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                              <span className="font-semibold text-slate-600 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-[#103B39]">storefront</span>
                                {tour.operator}
                              </span>
                              <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                ★ {tour.rating}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-[#1C2928] line-clamp-2 group-hover:text-[#103B39] transition-colors leading-snug">
                              {tour.title}
                            </h3>

                            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                {tour.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">pin_drop</span>
                                {tour.city}
                              </span>
                            </div>

                            {/* Highlights */}
                            <div className="mt-3 flex flex-wrap gap-1">
                              {tour.highlights.slice(0, 2).map((h) => (
                                <span key={h} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  ✓ {h}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Giá từ:</span>
                              <span className="text-base font-black text-[#103B39]">{tour.price}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenTour(tour)}
                              className="px-3.5 py-2 rounded-xl bg-[#103B39] hover:bg-[#103B39] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtle Floating Navigation Chevrons: Automatically disappear when no more cards in that direction */}
            {canScroll && (
              <>
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Tour trước đó"
                    className="flex absolute -left-3 sm:-left-5 lg:-left-6 top-[130px] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-slate-800 border border-slate-200/90 shadow-md items-center justify-center transition hover:scale-110 active:scale-95 cursor-pointer hover:border-[#103B39] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#103B39]"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                )}
                {currentIndex < maxIndex && (
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Tour tiếp theo"
                    className="flex absolute -right-3 sm:-right-5 lg:-right-6 top-[130px] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-slate-800 border border-slate-200/90 shadow-md items-center justify-center transition hover:scale-110 active:scale-95 cursor-pointer hover:border-[#103B39] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#103B39]"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                )}
              </>
            )}

            {/* Subtle Pagination Indicators */}
            {canScroll && (
              <div className="mt-8 flex items-center justify-center gap-1.5" role="tablist" aria-label="Các trang tour">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={activeSlideIndex === i}
                    aria-label={`Trang tour ${i + 1} / ${maxIndex + 1}`}
                    onClick={() => handleSelectTour(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeSlideIndex === i
                        ? 'w-6 bg-[#103B39]'
                        : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Tour Detail & Informational Modal */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header Image */}
            <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-slate-100">
              <img
                src={selectedTour.image}
                alt={selectedTour.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-teal-600 text-white shadow-xs">
                  {selectedTour.operatorBadge}
                </span>
                <h3 className="text-lg font-black mt-2 leading-tight drop-shadow-md">
                  {selectedTour.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5">
              {/* Meta stats */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Đơn vị tổ chức:</span>
                  <strong className="text-slate-900 font-bold">{selectedTour.operator}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Thời lượng:</span>
                  <strong className="text-slate-900 font-bold">{selectedTour.duration}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Đánh giá:</span>
                  <strong className="text-amber-600 font-bold">
                    ★ {selectedTour.rating} ({selectedTour.reviewCount})
                  </strong>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Trải nghiệm bao gồm:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                  {selectedTour.highlights.map((h) => (
                    <div
                      key={h}
                      className="flex items-center gap-1.5 p-2 rounded-xl bg-teal-50/60 border border-teal-100 font-medium"
                    >
                      <span className="material-symbols-outlined text-sm text-[#103B39]">check_circle</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escrow Capability Note */}
              <div className="p-4 rounded-2xl bg-[#103B39] text-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-teal-300">verified_user</span>
                  <div>
                    <p className="text-xs font-bold text-white">Bảo chứng TripMate Escrow</p>
                    <p className="text-[11px] text-slate-300">
                      Thanh toán bảo đảm qua cổng đối tác • Hoàn tiền theo chính sách khi hủy chuyến do thời tiết
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-teal-400/20 text-teal-300 border border-teal-400/30 shrink-0">
                  Đã kiểm duyệt
                </span>
              </div>

              {/* Price & Action */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Giá từ:</span>
                  <span className="text-2xl font-black text-[#103B39]">{selectedTour.price}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                  <Link
                    href={ROUTES.tours}
                    className="px-6 py-2.5 rounded-xl bg-[#103B39] hover:bg-[#174B4A] text-white text-xs font-bold transition shadow-md shadow-teal-700/25 cursor-pointer flex items-center gap-2"
                  >
                    <span>Khám phá tour &amp; Lịch khởi hành</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

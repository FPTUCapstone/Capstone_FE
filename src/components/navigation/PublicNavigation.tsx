'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useSafePathname } from '@/lib/routes/useSafePathname';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { signInDestination } from '@/features/auth/routing/signInDestination';
import { useWebSession } from '@/features/auth/session/useWebSession';
import {
  getTravelerProfile,
  TRAVELER_PROFILE_UPDATED_EVENT,
  type TravelerProfileDto,
} from '@/features/account/profile/travelerProfileApi';
import { ROUTES } from '@/lib/routes';
import { publicNavigationEn } from './resources/en';
import { publicNavigationVi } from './resources/vi';

export const PersistentHeaderContext = createContext<boolean>(false);

interface PublicNavigationProps {
  isLanding?: boolean;
  locale?: 'vi' | 'en';
}



export function PublicNavigation({ isLanding = false, locale }: PublicNavigationProps = {}) {
  const isNestedUnderPersistentLayout = useContext(PersistentHeaderContext);
  const pathname = useSafePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Default to Vietnamese in all environments (SSR & Client) to match <html lang="vi">.
  // Explicit locale override can be provided via props (e.g. locale="en").
  const resolvedLocale = locale ?? 'vi';

  const strings = resolvedLocale === 'vi' ? publicNavigationVi : publicNavigationEn;
  const drawerStrings = resolvedLocale === 'vi' ? publicNavigationVi.drawer : publicNavigationEn.drawer;

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Focus close button on drawer open
  useEffect(() => {
    if (isDrawerOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isDrawerOpen]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // An empty in-memory context is NOT considered Guest until the
  // cookie-backed session restore has completed.
  const { status, context } = useWebSession();
  const [travelerProfile, setTravelerProfile] = useState<TravelerProfileDto | null>(null);
  const profileRevision = useRef(0);

  useEffect(() => {
    if (status !== 'authenticated' || context?.role !== 'Traveler') return;
    const userId = context.userId;
    let active = true;
    const requestRevision = profileRevision.current;
    void getTravelerProfile()
      .then((profile) => {
        if (active && profileRevision.current === requestRevision && profile.userId === userId) {
          setTravelerProfile(profile);
        }
      })
      .catch(() => {
        // Fallback to session identity if profile retrieval fails.
      });

    function onProfileUpdated(event: Event) {
      const profile = (event as CustomEvent<TravelerProfileDto>).detail;
      if (profile?.userId === userId) {
        profileRevision.current++;
        setTravelerProfile(profile);
      }
    }
    window.addEventListener(TRAVELER_PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => {
      active = false;
      window.removeEventListener(TRAVELER_PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [status, context?.role, context?.userId]);

  const currentTravelerProfile =
    context?.role === 'Traveler' && travelerProfile?.userId === context.userId
      ? travelerProfile
      : null;

  const displayName = context
    ? currentTravelerProfile?.fullName?.trim() || context.fullName.trim() || context.email
    : '';

  const showPartner = status === 'unauthenticated' || context?.role === 'TourOperator';

  const partnerHref =
    context?.role === 'TourOperator'
      ? signInDestination(context) ?? ROUTES.partner.application
      : ROUTES.partner.register;

  // Desktop navigation sliding pill indicator state
  const navRef = useRef<HTMLElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const hoverPillRef = useRef<HTMLSpanElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [clickedKey, setClickedKey] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setClickedKey(null);
  }

  const isHome = isLanding || pathname === '/' || pathname === '';

  const activeRouteKey = isHome
    ? null
    : pathname.startsWith('/pois')
    ? 'pois'
    : pathname.startsWith('/plan')
    ? 'plan'
    : pathname.startsWith('/tours')
    ? 'tours'
    : pathname.startsWith('/itinerar')
    ? 'itineraries'
    : pathname.startsWith('/partner')
    ? 'partner'
    : null;

  const selectedKey = isHome ? (clickedKey ?? null) : (clickedKey ?? activeRouteKey);

  const updateActivePill = useCallback((key: string | null, animated = true) => {
    const pill = pillRef.current;
    if (!pill) return;
    if (!key) {
      pill.style.opacity = '0';
      return;
    }
    const el = itemRefs.current.get(key);
    if (el) {
      if (!animated) {
        pill.style.transition = 'none';
      }
      pill.style.left = `${el.offsetLeft}px`;
      pill.style.top = `${el.offsetTop}px`;
      pill.style.width = `${el.offsetWidth}px`;
      pill.style.height = `${el.offsetHeight}px`;
      pill.style.opacity = '1';
      if (!animated) {
        void pill.offsetHeight;
        pill.style.transition = '';
      }
    } else {
      pill.style.opacity = '0';
    }
  }, []);

  const updateHoverPill = useCallback((key: string | null) => {
    const hoverPill = hoverPillRef.current;
    if (!hoverPill) return;
    if (!key || key === selectedKey) {
      hoverPill.style.opacity = '0';
      return;
    }
    const el = itemRefs.current.get(key);
    if (el) {
      hoverPill.style.left = `${el.offsetLeft}px`;
      hoverPill.style.top = `${el.offsetTop}px`;
      hoverPill.style.width = `${el.offsetWidth}px`;
      hoverPill.style.height = `${el.offsetHeight}px`;
      hoverPill.style.opacity = '1';
    } else {
      hoverPill.style.opacity = '0';
    }
  }, [selectedKey]);

  useEffect(() => {
    if (!selectedKey) {
      updateActivePill(null);
      return;
    }

    // Cross-page slide continuity: check if an origin position was stored before page transition
    let originData: { key: string; left: number; top: number; width: number; height: number } | null = null;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = sessionStorage.getItem('tripmate_nav_origin');
        const target = sessionStorage.getItem('tripmate_nav_target');
        if (raw && target === selectedKey) {
          originData = JSON.parse(raw);
        }
        sessionStorage.removeItem('tripmate_nav_origin');
        sessionStorage.removeItem('tripmate_nav_target');
      }
    } catch {}

    const pill = pillRef.current;
    const targetEl = itemRefs.current.get(selectedKey);

    if (pill && targetEl) {
      if (originData && originData.key !== selectedKey) {
        // Place pill initially at previous tab's coordinates without transition
        pill.style.transition = 'none';
        pill.style.left = `${originData.left}px`;
        pill.style.top = `${originData.top}px`;
        pill.style.width = `${originData.width}px`;
        pill.style.height = `${originData.height}px`;
        pill.style.opacity = '1';

        // Smoothly glide into target tab position on next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            pill.style.transition = '';
            pill.style.left = `${targetEl.offsetLeft}px`;
            pill.style.top = `${targetEl.offsetTop}px`;
            pill.style.width = `${targetEl.offsetWidth}px`;
            pill.style.height = `${targetEl.offsetHeight}px`;
          });
        });
      } else {
        updateActivePill(selectedKey);
      }
    }

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        updateActivePill(selectedKey);
      });
    }
  }, [selectedKey, updateActivePill]);

  useEffect(() => {
    function handleResize() {
      updateActivePill(selectedKey, false);
      if (hoveredKey && hoveredKey !== selectedKey) {
        updateHoverPill(hoveredKey);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hoveredKey, selectedKey, updateActivePill, updateHoverPill]);

  interface DesktopNavItem {
    key: string;
    href: string;
    label: string;
    isAnchor?: boolean;
    isPartner?: boolean;
  }

  const navItems: DesktopNavItem[] =
    resolvedLocale === 'en'
      ? [
          { key: 'pois', href: ROUTES.pois, label: strings.links.explore },
          { key: 'destinations', href: '#destinations', label: strings.links.destinations, isAnchor: true },
          { key: 'plan', href: ROUTES.plan, label: strings.links.smartItinerary },
          { key: 'weather', href: '#weather-rerouting', label: strings.links.weatherRerouting, isAnchor: true },
          { key: 'tours', href: ROUTES.tours, label: strings.links.localTours },
          ...(context?.role === 'Traveler'
            ? [{ key: 'itineraries', href: ROUTES.myItineraries, label: strings.links.myItineraries }]
            : []),
          ...(showPartner
            ? [{ key: 'partner', href: partnerHref, label: strings.links.forPartners, isPartner: true }]
            : []),
        ]
      : [
          { key: 'pois', href: ROUTES.pois, label: strings.links.explore },
          { key: 'plan', href: ROUTES.plan, label: strings.links.smartItinerary },
          { key: 'tours', href: ROUTES.tours, label: strings.links.localTours },
          ...(context?.role === 'Traveler'
            ? [{ key: 'itineraries', href: ROUTES.myItineraries, label: strings.links.myItineraries }]
            : []),
          ...(showPartner
            ? [{ key: 'partner', href: partnerHref, label: strings.links.forPartners, isPartner: true }]
            : []),
        ];

  if (isNestedUnderPersistentLayout) {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 px-4 sm:px-8 py-3.5 ${
        isScrolled
          ? 'border-b border-[#E5E0D8]/90 bg-[#F8F6F1]/95 backdrop-blur-md shadow-xs'
          : 'border-b border-[#E5E0D8]/60 bg-[#F8F6F1]'
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <Link
          href={ROUTES.home}
          onClick={() => {
            setClickedKey(null);
            updateActivePill(null);
          }}
          aria-label={strings.brandAria}
          className="shrink-0 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
        >
          <BrandLogo />
        </Link>

        {/* Desktop Primary Navigation with Fluid Sliding Pill & Translucent Hover Preview */}
        <nav
          ref={navRef}
          onMouseLeave={() => {
            setHoveredKey(null);
            updateHoverPill(null);
          }}
          className="relative hidden md:flex items-center gap-1 bg-[#EFECE4]/80 p-1.5 rounded-2xl border border-[#E5E0D8]"
          aria-label={strings.navAria}
        >
          {/* Active Sliding Pill Indicator (Solid White) */}
          <span
            ref={pillRef}
            aria-hidden="true"
            data-testid="nav-sliding-pill"
            className="absolute rounded-xl bg-white shadow-xs border border-[#E5E0D8]/90 pointer-events-none z-0 nav-sliding-pill opacity-0"
          />

          {/* Translucent Hover Indicator Pill (dim preview relative to selected tab) */}
          <span
            ref={hoverPillRef}
            aria-hidden="true"
            data-testid="nav-hover-pill"
            className="absolute rounded-xl bg-white/55 backdrop-blur-xs border border-white/50 pointer-events-none z-0 nav-hover-pill opacity-0"
          />

          {navItems.map((item) => {
            const isSelected = selectedKey === item.key;
            const isHovered = hoveredKey === item.key && !isSelected;
            const linkClassName = `relative z-10 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-colors duration-200 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56] ${
              isSelected
                ? 'text-[#005F56]'
                : isHovered
                ? 'text-[#121E28]'
                : item.isPartner
                ? 'text-[#556370]'
                : 'text-[#121E28]/70'
            }`;

            const commonProps = {
              ref: (el: HTMLElement | null) => {
                if (el) itemRefs.current.set(item.key, el);
                else itemRefs.current.delete(item.key);
              },
              onMouseEnter: () => {
                setHoveredKey(item.key);
                updateHoverPill(item.key);
              },
              onClick: () => {
                setHoveredKey(null);
                updateHoverPill(null);

                

                setClickedKey(item.key);
                updateActivePill(item.key, true);
              },
              'aria-current': isSelected ? ('page' as const) : undefined,
              className: linkClassName,
            };

            return item.isAnchor ? (
              <a key={item.key} href={item.href} {...commonProps}>
                {item.label}
              </a>
            ) : (
              <Link key={item.key} href={item.href} {...commonProps}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Account / Session Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {status === 'authenticated' ? (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={ROUTES.account.profile}
                aria-label={strings.account.profileAria}
                className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-[#005F56] transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
              >
                {currentTravelerProfile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentTravelerProfile.avatarUrl}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    account_circle
                  </span>
                )}
                <span className="max-w-[140px] truncate">{displayName}</span>
              </Link>

              <LogoutButton />
            </div>
          ) : status === 'restoring' ? (
            <div
              role="status"
              aria-label={strings.account.restoringAria}
              className="h-10 w-24 animate-pulse rounded-xl bg-gray-200"
            >
              <span className="sr-only">{strings.account.restoringSrText}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href={ROUTES.signIn}
                className="min-h-10 inline-flex items-center px-4 py-2 text-xs font-bold text-[#121E28] hover:text-[#005F56] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
              >
                {strings.account.signIn}
              </Link>

              <Link
                href={ROUTES.register}
                className="min-h-10 hidden lg:inline-flex items-center rounded-xl border border-[#D5CEBF] bg-white px-4 py-2 text-xs font-bold text-[#121E28] hover:bg-[#F4F1EA] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
              >
                {strings.account.register}
              </Link>

              <Link
                href={ROUTES.plan}
                className="min-h-10 inline-flex items-center gap-1.5 rounded-xl bg-[#005F56] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#004D46] transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#005F56]"
              >
                <span>{strings.account.quickPlan}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Controls: Quick CTA + Hamburger Menu */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <Link
            href={ROUTES.plan}
            className="min-h-8 inline-flex items-center justify-center rounded-lg bg-[#005F56] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs shrink-0"
          >
            {strings.account.mobilePlan}
          </Link>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={drawerStrings.openAria}
            className="w-8 h-8 rounded-lg bg-[#EFECE4] text-[#121E28] flex items-center justify-center hover:bg-[#E2DDD3] transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        </div>
      </div>

      {/* Accessible Mobile Slide-in Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            id="mobile-nav-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={drawerStrings.title}
            className="fixed top-0 right-0 bottom-0 w-[300px] bg-[#F8F6F1] shadow-2xl z-50 flex flex-col justify-between p-6 border-l border-[#E5E0D8] animate-in slide-in-from-right duration-200"
          >
            <div>
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#121E28]">Menu</span>
                  <span className="text-xs text-[#005F56] font-bold">TripMate</span>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label={drawerStrings.closeAria}
                  className="w-9 h-9 rounded-xl bg-[#EFECE4] text-[#121E28] flex items-center justify-center hover:bg-[#E2DDD3] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Navigation Links with Descriptive Subtitles */}
              <nav className="mt-6 space-y-2" aria-label={drawerStrings.navAria}>
                <Link
                  href={ROUTES.pois}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-xl text-sm font-bold text-[#121E28] hover:bg-[#EFECE4] transition btn-press"
                >
                  <span className="material-symbols-outlined text-xl text-[#005F56]">explore</span>
                  <div>
                    <div>{strings.links.explore}</div>
                    <div className="text-[10px] font-normal text-[#64748B]">
                      {drawerStrings.poisDesc}
                    </div>
                  </div>
                </Link>

                <Link
                  href={ROUTES.plan}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-xl text-sm font-bold text-[#121E28] hover:bg-[#EFECE4] transition btn-press"
                >
                  <span className="material-symbols-outlined text-xl text-[#005F56]">calendar_month</span>
                  <div>
                    <div>{strings.links.smartItinerary}</div>
                    <div className="text-[10px] font-normal text-[#64748B]">
                      {drawerStrings.planDesc}
                    </div>
                  </div>
                </Link>

                <Link
                  href={ROUTES.tours}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-xl text-sm font-bold text-[#121E28] hover:bg-[#EFECE4] transition btn-press"
                >
                  <span className="material-symbols-outlined text-xl text-[#005F56]">tour</span>
                  <div>
                    <div>{strings.links.localTours}</div>
                    <div className="text-[10px] font-normal text-[#64748B]">
                      {drawerStrings.toursDesc}
                    </div>
                  </div>
                </Link>

                {context?.role === 'Traveler' && (
                  <Link
                    href={ROUTES.myItineraries}
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3.5 p-3 rounded-xl text-sm font-bold text-[#121E28] hover:bg-[#EFECE4] transition btn-press"
                  >
                    <span className="material-symbols-outlined text-xl text-[#005F56]">receipt_long</span>
                    <div>
                      <div>{strings.links.myItineraries}</div>
                      <div className="text-[10px] font-normal text-[#64748B]">
                        {drawerStrings.myItinerariesDesc}
                      </div>
                    </div>
                  </Link>
                )}

                {showPartner && (
                  <Link
                    href={partnerHref}
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3.5 p-3 rounded-xl text-sm font-bold text-[#121E28] hover:bg-[#EFECE4] transition btn-press"
                  >
                    <span className="material-symbols-outlined text-xl text-[#556370]">business</span>
                    <div>
                      <div>{strings.links.forPartners}</div>
                      <div className="text-[10px] font-normal text-[#64748B]">
                        {drawerStrings.partnerDesc}
                      </div>
                    </div>
                  </Link>
                )}
              </nav>
            </div>

            {/* Drawer Bottom Session Actions */}
            <div className="pt-6 border-t border-[#E5E0D8] space-y-3">
              {status === 'authenticated' ? (
                <div className="space-y-3">
                  <Link
                    href={ROUTES.account.profile}
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full flex items-center gap-2 p-3 rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-[#005F56]"
                  >
                    <span className="material-symbols-outlined text-base">account_circle</span>
                    <span className="truncate">{displayName}</span>
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    href={ROUTES.signIn}
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full block text-center py-2.5 rounded-xl border border-[#D5CEBF] text-xs font-bold text-[#121E28] bg-white hover:bg-[#EFECE4] transition"
                  >
                    {strings.account.signIn}
                  </Link>
                  <Link
                    href={ROUTES.register}
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full block text-center py-2.5 rounded-xl bg-[#005F56] text-white text-xs font-bold shadow-xs hover:bg-[#004D46] transition"
                  >
                    {strings.account.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

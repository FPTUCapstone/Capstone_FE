'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSafePathname } from '@/lib/routes/useSafePathname';
import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import LogoutDialog from '@/components/LogoutDialog';
import { webLogout } from '@/lib/authApi';
import { AuthStorage } from '@/features/auth/session/authSession';
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

interface DesktopNavItem {
  key: string;
  href: string;
  label: string;
  isAnchor?: boolean;
}

export function PublicNavigation({ isLanding = false, locale }: PublicNavigationProps = {}) {
  const isNestedUnderPersistentLayout = useContext(PersistentHeaderContext);
  const pathname = useSafePathname();
  const router = useRouter();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Partner Dropdown & Logout dialog states
  const [isPartnerMenuOpen, setIsPartnerMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const partnerMenuRef = useRef<HTMLDivElement>(null);
  const partnerButtonRef = useRef<HTMLButtonElement>(null);

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

  // Scroll listener for landing progress & header appearance
  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      if (isLanding) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0) {
          setScrollProgress(Math.min(1, Math.max(0, scrollY / maxScroll)));
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  // Mobile drawer keyboard & scroll locks
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (isDrawerOpen) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Dropdown dismissal: outside click & Escape key
  useEffect(() => {
    if (!isPartnerMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (partnerMenuRef.current && !partnerMenuRef.current.contains(event.target as Node)) {
        setIsPartnerMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPartnerMenuOpen(false);
        partnerButtonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPartnerMenuOpen]);

  // Session & Profile
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
      .catch(() => {});

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

  const handlePartnerLogoutConfirm = async () => {
    try {
      await webLogout();
      AuthStorage.clear();
      setIsLogoutDialogOpen(false);
      router.replace(ROUTES.signIn);
      router.refresh();
    } catch {
      setIsLogoutDialogOpen(false);
    }
  };

  const resolvedLocale = locale ?? 'vi';
  const strings = resolvedLocale === 'en' ? publicNavigationEn : publicNavigationVi;
  const drawerStrings = strings.drawer;

  const isOperatorApproved =
    context?.role === 'TourOperator' && context.applicationStatus === 'Approved';

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
    : null;

  const selectedKey = clickedKey ?? activeRouteKey;

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
        pill.style.transition = 'none';
        pill.style.left = `${originData.left}px`;
        pill.style.top = `${originData.top}px`;
        pill.style.width = `${originData.width}px`;
        pill.style.height = `${originData.height}px`;
        pill.style.opacity = '1';

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

  // Primary navigation tabs (matching the approved header visual reference)
  const navItems: DesktopNavItem[] = [
    { key: 'pois', href: ROUTES.pois, label: strings.links.explore },
    {
      key: 'destinations',
      href: isLanding ? '#destinations' : `${ROUTES.home}#destinations`,
      label: strings.links.destinations,
      isAnchor: isLanding,
    },
    { key: 'plan', href: ROUTES.plan, label: strings.links.smartItinerary },
    ...(context?.role === 'Traveler'
      ? [{ key: 'itineraries', href: ROUTES.myItineraries, label: strings.links.myItineraries }]
      : []),
    {
      key: 'weather',
      href: isLanding ? '#weather-rerouting' : `${ROUTES.home}#weather-rerouting`,
      label: strings.links.weatherRerouting,
      isAnchor: isLanding,
    },
    { key: 'tours', href: ROUTES.tours, label: strings.links.localTours },
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
      {/* Landing Scroll Progress Indicator */}
      {isLanding && (
        <div
          className="absolute bottom-0 left-0 h-[2.5px] bg-[#005F56] transition-transform duration-75 origin-left"
          style={{ transform: `scaleX(${scrollProgress})`, width: '100%' }}
          aria-hidden="true"
        />
      )}

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

          {/* Translucent Hover Indicator Pill */}
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
                try {
                  if (typeof window !== 'undefined' && window.sessionStorage) {
                    const el = itemRefs.current.get(item.key);
                    if (el) {
                      sessionStorage.setItem(
                        'tripmate_nav_origin',
                        JSON.stringify({
                          key: item.key,
                          left: el.offsetLeft,
                          top: el.offsetTop,
                          width: el.offsetWidth,
                          height: el.offsetHeight,
                        })
                      );
                      sessionStorage.setItem('tripmate_nav_target', item.key);
                    }
                  }
                } catch {}
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
              {context?.role === 'TourOperator' ? (
                /* Role-Aware Tour Operator Dropdown Menu */
                <div className="relative" ref={partnerMenuRef}>
                  <button
                    ref={partnerButtonRef}
                    type="button"
                    onClick={() => setIsPartnerMenuOpen((prev) => !prev)}
                    aria-expanded={isPartnerMenuOpen}
                    aria-haspopup="menu"
                    aria-label={strings.account.partnerMenuAria}
                    className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-[#005F56] transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">
                      storefront
                    </span>
                    <span className="max-w-[120px] truncate">{displayName}</span>
                    <span className="rounded-md bg-teal-700/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                      {strings.account.operatorRoleBadge}
                    </span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform duration-200 ${
                        isPartnerMenuOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </button>

                  {isPartnerMenuOpen && (
                    <div
                      role="menu"
                      aria-label={strings.account.partnerMenuAria}
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {strings.account.operatorRoleBadge}
                        </p>
                        <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                          {displayName}
                        </p>
                      </div>

                      <div className="py-1">
                        {isOperatorApproved ? (
                          <>
                            <Link
                              href={ROUTES.partner.dashboard}
                              role="menuitem"
                              onClick={() => setIsPartnerMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-[#005F56]"
                            >
                              <span
                                className="material-symbols-outlined text-base text-[#005F56]"
                                aria-hidden="true"
                              >
                                dashboard
                              </span>
                              <span>{strings.account.partnerWorkspace}</span>
                            </Link>
                            <Link
                              href={ROUTES.partner.profile}
                              role="menuitem"
                              onClick={() => setIsPartnerMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-[#005F56]"
                            >
                              <span
                                className="material-symbols-outlined text-base text-slate-500"
                                aria-hidden="true"
                              >
                                domain
                              </span>
                              <span>{strings.account.partnerProfile}</span>
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={ROUTES.partner.application}
                            role="menuitem"
                            onClick={() => setIsPartnerMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
                          >
                            <span
                              className="material-symbols-outlined text-base text-amber-600"
                              aria-hidden="true"
                            >
                              pending_actions
                            </span>
                            <span>{strings.account.partnerApplication}</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsPartnerMenuOpen(false);
                            setIsLogoutDialogOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-rose-600" aria-hidden="true">
                            logout
                          </span>
                          <span>{strings.account.logOut}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : context?.role === 'Administrator' || context?.role === 'Staff' ? (
                <Link
                  href={ROUTES.admin.dashboard}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    admin_panel_settings
                  </span>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </Link>
              ) : (
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
              )}

              {context?.role !== 'TourOperator' && <LogoutButton />}
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
                className="min-h-10 inline-flex items-center rounded-xl bg-[#005F56] text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#004D46] transition btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
              >
                {strings.account.register}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label={drawerStrings.openAria}
            className="p-2 rounded-xl text-[#121E28] hover:bg-[#EFECE4] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </div>

      {/* Tour Operator Logout Confirmation Dialog */}
      <LogoutDialog
        open={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handlePartnerLogoutConfirm}
      />

      {/* Accessible Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={drawerStrings.navAria}>
          <div
            className="fixed inset-0 bg-[#121E28]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={drawerRef}
            className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#F8F6F1] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#E5E0D8]">
                <BrandLogo />
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label={drawerStrings.closeAria}
                  className="p-2 rounded-xl text-[#121E28] hover:bg-[#EFECE4] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F56]"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <nav className="py-6 space-y-1">
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

                <a
                  href={isLanding ? '#destinations' : `${ROUTES.home}#destinations`}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-xl text-sm font-bold text-[#121E28] hover:bg-[#EFECE4] transition btn-press"
                >
                  <span className="material-symbols-outlined text-xl text-[#005F56]">location_on</span>
                  <div>
                    <div>{strings.links.destinations}</div>
                    <div className="text-[10px] font-normal text-[#64748B]">
                      {drawerStrings.destinationsDesc}
                    </div>
                  </div>
                </a>

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

                <a
                  href={isLanding ? '#weather-rerouting' : `${ROUTES.home}#weather-rerouting`}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-xl text-sm font-bold text-[#121E28] hover:bg-[#EFECE4] transition btn-press"
                >
                  <span className="material-symbols-outlined text-xl text-[#005F56]">thunderstorm</span>
                  <div>
                    <div>{strings.links.weatherRerouting}</div>
                    <div className="text-[10px] font-normal text-[#64748B]">
                      {drawerStrings.weatherDesc}
                    </div>
                  </div>
                </a>

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
              </nav>
            </div>

            {/* Drawer Bottom Session Actions */}
            <div className="pt-6 border-t border-[#E5E0D8] space-y-3">
              {status === 'authenticated' ? (
                <div className="space-y-3">
                  {context?.role === 'TourOperator' ? (
                    <Link
                      href={isOperatorApproved ? ROUTES.partner.dashboard : ROUTES.partner.application}
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-full flex items-center gap-2 p-3 rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-[#005F56]"
                    >
                      <span className="material-symbols-outlined text-base">storefront</span>
                      <span className="truncate">{displayName}</span>
                    </Link>
                  ) : context?.role === 'Administrator' || context?.role === 'Staff' ? (
                    <Link
                      href={ROUTES.admin.dashboard}
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-full flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
                    >
                      <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                      <span className="truncate">{displayName}</span>
                    </Link>
                  ) : (
                    <Link
                      href={ROUTES.account.profile}
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-full flex items-center gap-2 p-3 rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-[#005F56]"
                    >
                      <span className="material-symbols-outlined text-base">account_circle</span>
                      <span className="truncate">{displayName}</span>
                    </Link>
                  )}
                  {context?.role !== 'TourOperator' && <LogoutButton />}
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

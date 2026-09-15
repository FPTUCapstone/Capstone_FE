'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { clearTokens } from '@/lib/authApi';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

interface NavUser {
  displayName: string;
  email?: string;
}

function getInitialUser(): NavUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('tripmate_access_token');
  if (!token) return null;

  const storedUser = localStorage.getItem('tripmate_user');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      return {
        displayName: parsed.fullName || parsed.displayName || parsed.email || 'User',
        email: parsed.email,
      };
    } catch {
      return { displayName: 'User' };
    }
  }
  return { displayName: 'User' };
}

export function PublicNavigation() {
  const [currentUser, setCurrentUser] = useState<NavUser | null>(() => getInitialUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          displayName: user.displayName || user.email || 'User',
          email: user.email || undefined,
        });
      } else {
        const localUser = getInitialUser();
        setCurrentUser(localUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
    clearTokens();
    setCurrentUser(null);
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8dadd] bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.home} aria-label="TripMate Landing Page">
          <BrandLogo />
        </Link>
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:order-2 sm:w-auto" aria-label="Public navigation">
          <Link href={ROUTES.pois} className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-[#43474d] hover:bg-[#eceef1] sm:px-3 sm:text-sm">Khám phá</Link>
          <Link href="/#tours" className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-[#43474d] hover:bg-[#eceef1] sm:px-3 sm:text-sm">Tours</Link>
          {!loading && !currentUser ? (
            <Link href={ROUTES.register} className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-[#43474d] hover:bg-[#eceef1] sm:px-3 sm:text-sm">Đăng ký</Link>
          ) : null}
          <Link href={ROUTES.partner.register} className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-[#43474d] hover:bg-[#eceef1] sm:px-3 sm:text-sm">Đối tác</Link>
        </nav>
        
        {loading ? (
          <div className="order-2 h-10 w-24 animate-pulse rounded-xl bg-gray-200 sm:order-3" />
        ) : currentUser ? (
          <div className="order-2 flex items-center gap-3 sm:order-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#EFF6FF] px-3.5 py-1.5 text-xs font-bold text-[#1D4ED8] border border-[#DBEAFE]">
              <span className="material-symbols-outlined text-base">account_circle</span>
              <span className="max-w-[140px] truncate sm:max-w-[180px]">{currentUser.displayName}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#d8dadd] bg-white px-3.5 py-1.5 text-xs font-bold text-[#43474d] hover:bg-[#f2f4f7] hover:text-[#00152a] transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link href={ROUTES.signIn} className="order-2 inline-flex min-h-11 items-center rounded-xl bg-[#1D4ED8] px-4 py-2 text-sm font-bold text-white hover:bg-[#1E40AF] transition sm:order-3 sm:px-5">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}


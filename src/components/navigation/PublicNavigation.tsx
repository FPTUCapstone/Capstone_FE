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
    try {
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
    } catch {
      queueMicrotask(() => {
        setLoading(false);
      });
    }
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.home} aria-label="TripMate Landing Page">
          <BrandLogo />
        </Link>
        
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto" aria-label="Public navigation">
          <a href="#destinations" className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#007d6e] transition">Điểm đến</a>
          <a href="#csp-simulator" className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#007d6e] transition">Lịch trình Tối ưu</a>
          <a href="#weather-rerouting" className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#007d6e] transition">Cứu nguy Thời tiết</a>
          <a href="#tours" className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#007d6e] transition">Tour Bản địa</a>
          <a href="#partner" className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#007d6e] transition">Dành cho Đối tác</a>
        </nav>
        
        {loading ? (
          <div className="order-2 h-9 w-20 animate-pulse rounded-xl bg-gray-200 sm:order-3" />
        ) : currentUser ? (
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <div className="flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#007d6e] border border-teal-200">
              <span className="material-symbols-outlined text-sm">account_circle</span>
              <span className="max-w-[120px] truncate sm:max-w-[160px]">{currentUser.displayName}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <Link href={ROUTES.register} className="hidden sm:inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
              Đăng ký
            </Link>
            <Link href={ROUTES.signIn} className="inline-flex min-h-9 items-center rounded-xl bg-[#007d6e] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#006b5f] transition shadow-xs">
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

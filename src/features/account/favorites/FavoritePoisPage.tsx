'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAccountWorkspace } from '@/features/account/common/AccountWorkspaceContext';
import { AccountWorkspaceNav } from '@/features/account/common/AccountWorkspaceNav';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PoiPagination } from '@/features/public/pois/components/PoiPagination';
import {
  DEFAULT_FAVORITE_POIS_PAGE_SIZE,
  listFavoritePois,
  PoiFavoriteError,
  setPoiFavorite,
  type FavoritePoiItem,
  type PagedFavoritePois,
} from '@/features/public/pois/services/poiFavoriteApi';
import { ROUTES } from '@/lib/routes';
import { FavoritePoiCard } from './FavoritePoiCard';

const SIGN_IN_RETURN = `${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.favorites)}`;

function FavoritesLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách địa điểm yêu thích"
      className="space-y-4"
    >
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white sm:flex-row"
        >
          <div className="aspect-[16/10] w-full bg-slate-200 sm:aspect-auto sm:h-44 sm:w-48 md:w-52" />
          <div className="flex-1 space-y-3 p-5">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-6 w-2/3 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-20 rounded bg-slate-100" />
              <div className="h-6 w-24 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FavoritePoisPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  const { isInsideShell } = useAccountWorkspace();
  const { status, context } = useWebSession();

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [data, setData] = useState<PagedFavoritePois | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(SIGN_IN_RETURN);
    } else if (status === 'authenticated' && context?.role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Staff') {
      router.replace(ROUTES.admin.staffDashboard);
    }
  }, [status, context, router]);

  useEffect(() => {
    if (status !== 'authenticated' || context?.role !== 'Traveler') return;
    const controller = new AbortController();

    listFavoritePois({
      page,
      pageSize: DEFAULT_FAVORITE_POIS_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        setData(response);
        setLoadError(null);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        if (caught instanceof PoiFavoriteError && caught.status === 401) {
          routerRef.current.replace(SIGN_IN_RETURN);
          return;
        }
        setLoadError(
          caught instanceof PoiFavoriteError
            ? caught.message
            : 'Không thể tải danh sách địa điểm yêu thích lúc này.',
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [status, context?.role, page, reloadToken]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    setReloadToken((value) => value + 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    setPage(nextPage);
  };

  const handleRemove = async (poi: FavoritePoiItem) => {
    if (removingIds[poi.id]) return;
    setActionError(null);
    setRemovingIds((prev) => ({ ...prev, [poi.id]: true }));

    try {
      await setPoiFavorite(poi.id, false);
      const remainingOnPage = (data?.items ?? []).filter((item) => item.id !== poi.id);
      const nextTotalCount = Math.max(0, (data?.totalCount ?? 1) - 1);
      const effectivePageSize = data?.pageSize ?? DEFAULT_FAVORITE_POIS_PAGE_SIZE;
      const nextTotalPages =
        nextTotalCount === 0 ? 0 : Math.ceil(nextTotalCount / effectivePageSize);

      if (remainingOnPage.length === 0 && page > 1) {
        setLoading(true);
        setPage((current) => Math.max(1, current - 1));
      } else {
        setData((current) =>
          current
            ? {
                ...current,
                totalCount: nextTotalCount,
                totalPages: nextTotalPages,
                items: remainingOnPage,
              }
            : current,
        );
        setReloadToken((value) => value + 1);
      }
    } catch (caught: unknown) {
      if (caught instanceof PoiFavoriteError && caught.status === 401) {
        router.replace(SIGN_IN_RETURN);
        return;
      }
      setActionError(`Chưa gỡ được "${poi.name}" khỏi danh sách yêu thích. Vui lòng thử lại.`);
    } finally {
      setRemovingIds((prev) => {
        const next = { ...prev };
        delete next[poi.id];
        return next;
      });
    }
  };

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#5B6E69]">Đang tải thông tin tài khoản…</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !context || context.role !== 'Traveler') {
    return null;
  }

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const content = (
    <div className="space-y-6">
      {!isInsideShell && (
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-2 text-xs font-semibold text-[#5B6E69]"
        >
          <Link href={ROUTES.home} className="hover:text-[#174B4A] hover:underline">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={ROUTES.account.profile} className="hover:text-[#174B4A] hover:underline">
            Tài khoản cá nhân
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#1C2928]">Địa điểm yêu thích</span>
        </nav>
      )}

      <AccountWorkspaceNav activeTab="favorites" />

      {/* Header */}
      <section className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                <span
                  className="material-symbols-outlined text-[14px]"
                  aria-hidden="true"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                Danh sách đã lưu
              </span>
              {!loading && !loadError ? (
                <span className="rounded-full bg-[#E8F0EA] px-2.5 py-0.5 text-xs font-bold text-[#174B4A]">
                  {totalCount} địa điểm đã lưu
                </span>
              ) : null}
            </div>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-[#1C2928] sm:text-3xl">
              Địa điểm yêu thích
            </h1>
            <p className="mt-1 text-sm text-[#5B6E69]">
              Theo dõi các điểm tham quan (POI) bạn đã thả tim để xem lại chi tiết và giúp TripMate AI Atlas ưu tiên khi lập lịch trình.
            </p>
          </div>

          <Link
            href={ROUTES.pois}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#174B4A] bg-white px-4 py-2 text-xs font-bold text-[#174B4A] transition hover:bg-[#E8F0EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              explore
            </span>
            <span>Khám phá địa điểm</span>
          </Link>
        </div>
      </section>

      {actionError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="shrink-0 text-xs font-bold underline hover:text-rose-950"
          >
            Đóng
          </button>
        </div>
      ) : null}

      {/* Content */}
      {loading ? (
        <FavoritesLoadingSkeleton />
      ) : loadError ? (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xs"
        >
          <span
            className="material-symbols-outlined mx-auto text-3xl text-rose-600"
            aria-hidden="true"
          >
            error_outline
          </span>
          <h2 className="mt-2 text-lg font-bold text-[#1C2928]">
            Không thể tải danh sách địa điểm yêu thích
          </h2>
          <p className="mt-1.5 text-sm text-[#5B6E69]">{loadError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#103B39] px-5 text-sm font-bold text-white transition hover:bg-[#174B4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A]"
          >
            Thử lại
          </button>
        </section>
      ) : items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#DCE2DD] bg-white p-8 text-center shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
              favorite_border
            </span>
          </span>
          <h2 className="mt-4 text-lg font-bold text-[#1C2928]">
            Bạn chưa lưu địa điểm yêu thích nào
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[#5B6E69]">
            Khi xem chi tiết một địa điểm, hãy nhấn biểu tượng trái tim để lưu vào đây. Những điểm yêu thích cũng giúp TripMate AI Atlas cá nhân hóa lịch trình cho bạn.
          </p>
          <Link
            href={ROUTES.pois}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#103B39] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#174B4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A]"
          >
            <span>Khám phá địa điểm</span>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </section>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            {items.map((poi) => (
              <FavoritePoiCard
                key={poi.id}
                poi={poi}
                isRemoving={Boolean(removingIds[poi.id])}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pt-2">
              <PoiPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  if (isInsideShell) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]" lang="vi">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{content}</main>
    </div>
  );
}

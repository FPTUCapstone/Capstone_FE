'use client';

import { useState, type ReactNode } from 'react';
import { GroupChatHub } from '@/features/traveler/groups/components/GroupChatHub';
import {
  PublicNavigation,
  PersistentHeaderContext,
} from '@/components/navigation/PublicNavigation';
import { isPublicNavigationRoute } from '@/lib/routes/publicRoutePredicate';
import { useSafePathname } from '@/lib/routes/useSafePathname';
import { SupportChat } from '@/features/traveler/support-chat/SupportChat';

interface PersistentPublicLayoutProps {
  children: ReactNode;
}

/**
 * Shared Persistent Public Layout for TripMate Web.
 *
 * Mounts the official PublicNavigation persistent header once at the layout level
 * across all public and traveler routes (/ , /tours, /pois, /plan, /itineraries, /account/*).
 *
 * By residing in the shared layout above route-level Suspense boundaries and PageTransitions:
 * 1. The header never unmounts, flickers or re-executes session restores during public route changes.
 * 2. Sticky header positioning stays stably pinned at the top across scrolling.
 * 3. Page loading skeletons and transitions are cleanly scoped to the content area below the header.
 * 4. Suppressed on /admin, /partner, and standalone auth pages which use dedicated shells.
 */
export function PersistentPublicLayout({ children }: PersistentPublicLayoutProps) {
  const pathname = useSafePathname();
  const [messengerOpen, setMessengerOpen] = useState(false);
  const showHeader = isPublicNavigationRoute(pathname);

  return (
    <>
      {showHeader && <PublicNavigation />}
      {showHeader && pathname !== '/messages' && <GroupChatHub dock onOpenChange={setMessengerOpen} />}
      <PersistentHeaderContext.Provider value={showHeader}>
        {children}
      </PersistentHeaderContext.Provider>
      {((showHeader && pathname !== '/messages') || pathname === '/partner' || pathname?.startsWith('/partner/')) ? <SupportChat avoidMessenger={messengerOpen} /> : null}
    </>
  );
}

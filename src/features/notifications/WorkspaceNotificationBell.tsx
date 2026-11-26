'use client';

import { useRouter } from 'next/navigation';
import type { AuthRole } from '@/features/auth/session/authSession';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { OPERATOR_TOUR_ROUTES } from '@/features/operator/tours/routes';
import { NotificationBell } from './NotificationBell';
import { useNotificationInbox } from './useNotificationInbox';
import type { NotificationInboxItem } from './types';

function destination(role: AuthRole, item: NotificationInboxItem): string | undefined {
  const id = item.relatedEntityId;
  if (role === 'Traveler' && item.relatedEntityType === 'Booking' && id) return ROUTES.bookingTicket(id);
  if (role === 'TourOperator' && item.type === 'TourApproved' && item.relatedEntityType === 'Tour' && id) {
    return OPERATOR_TOUR_ROUTES.edit(id);
  }
  if (role === 'TourOperator' && item.relatedEntityType === 'PostTripComplaint' && id) return ROUTES.partner.postTripComplaint(id);
  if (role === 'ServiceProvider' && item.relatedEntityType === 'ServiceBooking' && id) return ROUTES.provider.bookingDetail(id);
  if (role === 'ServiceProvider' && item.relatedEntityType === 'StayInquiry' && id) return `/provider/stays?requestId=${id}`;
  if (role === 'Traveler' && item.relatedEntityType === 'StayInquiry' && id) return `/stays/requests?requestId=${id}`;
  if (role === 'Staff' && item.type === 'RefundReturnReported') return ROUTES.admin.refundReconciliation;
  if (role === 'Administrator' && item.type === 'EmergencyRefundReviewRequired') {
    return item.relatedEntityType === 'TourSchedule' && id
      ? `${ROUTES.admin.escalatedRefunds}?emergencyScheduleId=${id}`
      : ROUTES.admin.escalatedRefunds;
  }
}

export function WebSessionNotificationBell({ role }: { role: 'TourOperator' | 'ServiceProvider' }) {
  const { context } = useWebSession();
  if (context?.role !== role || context.mustChangePassword) return null;
  return <WorkspaceNotificationBell key={context.userId} role={role} />;
}

export function WorkspaceNotificationBell({ role, consoleSessionKey }: { role: AuthRole; consoleSessionKey?: number }) {
  const inbox = useNotificationInbox({ consoleSessionKey });
  const router = useRouter();

  async function open(item: NotificationInboxItem) {
    if (!item.isRead && !await inbox.markRead(item.id)) return;
    const href = destination(role, item);
    if (href) router.push(href);
  }

  return (
    <NotificationBell
      items={inbox.items}
      unreadCount={inbox.unreadCount}
      onMarkRead={inbox.markRead}
      onOpenItem={(item) => void open(item)}
      onOpen={inbox.refresh}
      unreadOnly={inbox.unreadOnly}
      onUnreadOnlyChange={inbox.setUnreadOnly}
      error={inbox.error}
      loading={inbox.loading}
      onRetry={inbox.refresh}
      onLoadMore={inbox.loadMore}
    />
  );
}

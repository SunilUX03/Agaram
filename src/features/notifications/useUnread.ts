import { useQ } from '@/data/hooks';

/** Unread alerts, from the repository. The bell shows a dot while this is above zero. */
export const useUnreadCount = () => useQ('unreadCount').data ?? 0;

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => fetchNotifications({ per_page: 10 }),
        refetchInterval: 30_000,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
    const markRead = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
    const markAllRead = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

    const unreadCount = data?.unread_count ?? 0;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative text-gray-600 hover:text-gray-900"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-10 mt-2 w-80 rounded border bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <span className="text-sm font-medium text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllRead.mutate()}
                                className="text-xs text-gray-600 hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {data?.data.length === 0 && (
                            <p className="px-3 py-4 text-center text-sm text-gray-500">No notifications yet.</p>
                        )}
                        {data?.data.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => !n.read_at && markRead.mutate(n.id)}
                                className={`block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50 ${
                                    n.read_at ? 'text-gray-500' : 'font-medium text-gray-900'
                                }`}
                            >
                                {n.data.message}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

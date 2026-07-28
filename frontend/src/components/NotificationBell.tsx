import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import { NOTIFICATION_POLL_INTERVAL_MS } from '../lib/constants';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => fetchNotifications({ per_page: 10 }),
        refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
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
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                    <path
                        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-ink-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="card absolute right-0 z-10 mt-2 w-80 overflow-hidden !rounded-2xl py-0 text-left shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <span className="text-sm font-semibold text-ink-900">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllRead.mutate()}
                                className="text-xs font-medium text-brand-600 hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {data?.data.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
                        )}
                        {data?.data.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => !n.read_at && markRead.mutate(n.id)}
                                className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50 ${
                                    n.read_at ? 'text-slate-500' : 'font-medium text-ink-900'
                                }`}
                            >
                                {typeof n.data.message === 'string' ? n.data.message : ''}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

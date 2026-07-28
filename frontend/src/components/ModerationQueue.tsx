import { useState } from 'react';
import type { ReactNode } from 'react';
import Pagination from './Pagination';
import Skeleton from './Skeleton';
import type { PaginationMeta } from '../types/api';

interface ModerationQueueProps<T extends { id: number }> {
    eyebrow: string;
    title: string;
    description: string;
    items: T[] | undefined;
    isLoading: boolean;
    emptyMessage: string;
    onApprove: (id: number) => void;
    onReject: (id: number, reason: string) => void;
    renderHeader: (item: T) => ReactNode;
    renderDetails?: (item: T) => ReactNode;
    meta?: PaginationMeta;
    onPageChange?: (page: number) => void;
}

export default function ModerationQueue<T extends { id: number }>({
    eyebrow,
    title,
    description,
    items,
    isLoading,
    emptyMessage,
    onApprove,
    onReject,
    renderHeader,
    renderDetails,
    meta,
    onPageChange,
}: ModerationQueueProps<T>) {
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [reason, setReason] = useState('');

    return (
        <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>

            {items && items.length === 0 && <p className="mt-6 text-slate-500">{emptyMessage}</p>}

            <div className="mt-6 space-y-4">
                {isLoading &&
                    Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="card space-y-3 p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Skeleton className="h-9 w-24" />
                                    <Skeleton className="h-9 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-3 w-full" />
                        </div>
                    ))}
                {items?.map((item) => (
                    <div key={item.id} className="card p-4">
                        <div className="flex items-center justify-between">
                            {renderHeader(item)}
                            <div className="flex shrink-0 gap-2">
                                <button
                                    type="button"
                                    onClick={() => onApprove(item.id)}
                                    className="btn-primary !px-4 !py-2"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRejectingId(rejectingId === item.id ? null : item.id)}
                                    className="btn-outline !px-4 !py-2 text-red-600 hover:border-red-400 hover:text-red-700"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>

                        {renderDetails?.(item)}

                        {rejectingId === item.id && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    onReject(item.id, reason);
                                    setRejectingId(null);
                                    setReason('');
                                }}
                                className="mt-3 flex gap-2"
                            >
                                <input
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Rejection reason…"
                                    className="input flex-1"
                                />
                                <button type="submit" className="btn-outline !px-4 !py-2">
                                    Confirm reject
                                </button>
                            </form>
                        )}
                    </div>
                ))}
            </div>

            {meta && onPageChange && <Pagination meta={meta} onPageChange={onPageChange} />}
        </div>
    );
}

import { useState } from 'react';
import type { ReactNode } from 'react';
import Loading from './Loading';

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
}: ModerationQueueProps<T>) {
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [reason, setReason] = useState('');

    return (
        <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>

            {isLoading && <Loading className="mt-6" />}
            {items && items.length === 0 && <p className="mt-6 text-slate-500">{emptyMessage}</p>}

            <div className="mt-6 space-y-4">
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
        </div>
    );
}

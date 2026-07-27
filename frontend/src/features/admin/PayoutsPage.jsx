import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminPayouts, markPayoutPaid } from '../../api/admin';
import { generalError } from '../../lib/apiErrors';

const STATUS_STYLES = {
    pending: 'badge-amber',
    processing: 'badge bg-sky-100 text-sky-700',
    paid: 'badge-brand',
};

export default function PayoutsPage() {
    const [status, setStatus] = useState('pending');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'payouts', status],
        queryFn: () => fetchAdminPayouts({ status: status || undefined }),
    });

    const markPaid = useMutation({
        mutationFn: markPayoutPaid,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
    });

    return (
        <div>
            <p className="eyebrow">Admin</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Instructor Payouts</h1>
            <p className="mt-1 text-sm text-slate-500">Review generated payout periods and mark them as paid.</p>

            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input mt-6 mb-4 w-auto"
            >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="">All</option>
            </select>

            {isLoading && <p className="text-slate-500">Loading…</p>}
            {markPaid.isError && <p className="mb-2 text-sm text-red-600">{generalError(markPaid.error)}</p>}

            <div className="card divide-y divide-slate-100">
                {data?.data.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-ink-900">{payout.instructor?.name}</p>
                            <p className="text-xs text-slate-500">
                                {payout.period_start} – {payout.period_end} · Net ${Number(payout.net_amount).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={STATUS_STYLES[payout.status]}>{payout.status}</span>
                            {payout.status !== 'paid' && (
                                <button
                                    type="button"
                                    onClick={() => markPaid.mutate(payout.id)}
                                    disabled={markPaid.isPending}
                                    className="btn-primary !px-4 !py-2"
                                >
                                    Mark paid
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {data && data.data.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No payouts found.</p>}
            </div>
        </div>
    );
}

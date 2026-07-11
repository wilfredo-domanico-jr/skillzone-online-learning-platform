import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminPayouts, markPayoutPaid } from '../../api/admin';
import { generalError } from '../../lib/apiErrors';

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
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
            <h1 className="mb-6 text-xl font-semibold text-gray-900">Instructor Payouts</h1>

            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mb-4 rounded border-gray-300 text-sm shadow-sm"
            >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="">All</option>
            </select>

            {isLoading && <p className="text-gray-500">Loading…</p>}
            {markPaid.isError && <p className="mb-2 text-sm text-red-600">{generalError(markPaid.error)}</p>}

            <div className="divide-y rounded border bg-white">
                {data?.data.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{payout.instructor?.name}</p>
                            <p className="text-xs text-gray-500">
                                {payout.period_start} – {payout.period_end} · Net ${Number(payout.net_amount).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[payout.status]}`}>
                                {payout.status}
                            </span>
                            {payout.status !== 'paid' && (
                                <button
                                    type="button"
                                    onClick={() => markPaid.mutate(payout.id)}
                                    disabled={markPaid.isPending}
                                    className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                                >
                                    Mark paid
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {data && data.data.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No payouts found.</p>}
            </div>
        </div>
    );
}

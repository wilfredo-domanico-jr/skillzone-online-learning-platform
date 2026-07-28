import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Pagination from '../../components/Pagination';
import Select from '../../components/Select';
import SkeletonRow from '../../components/SkeletonRow';
import { fetchAdminPayouts, markPayoutPaid } from '../../api/admin';
import { generalError } from '../../lib/apiErrors';
import { formatPrice } from '../../lib/formatPrice';
import { formatSnakeCase } from '../../lib/formatSnakeCase';
import { PAYOUT_STATUS_STYLES } from '../../lib/payoutStatusStyles';
import type { PayoutStatus } from '../../types/api';

export default function PayoutsPage() {
    const [status, setStatus] = useState<PayoutStatus | ''>('pending');
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'payouts', status, page],
        queryFn: () => fetchAdminPayouts({ status: status || undefined, page }),
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

            <div className="mt-6 mb-4">
                <Select
                    value={status}
                    onChange={(value) => {
                        setStatus(value);
                        setPage(1);
                    }}
                    options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'paid', label: 'Paid' },
                        { value: '', label: 'All' },
                    ]}
                    className="w-auto"
                />
            </div>

            {markPaid.isError && <p className="mb-2 text-sm text-red-600">{generalError(markPaid.error)}</p>}

            <div className="card divide-y divide-slate-100">
                {isLoading && Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)}
                {data?.data.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-ink-900">{payout.instructor?.name}</p>
                            <p className="text-xs text-slate-500">
                                {payout.period_start} – {payout.period_end} · Net {formatPrice(payout.net_amount)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={PAYOUT_STATUS_STYLES[payout.status]}>{formatSnakeCase(payout.status)}</span>
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

            {data && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
    );
}

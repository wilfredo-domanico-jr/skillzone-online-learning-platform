import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsOverview, fetchMyPayouts } from '../../api/instructor';

const PAYOUT_STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
};

export default function InstructorDashboardPage() {
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['instructor', 'analytics', 'overview'],
        queryFn: fetchAnalyticsOverview,
    });

    const { data: payouts, isLoading: payoutsLoading } = useQuery({
        queryKey: ['instructor', 'payouts'],
        queryFn: () => fetchMyPayouts(),
    });

    return (
        <div>
            <h1 className="mb-6 text-xl font-semibold text-gray-900">Instructor Dashboard</h1>

            {overviewLoading && <p className="text-gray-500">Loading…</p>}

            {overview && (
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded border bg-white p-4">
                        <p className="text-xs text-gray-500">Published courses</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{overview.published_courses}</p>
                    </div>
                    <div className="rounded border bg-white p-4">
                        <p className="text-xs text-gray-500">Total enrollments</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{overview.total_enrollments}</p>
                    </div>
                    <div className="rounded border bg-white p-4">
                        <p className="text-xs text-gray-500">Total revenue</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">${Number(overview.total_revenue).toFixed(2)}</p>
                    </div>
                    <div className="rounded border bg-white p-4">
                        <p className="text-xs text-gray-500">Average rating</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {overview.average_rating > 0 ? `★ ${overview.average_rating}` : '—'}
                        </p>
                    </div>
                </div>
            )}

            <h2 className="mb-3 text-lg font-semibold text-gray-900">Payouts</h2>

            {payoutsLoading && <p className="text-gray-500">Loading…</p>}
            {payouts && payouts.data.length === 0 && (
                <p className="text-sm text-gray-500">No payouts yet — they're generated monthly from paid enrollments.</p>
            )}

            <div className="divide-y rounded border bg-white">
                {payouts?.data.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {payout.period_start} – {payout.period_end}
                            </p>
                            <p className="text-xs text-gray-500">
                                Gross ${Number(payout.gross_amount).toFixed(2)} · Fee ${Number(payout.platform_fee_amount).toFixed(2)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">${Number(payout.net_amount).toFixed(2)}</p>
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${PAYOUT_STATUS_STYLES[payout.status]}`}>
                                {payout.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

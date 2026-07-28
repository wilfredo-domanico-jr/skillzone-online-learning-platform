import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsOverview, fetchMyPayouts } from '../../api/instructor';
import type { PayoutStatus } from '../../types/api';

const PAYOUT_STATUS_STYLES: Record<PayoutStatus, string> = {
    pending: 'badge-amber',
    processing: 'badge bg-sky-100 text-sky-700',
    paid: 'badge-brand',
};

export default function InstructorDashboardPage() {
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['instructor', 'analytics', 'overview'],
        queryFn: () => fetchAnalyticsOverview(),
    });

    const { data: payouts, isLoading: payoutsLoading } = useQuery({
        queryKey: ['instructor', 'payouts'],
        queryFn: () => fetchMyPayouts(),
    });

    return (
        <div>
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-10 md:px-12">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative">
                    <p className="eyebrow">Instructor</p>
                    <h1 className="mt-3 font-display text-3xl font-semibold text-white">Dashboard</h1>
                    <p className="mt-3 max-w-lg text-white/60">
                        Track how your courses are performing and review your payout history.
                    </p>
                </div>
            </div>

            {overviewLoading && <p className="mt-6 text-slate-500">Loading…</p>}

            {overview && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="card p-6">
                        <p className="eyebrow">Published courses</p>
                        <p className="mt-2 font-display text-3xl font-bold text-ink-900">
                            {overview.published_courses}
                        </p>
                    </div>
                    <div className="card p-6">
                        <p className="eyebrow">Total enrollments</p>
                        <p className="mt-2 font-display text-3xl font-bold text-ink-900">
                            {overview.total_enrollments}
                        </p>
                    </div>
                    <div className="card p-6">
                        <p className="eyebrow">Total revenue</p>
                        <p className="mt-2 font-display text-3xl font-bold text-ink-900">
                            ${Number(overview.total_revenue).toFixed(2)}
                        </p>
                    </div>
                    <div className="card p-6">
                        <p className="eyebrow">Average rating</p>
                        <p className="mt-2 font-display text-3xl font-bold text-ink-900">
                            {Number(overview.average_rating) > 0 ? `★ ${overview.average_rating}` : '—'}
                        </p>
                    </div>
                </div>
            )}

            <h2 className="mt-10 mb-3 font-display text-lg font-semibold text-ink-900">Payouts</h2>

            {payoutsLoading && <p className="text-slate-500">Loading…</p>}
            {payouts && payouts.data.length === 0 && (
                <p className="text-sm text-slate-500">No payouts yet — they're generated monthly from paid enrollments.</p>
            )}

            <div className="card divide-y divide-slate-100">
                {payouts?.data.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between px-5 py-4">
                        <div>
                            <p className="text-sm font-semibold text-ink-900">
                                {payout.period_start} – {payout.period_end}
                            </p>
                            <p className="text-xs text-slate-500">
                                Gross ${Number(payout.gross_amount).toFixed(2)} · Fee ${Number(payout.platform_fee_amount).toFixed(2)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-display text-sm font-semibold text-ink-900">
                                ${Number(payout.net_amount).toFixed(2)}
                            </p>
                            <span className={PAYOUT_STATUS_STYLES[payout.status]}>{payout.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

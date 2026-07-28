import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Pagination from '../../components/Pagination';
import Skeleton from '../../components/Skeleton';
import SkeletonRow from '../../components/SkeletonRow';
import { fetchAnalyticsOverview, fetchMyPayouts } from '../../api/instructor';
import { formatPrice } from '../../lib/formatPrice';
import { formatSnakeCase } from '../../lib/formatSnakeCase';
import { PAYOUT_STATUS_STYLES } from '../../lib/payoutStatusStyles';

export default function InstructorDashboardPage() {
    const [page, setPage] = useState(1);

    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['instructor', 'analytics', 'overview'],
        queryFn: () => fetchAnalyticsOverview(),
    });

    const { data: payouts, isLoading: payoutsLoading } = useQuery({
        queryKey: ['instructor', 'payouts', page],
        queryFn: () => fetchMyPayouts({ page }),
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

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {overviewLoading &&
                    Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="card space-y-3 p-6">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                {overview && (
                    <>
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
                                {formatPrice(overview.total_revenue)}
                            </p>
                        </div>
                        <div className="card p-6">
                            <p className="eyebrow">Average rating</p>
                            <p className="mt-2 font-display text-3xl font-bold text-ink-900">
                                {Number(overview.average_rating) > 0 ? `★ ${overview.average_rating}` : '—'}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <h2 className="mt-10 mb-3 font-display text-lg font-semibold text-ink-900">Payouts</h2>

            {payouts && payouts.data.length === 0 && (
                <p className="text-sm text-slate-500">No payouts yet — they're generated monthly from paid enrollments.</p>
            )}

            <div className="card divide-y divide-slate-100">
                {payoutsLoading && Array.from({ length: 3 }, (_, i) => <SkeletonRow key={i} />)}
                {payouts?.data.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between px-5 py-4">
                        <div>
                            <p className="text-sm font-semibold text-ink-900">
                                {payout.period_start} – {payout.period_end}
                            </p>
                            <p className="text-xs text-slate-500">
                                Gross {formatPrice(payout.gross_amount)} · Fee {formatPrice(payout.platform_fee_amount)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-display text-sm font-semibold text-ink-900">
                                {formatPrice(payout.net_amount)}
                            </p>
                            <span className={PAYOUT_STATUS_STYLES[payout.status]}>{formatSnakeCase(payout.status)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {payouts && <Pagination meta={payouts.meta} onPageChange={setPage} />}
        </div>
    );
}

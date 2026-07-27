import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchMyEnrollments } from '../../api/learning';

export default function MyLearningPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['my-enrollments'],
        queryFn: () => fetchMyEnrollments(),
    });

    return (
        <div>
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-10 md:px-12">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative">
                    <p className="eyebrow">My Learning</p>
                    <h1 className="mt-3 font-display text-3xl font-semibold text-white">My Learning</h1>
                    <p className="mt-3 max-w-lg text-white/60">Pick up where you left off, one lesson at a time.</p>
                </div>
            </div>

            {isLoading && <p className="mt-8 text-slate-500">Loading…</p>}
            {data && data.data.length === 0 && (
                <p className="mt-8 text-slate-500">
                    You haven't enrolled in any courses yet.{' '}
                    <Link to="/courses" className="font-medium text-brand-600 hover:underline">
                        Browse courses
                    </Link>
                    .
                </p>
            )}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data?.data.map((enrollment) => (
                    <Link
                        key={enrollment.id}
                        to={`/learn/${enrollment.course.slug}`}
                        className="card card-hover block p-5"
                    >
                        <h3 className="font-display font-semibold text-ink-900">{enrollment.course.title}</h3>
                        <p className="text-sm text-slate-500">{enrollment.course.instructor?.name}</p>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-brand-500"
                                style={{ width: `${enrollment.progress_percent}%` }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{enrollment.progress_percent}% complete</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

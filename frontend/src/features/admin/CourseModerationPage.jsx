import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { approveCourse, fetchCoursesForModeration, rejectCourse } from '../../api/admin';

export default function CourseModerationPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'courses', 'pending_review'],
        queryFn: () => fetchCoursesForModeration({ status: 'pending_review' }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    const approve = useMutation({ mutationFn: approveCourse, onSuccess: invalidate });
    const reject = useMutation({
        mutationFn: ({ id, reason }) => rejectCourse(id, reason),
        onSuccess: invalidate,
    });

    const [rejectingId, setRejectingId] = useState(null);
    const [reason, setReason] = useState('');

    return (
        <div>
            <p className="eyebrow">Admin</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Course Moderation Queue</h1>
            <p className="mt-1 text-sm text-slate-500">Review courses submitted by instructors for publication.</p>

            {isLoading && <p className="mt-6 text-slate-500">Loading…</p>}
            {data && data.data.length === 0 && <p className="mt-6 text-slate-500">Nothing awaiting review.</p>}

            <div className="mt-6 space-y-4">
                {data?.data.map((course) => (
                    <div key={course.id} className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Link
                                    to={`/courses/${course.slug}`}
                                    className="font-display font-semibold text-ink-900 hover:text-brand-700"
                                >
                                    {course.title}
                                </Link>
                                <p className="text-sm text-slate-500">by {course.instructor?.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => approve.mutate(course.id)}
                                    className="btn-primary !px-4 !py-2"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRejectingId(rejectingId === course.id ? null : course.id)}
                                    className="btn-outline !px-4 !py-2 text-red-600 hover:border-red-400 hover:text-red-700"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                        {course.subtitle && <p className="mt-2 text-sm text-slate-600">{course.subtitle}</p>}

                        {rejectingId === course.id && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    reject.mutate({ id: course.id, reason });
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

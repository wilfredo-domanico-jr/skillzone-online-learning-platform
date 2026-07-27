import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    approveInstructorApplication,
    fetchInstructorApplications,
    rejectInstructorApplication,
} from '../../api/admin';

export default function ApplicationsQueuePage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'instructor-applications'],
        queryFn: () => fetchInstructorApplications({ status: 'pending' }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'instructor-applications'] });
    const approve = useMutation({ mutationFn: approveInstructorApplication, onSuccess: invalidate });
    const reject = useMutation({
        mutationFn: ({ id, reason }) => rejectInstructorApplication(id, reason),
        onSuccess: invalidate,
    });

    const [rejectingId, setRejectingId] = useState(null);
    const [reason, setReason] = useState('');

    return (
        <div>
            <p className="eyebrow">Admin</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Instructor Applications</h1>
            <p className="mt-1 text-sm text-slate-500">Review and decide on pending instructor applications.</p>

            {isLoading && <p className="mt-6 text-slate-500">Loading…</p>}
            {data && data.data.length === 0 && <p className="mt-6 text-slate-500">No pending applications.</p>}

            <div className="mt-6 space-y-4">
                {data?.data.map((app) => (
                    <div key={app.id} className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-display font-semibold text-ink-900">{app.user?.name}</p>
                                <p className="text-sm text-slate-500">{app.user?.email}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => approve.mutate(app.id)}
                                    className="btn-primary !px-4 !py-2"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRejectingId(rejectingId === app.id ? null : app.id)}
                                    className="btn-outline !px-4 !py-2 text-red-600 hover:border-red-400 hover:text-red-700"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{app.bio}</p>
                        {app.expertise?.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">Expertise: {app.expertise.join(', ')}</p>
                        )}
                        {app.portfolio_url && (
                            <a
                                href={app.portfolio_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 block text-xs text-brand-600 hover:underline"
                            >
                                {app.portfolio_url}
                            </a>
                        )}

                        {rejectingId === app.id && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    reject.mutate({ id: app.id, reason });
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

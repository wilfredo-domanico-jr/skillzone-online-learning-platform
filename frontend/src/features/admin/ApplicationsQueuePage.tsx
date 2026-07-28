import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ModerationQueue from '../../components/ModerationQueue';
import {
    approveInstructorApplication,
    fetchInstructorApplications,
    rejectInstructorApplication,
} from '../../api/admin';

export default function ApplicationsQueuePage() {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'instructor-applications', page],
        queryFn: () => fetchInstructorApplications({ status: 'pending', page }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'instructor-applications'] });
    const approve = useMutation({ mutationFn: approveInstructorApplication, onSuccess: invalidate });
    const reject = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectInstructorApplication(id, reason),
        onSuccess: invalidate,
    });

    return (
        <ModerationQueue
            eyebrow="Admin"
            title="Instructor Applications"
            description="Review and decide on pending instructor applications."
            items={data?.data}
            isLoading={isLoading}
            emptyMessage="No pending applications."
            meta={data?.meta}
            onPageChange={setPage}
            onApprove={(id) => approve.mutate(id)}
            onReject={(id, reason) => reject.mutate({ id, reason })}
            renderHeader={(app) => (
                <div>
                    <p className="font-display font-semibold text-ink-900">{app.user?.name}</p>
                    <p className="text-sm text-slate-500">{app.user?.email}</p>
                </div>
            )}
            renderDetails={(app) => (
                <>
                    <p className="mt-2 text-sm text-slate-600">{app.bio}</p>
                    {app.expertise && app.expertise.length > 0 && (
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
                </>
            )}
        />
    );
}

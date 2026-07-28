import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../../components/Loading';
import { fetchAdminUsers, suspendUser, unsuspendUser } from '../../api/admin';
import { useAuthUser } from '../auth/useAuth';
import { generalError } from '../../lib/apiErrors';

export default function UsersPage() {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();
    const { data: me } = useAuthUser();

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'users', search],
        queryFn: () => fetchAdminUsers({ search: search || undefined }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    const suspend = useMutation({ mutationFn: suspendUser, onSuccess: invalidate });
    const unsuspend = useMutation({ mutationFn: unsuspendUser, onSuccess: invalidate });

    return (
        <div>
            <p className="eyebrow">Admin</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Users</h1>
            <p className="mt-1 text-sm text-slate-500">Search users and manage account suspension.</p>

            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="input mt-6 mb-4 max-w-sm"
            />

            {isLoading && <Loading />}
            {suspend.isError && <p className="mb-2 text-sm text-red-600">{generalError(suspend.error)}</p>}

            <div className="card divide-y divide-slate-100">
                {data?.data.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-ink-900">
                                {u.name}
                                {u.suspended_at && (
                                    <span className="badge ml-2 bg-red-100 text-red-700">Suspended</span>
                                )}
                            </p>
                            <p className="text-xs text-slate-500">
                                {u.email} · {u.roles?.map((r) => r.name).join(', ') || 'no role'}
                            </p>
                        </div>
                        {u.suspended_at ? (
                            <button
                                type="button"
                                onClick={() => unsuspend.mutate(u.id)}
                                className="btn-primary !px-4 !py-2"
                            >
                                Unsuspend
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={u.id === me?.id}
                                onClick={() => suspend.mutate(u.id)}
                                className="btn-outline !px-4 !py-2 text-red-600 hover:border-red-400 hover:text-red-700"
                            >
                                Suspend
                            </button>
                        )}
                    </div>
                ))}
                {data && data.data.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No users found.</p>}
            </div>
        </div>
    );
}

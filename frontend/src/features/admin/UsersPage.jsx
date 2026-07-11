import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
            <h1 className="mb-6 text-xl font-semibold text-gray-900">Users</h1>

            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="mb-4 w-full max-w-sm rounded border-gray-300 text-sm shadow-sm"
            />

            {isLoading && <p className="text-gray-500">Loading…</p>}
            {suspend.isError && <p className="mb-2 text-sm text-red-600">{generalError(suspend.error)}</p>}

            <div className="divide-y rounded border bg-white">
                {data?.data.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {u.name}
                                {u.suspended_at && (
                                    <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                        Suspended
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-gray-500">
                                {u.email} · {u.roles?.map((r) => r.name).join(', ') || 'no role'}
                            </p>
                        </div>
                        {u.suspended_at ? (
                            <button
                                type="button"
                                onClick={() => unsuspend.mutate(u.id)}
                                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
                            >
                                Unsuspend
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={u.id === me?.id}
                                onClick={() => suspend.mutate(u.id)}
                                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Suspend
                            </button>
                        )}
                    </div>
                ))}
                {data && data.data.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No users found.</p>}
            </div>
        </div>
    );
}

import { Link, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthUser, useLogout } from '../../features/auth/useAuth';
import { fetchCart } from '../../api/commerce';
import NotificationBell from '../../components/NotificationBell';

export default function AppLayout() {
    const { data: user, isLoading } = useAuthUser();
    const logout = useLogout();
    const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: fetchCart, enabled: !!user });

    const isInstructor = user?.roles?.some((r) => r.name === 'instructor');
    const isAdmin = user?.roles?.some((r) => r.name === 'admin');

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="border-b bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-6">
                        <Link to="/courses" className="font-semibold text-gray-900">
                            Online Learning Platform
                        </Link>
                        <Link to="/courses" className="text-sm text-gray-600 hover:text-gray-900">
                            Browse
                        </Link>
                        {user && (
                            <Link to="/my-learning" className="text-sm text-gray-600 hover:text-gray-900">
                                My Learning
                            </Link>
                        )}
                        {user && !isInstructor && (
                            <Link to="/instructor/apply" className="text-sm text-gray-600 hover:text-gray-900">
                                Teach
                            </Link>
                        )}
                        {isInstructor && (
                            <>
                                <Link to="/instructor/courses" className="text-sm text-gray-600 hover:text-gray-900">
                                    My Courses
                                </Link>
                                <Link to="/instructor/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                                    Dashboard
                                </Link>
                            </>
                        )}
                        {isAdmin && (
                            <>
                                <Link
                                    to="/admin/instructor-applications"
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    Applications
                                </Link>
                                <Link to="/admin/courses" className="text-sm text-gray-600 hover:text-gray-900">
                                    Moderation
                                </Link>
                                <Link to="/admin/payouts" className="text-sm text-gray-600 hover:text-gray-900">
                                    Payouts
                                </Link>
                                <Link to="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
                                    Users
                                </Link>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        {!isLoading && user && (
                            <>
                                <Link to="/orders" className="hover:text-gray-900">
                                    Orders
                                </Link>
                                <Link to="/cart" className="hover:text-gray-900">
                                    Cart{cart?.items.length > 0 ? ` (${cart.items.length})` : ''}
                                </Link>
                                <NotificationBell />
                                <span>{user.name}</span>
                                <button
                                    type="button"
                                    onClick={() => logout.mutate()}
                                    className="text-red-600 hover:underline"
                                >
                                    Log out
                                </button>
                            </>
                        )}
                        {!isLoading && !user && (
                            <Link to="/login" className="text-gray-900 hover:underline">
                                Log in
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
            <main className="mx-auto max-w-5xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}

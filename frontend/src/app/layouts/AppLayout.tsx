import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthUser, useLogout } from '../../features/auth/useAuth';
import { fetchCart } from '../../api/commerce';
import NotificationBell from '../../components/NotificationBell';

interface NavItemProps {
    to: string;
    children: ReactNode;
}

function NavItem({ to, children }: NavItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
            }
        >
            {children}
        </NavLink>
    );
}

export default function AppLayout() {
    const { data: user, isLoading } = useAuthUser();
    const logout = useLogout();
    const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: fetchCart, enabled: !!user });

    const isInstructor = user?.roles?.some((r) => r.name === 'instructor');
    const isAdmin = user?.roles?.some((r) => r.name === 'admin');
    const initials = user?.name
        ?.split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="sticky top-0 z-40 border-b border-white/5 bg-ink-950">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
                    <div className="flex min-w-0 items-center gap-5">
                        <Link to="/courses" className="flex shrink-0 items-center gap-2">
                            <img src="/logo-icon.png" alt="" className="h-8 w-8" />
                            <span className="hidden font-display text-lg font-semibold text-white sm:inline">
                                SkillZone
                            </span>
                        </Link>
                        <div className="flex items-center gap-1 overflow-x-auto">
                            <NavItem to="/courses">Browse</NavItem>
                            {user && <NavItem to="/my-learning">My Learning</NavItem>}
                            {user && !isInstructor && <NavItem to="/instructor/apply">Teach</NavItem>}
                            {isInstructor && (
                                <>
                                    <NavItem to="/instructor/courses">My Courses</NavItem>
                                    <NavItem to="/instructor/dashboard">Dashboard</NavItem>
                                </>
                            )}
                            {isAdmin && (
                                <>
                                    <NavItem to="/admin/instructor-applications">Applications</NavItem>
                                    <NavItem to="/admin/courses">Moderation</NavItem>
                                    <NavItem to="/admin/payouts">Payouts</NavItem>
                                    <NavItem to="/admin/users">Users</NavItem>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        {!isLoading && user && (
                            <>
                                <NavItem to="/orders">Orders</NavItem>
                                <NavLink
                                    to="/cart"
                                    className={({ isActive }) =>
                                        `relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                            isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`
                                    }
                                >
                                    Cart
                                    {(cart?.items.length ?? 0) > 0 && (
                                        <span className="ml-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-ink-950">
                                            {cart!.items.length}
                                        </span>
                                    )}
                                </NavLink>
                                <NotificationBell />
                                <div className="ml-2 flex items-center gap-2 border-l border-white/10 pl-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white">
                                        {initials}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => logout.mutate()}
                                        className="text-sm font-medium text-white/50 hover:text-white"
                                    >
                                        Log out
                                    </button>
                                </div>
                            </>
                        )}
                        {!isLoading && !user && (
                            <>
                                <Link
                                    to="/login"
                                    className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white/70 hover:text-white"
                                >
                                    Log in
                                </Link>
                                <Link to="/register" className="btn-primary !py-1.5">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
            <main className="mx-auto max-w-7xl px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}

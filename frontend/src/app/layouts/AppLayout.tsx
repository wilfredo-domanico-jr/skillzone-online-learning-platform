import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useAuthUser, useLogout } from '../../features/auth/useAuth';
import { fetchCart } from '../../api/commerce';
import NotificationBell from '../../components/NotificationBell';
import Footer from '../../components/Footer';
import { useConfirm } from '../../lib/useConfirm';

interface NavItemProps {
    to: string;
    children: ReactNode;
    onClick?: () => void;
}

function NavItem({ to, children, onClick }: NavItemProps) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
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

function MobileNavItem({ to, children, onClick }: NavItemProps) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
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
    const { requestConfirm, confirmDialog } = useConfirm();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    const isInstructor = user?.roles?.some((r) => r.name === 'instructor');
    const isAdmin = user?.roles?.some((r) => r.name === 'admin');
    const cartCount = cart?.items.length ?? 0;
    const initials = user?.name
        ?.split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleLogout = () =>
        requestConfirm(
            { title: 'Log out?', description: 'You will need to sign in again to continue.', confirmLabel: 'Log out' },
            () => logout.mutate(),
        );

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <nav className="sticky top-0 z-40 border-b border-white/5 bg-ink-950">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
                    <div className="flex min-w-0 items-center gap-5">
                        <Link to="/courses" className="flex shrink-0 items-center gap-2">
                            <img src="/logo-icon.png" alt="" className="h-8 w-8" />
                            <span className="hidden font-display text-lg font-semibold text-white sm:inline">
                                SkillZone
                            </span>
                        </Link>
                        <div className="hidden items-center gap-1 lg:flex">
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
                            <div className="hidden items-center gap-1 lg:flex">
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
                                    {cartCount > 0 && (
                                        <span className="ml-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-ink-950">
                                            {cartCount}
                                        </span>
                                    )}
                                </NavLink>
                            </div>
                        )}

                        {!isLoading && user && (
                            <NavLink
                                to="/cart"
                                aria-label="Cart"
                                className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path
                                        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500" />
                                )}
                            </NavLink>
                        )}

                        {!isLoading && user && <NotificationBell />}

                        {!isLoading && user && (
                            <div className="ml-2 hidden items-center gap-2 border-l border-white/10 pl-3 lg:flex">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white">
                                    {initials}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-white/50 hover:text-white"
                                >
                                    Log out
                                </button>
                            </div>
                        )}

                        {!isLoading && !user && (
                            <div className="hidden items-center gap-1 lg:flex">
                                <Link
                                    to="/login"
                                    className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white/70 hover:text-white"
                                >
                                    Log in
                                </Link>
                                <Link to="/register" className="btn-primary !py-1.5">
                                    Sign up
                                </Link>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open menu"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-50 lg:hidden">
                <div className="fixed inset-0 bg-ink-950/60 transition duration-150 data-[closed]:opacity-0" aria-hidden="true" />
                <div className="fixed inset-y-0 right-0 flex w-full max-w-xs">
                    <DialogPanel
                        transition
                        className="flex w-full flex-col overflow-y-auto bg-ink-950 p-6 shadow-xl transition duration-150
                        ease-out data-[closed]:translate-x-full"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-display text-lg font-semibold text-white">Menu</span>
                            <button
                                type="button"
                                onClick={closeMobileMenu}
                                aria-label="Close menu"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-6 flex flex-1 flex-col gap-1">
                            <MobileNavItem to="/courses" onClick={closeMobileMenu}>
                                Browse
                            </MobileNavItem>
                            {user && (
                                <MobileNavItem to="/my-learning" onClick={closeMobileMenu}>
                                    My Learning
                                </MobileNavItem>
                            )}
                            {user && !isInstructor && (
                                <MobileNavItem to="/instructor/apply" onClick={closeMobileMenu}>
                                    Teach
                                </MobileNavItem>
                            )}
                            {isInstructor && (
                                <>
                                    <MobileNavItem to="/instructor/courses" onClick={closeMobileMenu}>
                                        My Courses
                                    </MobileNavItem>
                                    <MobileNavItem to="/instructor/dashboard" onClick={closeMobileMenu}>
                                        Dashboard
                                    </MobileNavItem>
                                </>
                            )}
                            {isAdmin && (
                                <>
                                    <MobileNavItem to="/admin/instructor-applications" onClick={closeMobileMenu}>
                                        Applications
                                    </MobileNavItem>
                                    <MobileNavItem to="/admin/courses" onClick={closeMobileMenu}>
                                        Moderation
                                    </MobileNavItem>
                                    <MobileNavItem to="/admin/payouts" onClick={closeMobileMenu}>
                                        Payouts
                                    </MobileNavItem>
                                    <MobileNavItem to="/admin/users" onClick={closeMobileMenu}>
                                        Users
                                    </MobileNavItem>
                                </>
                            )}
                            {user && (
                                <MobileNavItem to="/orders" onClick={closeMobileMenu}>
                                    Orders
                                </MobileNavItem>
                            )}
                        </div>

                        <div className="mt-6 border-t border-white/10 pt-4">
                            {!isLoading && user && (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white">
                                            {initials}
                                        </span>
                                        <span className="truncate text-sm font-medium text-white">{user.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeMobileMenu();
                                            handleLogout();
                                        }}
                                        className="shrink-0 text-sm font-medium text-white/60 hover:text-white"
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                            {!isLoading && !user && (
                                <div className="flex flex-col gap-2">
                                    <Link to="/login" onClick={closeMobileMenu} className="btn-outline w-full justify-center">
                                        Log in
                                    </Link>
                                    <Link to="/register" onClick={closeMobileMenu} className="btn-primary w-full justify-center">
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
                <Outlet />
            </main>
            <Footer />
            {confirmDialog}
        </div>
    );
}

import { Link, Outlet } from 'react-router-dom';

export default function GuestLayout() {
    return (
        <div className="flex min-h-screen bg-ink-950">
            <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

                <Link to="/courses" className="relative z-10 flex items-center gap-2">
                    <img src="/logo-icon.png" alt="" className="h-9 w-9" />
                    <span className="font-display text-lg font-semibold text-white">SkillZone</span>
                </Link>

                <div className="relative z-10 max-w-md">
                    <p className="eyebrow">Learn without limits</p>
                    <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-white">
                        Discover the skills of the future
                    </h1>
                    <p className="mt-4 text-white/60">
                        Join a community of learners and instructors building real careers — one course at a
                        time.
                    </p>
                </div>

                <p className="relative z-10 text-xs text-white/30">© {new Date().getFullYear()} SkillZone</p>
            </div>

            <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-sm">
                    <img src="/logo.png" alt="SkillZone" className="mx-auto mb-8 h-9 w-auto lg:hidden" />
                    <div className="card p-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Link, Outlet } from 'react-router-dom';

export default function GuestLayout() {
    return (
        <div className="flex min-h-screen bg-ink-950">
            <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

                <Link to="/courses" className="relative z-10 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 font-display text-sm font-bold text-ink-950">
                        O
                    </span>
                    <span className="font-display text-lg font-semibold text-white">Learnify</span>
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

                <p className="relative z-10 text-xs text-white/30">© {new Date().getFullYear()} Learnify</p>
            </div>

            <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-sm">
                    <h1 className="mb-8 text-center font-display text-2xl font-semibold text-white lg:hidden">
                        Learnify
                    </h1>
                    <div className="card p-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}

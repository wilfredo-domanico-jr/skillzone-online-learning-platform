import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-6">
            <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

            <div className="relative z-10 max-w-md text-center">
                <p className="eyebrow">Error 403</p>
                <h1 className="mt-4 font-display text-7xl font-semibold text-white">403</h1>
                <p className="mt-4 text-white/60">You don't have access to this page.</p>
                <Link to="/dashboard" className="btn-primary mt-8 inline-flex">
                    Back to dashboard
                </Link>
            </div>
        </div>
    );
}

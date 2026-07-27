import { Link } from 'react-router-dom';
import { useAuthUser } from '../auth/useAuth';

const LINKS = [
    { to: '/my-learning', title: 'My Learning', desc: 'Resume your enrolled courses and track progress.' },
    { to: '/courses', title: 'Browse Courses', desc: 'Explore the full catalog across every category.' },
    { to: '/orders', title: 'Orders', desc: 'Review your purchase history and receipts.' },
    { to: '/instructor/apply', title: 'Become an Instructor', desc: 'Apply to start teaching on SkillZone.' },
];

export default function DashboardPage() {
    const { data: user } = useAuthUser();

    return (
        <div>
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-10 md:px-12">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative">
                    <p className="eyebrow">Dashboard</p>
                    <h1 className="mt-3 font-display text-3xl font-semibold text-white">
                        Welcome{user ? `, ${user.name}` : ''}
                    </h1>
                    <p className="mt-3 max-w-lg text-white/60">
                        Pick up where you left off, or explore something new today.
                    </p>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {LINKS.map((link) => (
                    <Link key={link.to} to={link.to} className="card card-hover block p-6">
                        <h3 className="font-display font-semibold text-ink-900">{link.title}</h3>
                        <p className="mt-1.5 text-sm text-slate-500">{link.desc}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                            Go
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

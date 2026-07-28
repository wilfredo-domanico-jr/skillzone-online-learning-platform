import { Link } from 'react-router-dom';

const CATEGORIES = [
    { name: 'Development', slug: 'development' },
    { name: 'Business', slug: 'business' },
    { name: 'Design', slug: 'design' },
    { name: 'Marketing', slug: 'marketing' },
    { name: 'IT & Software', slug: 'it-software' },
    { name: 'Personal Development', slug: 'personal-development' },
];

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-ink-950">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                    <div className="col-span-2 sm:col-span-1">
                        <Link to="/courses" className="flex items-center gap-2">
                            <img src="/logo-icon.png" alt="" className="h-8 w-8" />
                            <span className="font-display text-lg font-semibold text-white">SkillZone</span>
                        </Link>
                        <p className="mt-3 max-w-xs text-sm text-white/50">
                            Practical, project-based courses in tech, design, business, and more — taught by
                            working practitioners.
                        </p>
                        <a
                            href="https://github.com/wilfredo-domanico-jr/skillzone-online-learning-platform"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .3.21.66.79.55A10.99 10.99 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                            </svg>
                            View source on GitHub
                        </a>
                    </div>

                    <div>
                        <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">Explore</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li>
                                <Link to="/courses" className="text-white/60 hover:text-white">
                                    Browse courses
                                </Link>
                            </li>
                            <li>
                                <Link to="/instructor/apply" className="text-white/60 hover:text-white">
                                    Become an instructor
                                </Link>
                            </li>
                            <li>
                                <Link to="/my-learning" className="text-white/60 hover:text-white">
                                    My learning
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">Categories</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            {CATEGORIES.map((category) => (
                                <li key={category.slug}>
                                    <Link
                                        to={`/courses?category=${category.slug}`}
                                        className="text-white/60 hover:text-white"
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">Contact</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li>
                                <a href="mailto:hello@skillzone.dev" className="text-white/60 hover:text-white">
                                    hello@skillzone.dev
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row">
                    <p>&copy; {new Date().getFullYear()} SkillZone. All rights reserved.</p>
                    <p>Built with Laravel &amp; React — a portfolio project.</p>
                </div>
            </div>
        </footer>
    );
}

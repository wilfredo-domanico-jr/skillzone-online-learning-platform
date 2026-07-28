import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import SkeletonCard from '../../components/SkeletonCard';
import { fetchCategories, fetchCourses } from '../../api/catalog';
import { formatPrice } from '../../lib/formatPrice';
import useDocumentMeta from '../../lib/useDocumentMeta';

const GRADIENTS = [
    'from-brand-500/30 via-ink-800 to-ink-950',
    'from-sky-500/25 via-ink-800 to-ink-950',
    'from-violet-500/25 via-ink-800 to-ink-950',
    'from-amber-500/25 via-ink-800 to-ink-950',
];

export default function CourseListPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState<'' | 'free' | 'paid'>('');
    const [sort, setSort] = useState<'' | 'price_asc' | 'price_desc' | 'rating'>('');
    const [page, setPage] = useState(1);

    useDocumentMeta('Browse Courses', 'Browse our full catalog of courses across every category and skill level.');

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

    const { data, isLoading } = useQuery({
        queryKey: ['courses', { search, category, price, sort, page }],
        queryFn: () =>
            fetchCourses({
                search: search || undefined,
                category: category || undefined,
                price: price || undefined,
                sort: sort || undefined,
                page,
            }),
    });

    const withFilterReset = <T,>(setter: (value: T) => void) => (value: T) => {
        setter(value);
        setPage(1);
    };
    const onSearchChange = withFilterReset(setSearch);
    const onCategoryChange = withFilterReset(setCategory);
    const onPriceChange = withFilterReset(setPrice);
    const onSortChange = withFilterReset(setSort);

    return (
        <div>
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-12 md:px-12">
                <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative max-w-xl">
                    <p className="eyebrow">SkillZone catalog</p>
                    <h1 className="mt-3 font-display text-3xl leading-tight font-semibold text-white md:text-4xl">
                        Discover the skills of the future
                    </h1>
                    <p className="mt-3 text-white/60">
                        Unlock the doors to the future job market with courses taught by real practitioners.
                    </p>
                    <div className="mt-6 flex items-center gap-2 rounded-full bg-white/10 p-1.5 pl-5 backdrop-blur">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4 shrink-0 text-white/50"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Search courses…"
                            value={search}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="card mt-6 flex flex-wrap items-center gap-3 p-4">
                <select value={category} onChange={(e: ChangeEvent<HTMLSelectElement>) => onCategoryChange(e.target.value)} className="input w-auto">
                    <option value="">All categories</option>
                    {categories?.map((c) => (
                        <option key={c.id} value={c.slug}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={price}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => onPriceChange(e.target.value as '' | 'free' | 'paid')}
                    className="input w-auto"
                >
                    <option value="">Any price</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                </select>
                <select
                    value={sort}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        onSortChange(e.target.value as '' | 'price_asc' | 'price_desc' | 'rating')
                    }
                    className="input w-auto"
                >
                    <option value="">Newest</option>
                    <option value="rating">Highest rated</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                </select>
            </div>

            {data && data.data.length === 0 && <p className="mt-8 text-slate-500">No courses found.</p>}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading &&
                    Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
                {data?.data.map((course, i) => (
                    <Link
                        key={course.id}
                        to={`/courses/${course.slug}`}
                        className="card card-hover group block overflow-hidden"
                    >
                        {course.thumbnail_url ? (
                            <img
                                src={course.thumbnail_url}
                                alt=""
                                className="aspect-video w-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div
                                className={`aspect-video bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center`}
                            >
                                <span className="font-display text-3xl font-semibold text-white/20">
                                    {course.title?.[0]?.toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="font-display font-semibold text-ink-900 group-hover:text-brand-700">
                                {course.title}
                            </h3>
                            {course.subtitle && (
                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.subtitle}</p>
                            )}
                            {course.reviews_count > 0 && (
                                <p className="badge-amber mt-2">
                                    ★ {course.average_rating} · {course.reviews_count}
                                </p>
                            )}
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                                <span className="text-slate-500">{course.instructor?.name}</span>
                                {Number(course.price) > 0 ? (
                                    <span className="font-semibold text-ink-900">{formatPrice(course.price)}</span>
                                ) : (
                                    <span className="badge-brand">Free</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {data && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
    );
}

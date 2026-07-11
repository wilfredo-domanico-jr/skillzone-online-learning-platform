import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchCourses } from '../../api/catalog';
import useDocumentMeta from '../../lib/useDocumentMeta';

export default function CourseListPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [sort, setSort] = useState('');

    useDocumentMeta('Browse Courses', 'Browse our full catalog of courses across every category and skill level.');

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

    const { data, isLoading } = useQuery({
        queryKey: ['courses', { search, category, price, sort }],
        queryFn: () =>
            fetchCourses({
                search: search || undefined,
                category: category || undefined,
                price: price || undefined,
                sort: sort || undefined,
            }),
    });

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <input
                    type="search"
                    placeholder="Search courses…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 rounded border-gray-300 shadow-sm"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded border-gray-300 shadow-sm"
                >
                    <option value="">All categories</option>
                    {categories?.map((c) => (
                        <option key={c.id} value={c.slug}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={price} onChange={(e) => setPrice(e.target.value)} className="rounded border-gray-300 shadow-sm">
                    <option value="">Any price</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border-gray-300 shadow-sm">
                    <option value="">Newest</option>
                    <option value="rating">Highest rated</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                </select>
            </div>

            {isLoading && <p className="text-gray-500">Loading courses…</p>}

            {data && data.data.length === 0 && (
                <p className="text-gray-500">No courses found.</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data?.data.map((course) => (
                    <Link
                        key={course.id}
                        to={`/courses/${course.slug}`}
                        className="block rounded-lg border bg-white p-4 shadow-sm hover:shadow-md"
                    >
                        <div className="mb-2 aspect-video rounded bg-gray-100" />
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        {course.subtitle && <p className="text-sm text-gray-600">{course.subtitle}</p>}
                        {course.reviews_count > 0 && (
                            <p className="mt-1 text-sm text-amber-600">
                                ★ {course.average_rating} ({course.reviews_count})
                            </p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                            <span>{course.instructor?.name}</span>
                            <span className="font-medium text-gray-900">
                                {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import Select from '../../components/Select';
import SkeletonCard from '../../components/SkeletonCard';
import { createCourse, deleteCourse, fetchMyCourses } from '../../api/instructor';
import { generalError } from '../../lib/apiErrors';
import { formatPrice } from '../../lib/formatPrice';
import { formatSnakeCase } from '../../lib/formatSnakeCase';
import type { CourseStatus } from '../../types/api';

const STATUS_STYLES: Record<CourseStatus, string> = {
    draft: 'badge-slate',
    pending_review: 'badge-amber',
    published: 'badge-brand',
    rejected: 'badge bg-red-100 text-red-700',
};

export default function InstructorCoursesPage() {
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<CourseStatus | ''>('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['instructor', 'courses', status, search, page],
        queryFn: () => fetchMyCourses({ status: status || undefined, search: search || undefined, page }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });

    const create = useMutation({
        mutationFn: createCourse,
        onSuccess: (course) => {
            invalidate();
            navigate(`/instructor/courses/${course.id}`);
        },
    });

    const remove = useMutation({
        mutationFn: deleteCourse,
        onSuccess: () => {
            setDeletingId(null);
            invalidate();
        },
    });

    const withFilterReset = <T,>(setter: (value: T) => void) => (value: T) => {
        setter(value);
        setPage(1);
    };
    const onStatusChange = withFilterReset(setStatus);
    const onSearchChange = withFilterReset(setSearch);

    const isFiltered = status !== '' || search !== '';

    return (
        <div>
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-10 md:px-12">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative">
                    <p className="eyebrow">Instructor</p>
                    <h1 className="mt-3 font-display text-3xl font-semibold text-white">My Courses</h1>
                    <p className="mt-3 max-w-lg text-white/60">
                        Manage your curriculum, track review status, and launch new courses.
                    </p>
                </div>
            </div>

            <form
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    if (title.trim()) create.mutate({ title });
                }}
                className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row"
            >
                <input
                    type="text"
                    placeholder="New course title…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input flex-1"
                />
                <button type="submit" disabled={create.isPending} className="btn-primary shrink-0">
                    Create course
                </button>
            </form>
            {create.isError && <p className="mt-2 text-sm text-red-600">{generalError(create.error)}</p>}

            <div className="card mt-6 flex flex-wrap items-center gap-3 p-4">
                <input
                    type="search"
                    placeholder="Search your courses…"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input w-auto flex-1"
                />
                <Select
                    value={status}
                    onChange={onStatusChange}
                    className="w-auto"
                    options={[
                        { value: '', label: 'All statuses' },
                        { value: 'draft', label: 'Draft' },
                        { value: 'pending_review', label: 'Pending review' },
                        { value: 'published', label: 'Published' },
                        { value: 'rejected', label: 'Rejected' },
                    ]}
                />
            </div>

            {remove.isError && <p className="mt-4 text-sm text-red-600">{generalError(remove.error)}</p>}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading && Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
                {data?.data.map((course) => (
                    <div key={course.id} className="card overflow-hidden">
                        {course.thumbnail_url ? (
                            <img
                                src={course.thumbnail_url}
                                alt=""
                                className="aspect-video w-full object-cover"
                            />
                        ) : (
                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-400">
                                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="4" width="18" height="16" rx="2" />
                                    <circle cx="9" cy="10" r="2" />
                                    <path d="m3 17 5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-xs">No thumbnail</span>
                            </div>
                        )}

                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-display font-semibold text-ink-900">{course.title}</h3>
                                <span className={`${STATUS_STYLES[course.status]} shrink-0`}>
                                    {formatSnakeCase(course.status)}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {course.category?.name ?? 'Uncategorized'}
                                {' · '}
                                {Number(course.price) > 0 ? formatPrice(course.price) : 'Free'}
                            </p>
                            {course.status === 'rejected' && course.rejection_reason && (
                                <p className="mt-2 text-xs text-red-600">Rejected: {course.rejection_reason}</p>
                            )}

                            {deletingId === course.id ? (
                                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2">
                                    <span className="flex-1 text-xs text-red-700">Delete this course?</span>
                                    <button
                                        type="button"
                                        onClick={() => remove.mutate(course.id)}
                                        disabled={remove.isPending}
                                        className="btn-outline !px-2 !py-1 !text-xs text-red-600 hover:border-red-400"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeletingId(null)}
                                        className="text-xs font-medium text-slate-500 hover:text-ink-900"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                                    <Link
                                        to={`/instructor/courses/${course.id}`}
                                        className="btn-outline flex-1 !px-3 !py-1.5 !text-xs"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setDeletingId(course.id)}
                                        className="text-xs font-medium text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {data && data.data.length === 0 && (
                    <p className="card col-span-full p-4 text-slate-500">
                        {isFiltered
                            ? 'No courses match your filters.'
                            : 'No courses yet — create your first one above.'}
                    </p>
                )}
            </div>

            {data && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
    );
}

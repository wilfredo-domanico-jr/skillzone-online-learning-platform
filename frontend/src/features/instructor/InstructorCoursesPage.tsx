import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '../../components/Loading';
import { createCourse, fetchMyCourses } from '../../api/instructor';
import type { CourseStatus } from '../../types/api';

const STATUS_STYLES: Record<CourseStatus, string> = {
    draft: 'badge-slate',
    pending_review: 'badge-amber',
    published: 'badge-brand',
    rejected: 'badge bg-red-100 text-red-700',
};

export default function InstructorCoursesPage() {
    const [title, setTitle] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['instructor', 'courses'],
        queryFn: () => fetchMyCourses(),
    });

    const create = useMutation({
        mutationFn: createCourse,
        onSuccess: (course) => {
            queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
            navigate(`/instructor/courses/${course.id}`);
        },
    });

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

            {isLoading && <Loading className="mt-6" />}

            <div className="mt-6 space-y-3">
                {data?.data.map((course) => (
                    <div key={course.id} className="card card-hover flex items-center justify-between p-4">
                        <Link
                            to={`/instructor/courses/${course.id}`}
                            className="font-display font-semibold text-ink-900 hover:text-brand-700"
                        >
                            {course.title}
                        </Link>
                        <span className={STATUS_STYLES[course.status]}>{course.status.replace('_', ' ')}</span>
                    </div>
                ))}
                {data && data.data.length === 0 && (
                    <p className="card p-4 text-slate-500">No courses yet — create your first one above.</p>
                )}
            </div>
        </div>
    );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCourse } from '../../api/catalog';
import { enrollInCourse, fetchLearnCurriculum } from '../../api/learning';
import { addToCart, fetchCart } from '../../api/commerce';
import { useAuthUser } from '../auth/useAuth';
import { generalError } from '../../lib/apiErrors';

export default function CourseDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: user } = useAuthUser();

    const { data: course, isLoading } = useQuery({
        queryKey: ['courses', slug],
        queryFn: () => fetchCourse(slug),
    });

    const { data: learn } = useQuery({
        queryKey: ['courses', slug, 'curriculum'],
        queryFn: () => fetchLearnCurriculum(slug),
        enabled: !!course,
    });

    const enroll = useMutation({
        mutationFn: () => enrollInCourse(slug),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses', slug, 'curriculum'] });
            navigate(`/learn/${slug}`);
        },
    });

    const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: fetchCart, enabled: !!user });

    const addCart = useMutation({
        mutationFn: () => addToCart(course.id),
        onSuccess: (data) => {
            queryClient.setQueryData(['cart'], data);
            navigate('/cart');
        },
    });

    if (isLoading) return <p className="text-gray-500">Loading…</p>;
    if (!course) return <p className="text-gray-500">Course not found.</p>;

    const curriculum = learn?.course;
    const enrollment = learn?.enrollment;
    const isFree = course.price <= 0;
    const isInCart = cart?.items.some((item) => item.course.id === course.id);

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                {course.subtitle && <p className="mt-1 text-gray-600">{course.subtitle}</p>}
                <p className="mt-1 text-sm text-gray-500">
                    By {course.instructor?.name}
                    {course.category && <> · {course.category.name}</>}
                </p>

                {course.status !== 'published' && (
                    <p className="mt-3 inline-block rounded bg-amber-100 px-2 py-1 text-sm text-amber-800">
                        Preview mode — status: {course.status.replace('_', ' ')}
                        {course.rejection_reason && <> — {course.rejection_reason}</>}
                    </p>
                )}

                {course.description && (
                    <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-700">
                        {course.description}
                    </div>
                )}

                <h2 className="mt-8 mb-3 text-lg font-semibold text-gray-900">Curriculum</h2>
                <div className="space-y-4">
                    {curriculum?.sections.map((section) => (
                        <div key={section.id} className="rounded border bg-white">
                            <div className="border-b bg-gray-50 px-4 py-2 font-medium text-gray-900">
                                {section.title}
                            </div>
                            <ul className="divide-y">
                                {section.lessons.map((lesson) => (
                                    <li key={lesson.id} className="flex items-center justify-between px-4 py-2 text-sm">
                                        <span className="text-gray-700">
                                            {lesson.title}{' '}
                                            <span className="text-gray-400">({lesson.type})</span>
                                        </span>
                                        {lesson.locked ? (
                                            <span className="text-gray-400">🔒</span>
                                        ) : (
                                            <span className="text-green-600">▶ Preview</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <aside className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-4 aspect-video rounded bg-gray-100" />
                <p className="text-2xl font-bold text-gray-900">{isFree ? 'Free' : `$${Number(course.price).toFixed(2)}`}</p>

                {enrollment ? (
                    <button
                        type="button"
                        onClick={() => navigate(`/learn/${slug}`)}
                        className="mt-4 w-full rounded bg-gray-900 py-2 text-white"
                    >
                        Continue learning ({enrollment.progress_percent}%)
                    </button>
                ) : isFree ? (
                    <button
                        type="button"
                        onClick={() => {
                            if (!user) return navigate('/login', { state: { from: { pathname: `/courses/${slug}` } } });
                            enroll.mutate();
                        }}
                        disabled={enroll.isPending}
                        className="mt-4 w-full rounded bg-gray-900 py-2 text-white disabled:opacity-50"
                    >
                        Enroll for free
                    </button>
                ) : isInCart ? (
                    <button
                        type="button"
                        onClick={() => navigate('/cart')}
                        className="mt-4 w-full rounded bg-gray-900 py-2 text-white"
                    >
                        Go to cart
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            if (!user) return navigate('/login', { state: { from: { pathname: `/courses/${slug}` } } });
                            addCart.mutate();
                        }}
                        disabled={addCart.isPending}
                        className="mt-4 w-full rounded bg-gray-900 py-2 text-white disabled:opacity-50"
                    >
                        Add to cart
                    </button>
                )}
                {enroll.isError && <p className="mt-2 text-sm text-red-600">{generalError(enroll.error)}</p>}
                {addCart.isError && <p className="mt-2 text-sm text-red-600">{generalError(addCart.error)}</p>}
            </aside>
        </div>
    );
}

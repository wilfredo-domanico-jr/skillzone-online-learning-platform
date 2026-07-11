import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCourse } from '../../api/catalog';
import { enrollInCourse, fetchLearnCurriculum } from '../../api/learning';
import { addToCart, fetchCart } from '../../api/commerce';
import { createReview, deleteReview, fetchReviews, updateReview } from '../../api/reviews';
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

    const { data: reviews } = useQuery({
        queryKey: ['courses', slug, 'reviews'],
        queryFn: () => fetchReviews(slug),
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

    const invalidateReviews = () => {
        queryClient.invalidateQueries({ queryKey: ['courses', slug, 'reviews'] });
        queryClient.invalidateQueries({ queryKey: ['courses', slug] });
    };
    const submitReview = useMutation({
        mutationFn: ({ id, payload }) => (id ? updateReview(id, payload) : createReview(course.id, payload)),
        onSuccess: invalidateReviews,
    });
    const removeReview = useMutation({
        mutationFn: (id) => deleteReview(id),
        onSuccess: invalidateReviews,
    });

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [editingReview, setEditingReview] = useState(null);

    if (isLoading) return <p className="text-gray-500">Loading…</p>;
    if (!course) return <p className="text-gray-500">Course not found.</p>;

    const curriculum = learn?.course;
    const enrollment = learn?.enrollment;
    const isFree = course.price <= 0;
    const isInCart = cart?.items.some((item) => item.course.id === course.id);
    const myReview = reviews?.data.find((r) => r.user?.id === user?.id);

    const startEditing = (review) => {
        setEditingReview(review);
        setRating(review.rating);
        setComment(review.comment ?? '');
    };

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                {course.subtitle && <p className="mt-1 text-gray-600">{course.subtitle}</p>}
                <p className="mt-1 text-sm text-gray-500">
                    By {course.instructor?.name}
                    {course.category && <> · {course.category.name}</>}
                    {course.reviews_count > 0 && (
                        <> · ★ {course.average_rating} ({course.reviews_count} review{course.reviews_count === 1 ? '' : 's'})</>
                    )}
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

                <h2 className="mt-8 mb-3 text-lg font-semibold text-gray-900">Reviews</h2>

                {enrollment && !myReview && !editingReview && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            submitReview.mutate({ payload: { rating: Number(rating), comment } });
                            setComment('');
                        }}
                        className="mb-4 rounded border bg-white p-4"
                    >
                        <label className="block text-sm font-medium text-gray-700">Your rating</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="mt-1 rounded border-gray-300 text-sm shadow-sm"
                        >
                            {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                    {n} star{n === 1 ? '' : 's'}
                                </option>
                            ))}
                        </select>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts (optional)…"
                            rows={3}
                            className="mt-2 w-full rounded border-gray-300 text-sm shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={submitReview.isPending}
                            className="mt-2 rounded bg-gray-900 px-4 py-1.5 text-sm text-white disabled:opacity-50"
                        >
                            Submit review
                        </button>
                        {submitReview.isError && (
                            <p className="mt-2 text-sm text-red-600">{generalError(submitReview.error)}</p>
                        )}
                    </form>
                )}

                {editingReview && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            submitReview.mutate(
                                { id: editingReview.id, payload: { rating: Number(rating), comment } },
                                { onSuccess: () => setEditingReview(null) }
                            );
                        }}
                        className="mb-4 rounded border bg-white p-4"
                    >
                        <label className="block text-sm font-medium text-gray-700">Edit your rating</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="mt-1 rounded border-gray-300 text-sm shadow-sm"
                        >
                            {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                    {n} star{n === 1 ? '' : 's'}
                                </option>
                            ))}
                        </select>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded border-gray-300 text-sm shadow-sm"
                        />
                        <div className="mt-2 flex gap-2">
                            <button
                                type="submit"
                                disabled={submitReview.isPending}
                                className="rounded bg-gray-900 px-4 py-1.5 text-sm text-white disabled:opacity-50"
                            >
                                Save changes
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingReview(null)}
                                className="rounded border px-4 py-1.5 text-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-3">
                    {reviews?.data.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
                    {reviews?.data.map((review) => (
                        <div key={review.id} className="rounded border bg-white p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                    ★ {review.rating} — {review.user?.name}
                                </p>
                                {review.user?.id === user?.id && (
                                    <div className="flex gap-3 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => startEditing(review)}
                                            className="text-gray-600 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeReview.mutate(review.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                            {review.comment && <p className="mt-1 text-sm text-gray-700">{review.comment}</p>}
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

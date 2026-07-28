import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCourse } from '../../api/catalog';
import { enrollInCourse, fetchLearnCurriculum } from '../../api/learning';
import { addToCart, fetchCart } from '../../api/commerce';
import { createReview, deleteReview, fetchReviews, updateReview } from '../../api/reviews';
import type { ReviewPayload } from '../../api/reviews';
import { useAuthUser } from '../auth/useAuth';
import { generalError } from '../../lib/apiErrors';
import useDocumentMeta from '../../lib/useDocumentMeta';
import type { Cart, Review } from '../../types/api';

interface SubmitReviewVariables {
    id?: number;
    payload: ReviewPayload;
}

export default function CourseDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: user } = useAuthUser();

    const { data: course, isLoading } = useQuery({
        queryKey: ['courses', slug],
        queryFn: () => fetchCourse(slug!),
    });

    useDocumentMeta(course?.title, course?.subtitle);

    const { data: learn } = useQuery({
        queryKey: ['courses', slug, 'curriculum'],
        queryFn: () => fetchLearnCurriculum(slug!),
        enabled: !!course,
    });

    const { data: reviews } = useQuery({
        queryKey: ['courses', slug, 'reviews'],
        queryFn: () => fetchReviews(slug!),
        enabled: !!course,
    });

    const enroll = useMutation({
        mutationFn: () => enrollInCourse(slug!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses', slug, 'curriculum'] });
            navigate(`/learn/${slug}`);
        },
    });

    const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: fetchCart, enabled: !!user });

    const addCart = useMutation({
        mutationFn: () => addToCart(course!.id),
        onSuccess: (data: Cart) => {
            queryClient.setQueryData(['cart'], data);
            navigate('/cart');
        },
    });

    const invalidateReviews = () => {
        queryClient.invalidateQueries({ queryKey: ['courses', slug, 'reviews'] });
        queryClient.invalidateQueries({ queryKey: ['courses', slug] });
    };
    const submitReview = useMutation({
        mutationFn: ({ id, payload }: SubmitReviewVariables) =>
            id ? updateReview(id, payload) : createReview(course!.id, payload),
        onSuccess: invalidateReviews,
    });
    const removeReview = useMutation({
        mutationFn: (id: number) => deleteReview(id),
        onSuccess: invalidateReviews,
    });

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [editingReview, setEditingReview] = useState<Review | null>(null);

    if (isLoading) return <p className="text-slate-500">Loading…</p>;
    if (!course) return <p className="text-slate-500">Course not found.</p>;

    const curriculum = learn?.course;
    const enrollment = learn?.enrollment;
    const isFree = Number(course.price) <= 0;
    const isInCart = cart?.items.some((item) => item.course.id === course.id);
    const myReview = reviews?.data.find((r) => r.user?.id === user?.id);

    const startEditing = (review: Review) => {
        setEditingReview(review);
        setRating(review.rating);
        setComment(review.comment ?? '');
    };

    return (
        <div>
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-10 md:px-12">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative max-w-2xl">
                    {course.category && <p className="eyebrow">{course.category.name}</p>}
                    <h1 className="mt-3 font-display text-3xl leading-tight font-semibold text-white md:text-4xl">
                        {course.title}
                    </h1>
                    {course.subtitle && <p className="mt-3 text-white/60">{course.subtitle}</p>}
                    <p className="mt-4 text-sm text-white/50">
                        By <span className="text-white/80">{course.instructor?.name}</span>
                        {course.reviews_count > 0 && (
                            <>
                                {' '}
                                · <span className="text-amber-400">★ {course.average_rating}</span> (
                                {course.reviews_count} review{course.reviews_count === 1 ? '' : 's'})
                            </>
                        )}
                    </p>
                    {course.status !== 'published' && (
                        <p className="badge-amber mt-4">
                            Preview mode — status: {course.status.replace('_', ' ')}
                            {course.rejection_reason && <> — {course.rejection_reason}</>}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    {course.description && (
                        <div className="card p-6">
                            <h2 className="font-display text-lg font-semibold text-ink-900">About this course</h2>
                            <div className="prose mt-3 max-w-none whitespace-pre-line text-sm text-slate-600">
                                {course.description}
                            </div>
                        </div>
                    )}

                    <h2 className="mt-8 mb-3 font-display text-lg font-semibold text-ink-900">Curriculum</h2>
                    <div className="card divide-y divide-slate-100 overflow-hidden">
                        {curriculum?.sections?.map((section) => (
                            <div key={section.id}>
                                <div className="bg-slate-50 px-5 py-3 text-sm font-semibold text-ink-900">
                                    {section.title}
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {section.lessons.map((lesson) => (
                                        <li
                                            key={lesson.id}
                                            className="flex items-center justify-between px-5 py-3 text-sm"
                                        >
                                            <span className="text-slate-600">
                                                {lesson.title}{' '}
                                                <span className="text-slate-400">({lesson.type})</span>
                                            </span>
                                            {lesson.locked ? (
                                                <span className="text-slate-300">🔒</span>
                                            ) : (
                                                <span className="text-xs font-semibold text-brand-600">▶ Preview</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <h2 className="mt-8 mb-3 font-display text-lg font-semibold text-ink-900">Reviews</h2>

                    {enrollment && !myReview && !editingReview && (
                        <form
                            onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                submitReview.mutate({ payload: { rating: Number(rating), comment } });
                                setComment('');
                            }}
                            className="card mb-4 p-5"
                        >
                            <label className="label">Your rating</label>
                            <select
                                value={rating}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setRating(Number(e.target.value))}
                                className="input w-auto"
                            >
                                {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                        {n} star{n === 1 ? '' : 's'}
                                    </option>
                                ))}
                            </select>
                            <textarea
                                value={comment}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                placeholder="Share your thoughts (optional)…"
                                rows={3}
                                className="input mt-3"
                            />
                            <button type="submit" disabled={submitReview.isPending} className="btn-primary mt-3">
                                Submit review
                            </button>
                            {submitReview.isError && (
                                <p className="mt-2 text-sm text-red-600">{generalError(submitReview.error)}</p>
                            )}
                        </form>
                    )}

                    {editingReview && (
                        <form
                            onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                submitReview.mutate(
                                    { id: editingReview.id, payload: { rating: Number(rating), comment } },
                                    { onSuccess: () => setEditingReview(null) }
                                );
                            }}
                            className="card mb-4 p-5"
                        >
                            <label className="label">Edit your rating</label>
                            <select
                                value={rating}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setRating(Number(e.target.value))}
                                className="input w-auto"
                            >
                                {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                        {n} star{n === 1 ? '' : 's'}
                                    </option>
                                ))}
                            </select>
                            <textarea
                                value={comment}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                rows={3}
                                className="input mt-3"
                            />
                            <div className="mt-3 flex gap-2">
                                <button type="submit" disabled={submitReview.isPending} className="btn-primary">
                                    Save changes
                                </button>
                                <button type="button" onClick={() => setEditingReview(null)} className="btn-outline">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {reviews?.data.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
                        {reviews?.data.map((review) => (
                            <div key={review.id} className="card p-5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-ink-900">
                                        <span className="text-amber-500">★ {review.rating}</span> — {review.user?.name}
                                    </p>
                                    {review.user?.id === user?.id && (
                                        <div className="flex gap-3 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(review)}
                                                className="font-medium text-slate-500 hover:text-ink-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeReview.mutate(review.id)}
                                                className="font-medium text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {review.comment && <p className="mt-2 text-sm text-slate-600">{review.comment}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="card sticky top-20 h-fit p-5">
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 via-ink-800 to-ink-950">
                        <span className="font-display text-4xl font-semibold text-white/20">
                            {course.title?.[0]?.toUpperCase()}
                        </span>
                    </div>
                    <p className="font-display text-3xl font-bold text-ink-900">
                        {isFree ? 'Free' : `$${Number(course.price).toFixed(2)}`}
                    </p>

                    {enrollment ? (
                        <button type="button" onClick={() => navigate(`/learn/${slug}`)} className="btn-primary mt-5 w-full">
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
                            className="btn-primary mt-5 w-full"
                        >
                            Enroll for free
                        </button>
                    ) : isInCart ? (
                        <button type="button" onClick={() => navigate('/cart')} className="btn-primary mt-5 w-full">
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
                            className="btn-primary mt-5 w-full"
                        >
                            Add to cart
                        </button>
                    )}
                    {enroll.isError && <p className="mt-2 text-sm text-red-600">{generalError(enroll.error)}</p>}
                    {addCart.isError && <p className="mt-2 text-sm text-red-600">{generalError(addCart.error)}</p>}
                </aside>
            </div>
        </div>
    );
}

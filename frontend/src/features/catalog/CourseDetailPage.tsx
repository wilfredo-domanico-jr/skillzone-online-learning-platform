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
import Select from '../../components/Select';
import Skeleton from '../../components/Skeleton';
import { generalError } from '../../lib/apiErrors';
import { formatPrice } from '../../lib/formatPrice';
import { formatSnakeCase } from '../../lib/formatSnakeCase';
import { useConfirm } from '../../lib/useConfirm';
import useDocumentMeta from '../../lib/useDocumentMeta';
import type { Cart, Review } from '../../types/api';

interface SubmitReviewVariables {
    id?: number;
    payload: ReviewPayload;
}

export default function CourseDetailPage() {
    // The route is only ever matched as /courses/:slug, so this param is
    // always present — asserted once here instead of at each call site.
    const { slug: routeSlug } = useParams<{ slug: string }>();
    const slug = routeSlug as string;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: user } = useAuthUser();
    const { requestConfirm, confirmDialog } = useConfirm();

    const { data: course, isLoading } = useQuery({
        queryKey: ['courses', slug],
        queryFn: () => fetchCourse(slug),
    });

    useDocumentMeta(course?.title, course?.subtitle);

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

    const [editingReview, setEditingReview] = useState<Review | null>(null);

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-52 w-full !rounded-3xl" />
                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <div className="card space-y-3 p-6">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="card overflow-hidden">
                            {Array.from({ length: 4 }, (_, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3">
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card space-y-3 p-5">
                        <Skeleton className="aspect-video w-full" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-11 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    if (!course) return <p className="text-slate-500">Course not found.</p>;

    const curriculum = learn?.course;
    const enrollment = learn?.enrollment;
    const isFree = Number(course.price) <= 0;
    const isInCart = cart?.items.some((item) => item.course.id === course.id);
    const myReview = reviews?.data.find((r) => r.user?.id === user?.id);

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
                            Preview mode — status: {formatSnakeCase(course.status)}
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
                        <ReviewForm
                            heading="Your rating"
                            submitLabel="Submit review"
                            isPending={submitReview.isPending}
                            error={submitReview.isError ? submitReview.error : undefined}
                            onSubmit={(payload) => submitReview.mutate({ payload })}
                        />
                    )}

                    {editingReview && (
                        <ReviewForm
                            key={editingReview.id}
                            heading="Edit your rating"
                            submitLabel="Save changes"
                            initialRating={editingReview.rating}
                            initialComment={editingReview.comment ?? ''}
                            isPending={submitReview.isPending}
                            error={submitReview.isError ? submitReview.error : undefined}
                            onCancel={() => setEditingReview(null)}
                            onSubmit={(payload) =>
                                submitReview.mutate(
                                    { id: editingReview.id, payload },
                                    { onSuccess: () => setEditingReview(null) }
                                )
                            }
                        />
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
                                                onClick={() => setEditingReview(review)}
                                                className="font-medium text-slate-500 hover:text-ink-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    requestConfirm(
                                                        { title: 'Delete this review?', confirmLabel: 'Delete review' },
                                                        () => removeReview.mutate(review.id),
                                                    )
                                                }
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
                    {course.thumbnail_url ? (
                        <img
                            src={course.thumbnail_url}
                            alt=""
                            className="mb-4 aspect-video w-full rounded-xl object-cover"
                        />
                    ) : (
                        <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 via-ink-800 to-ink-950">
                            <span className="font-display text-4xl font-semibold text-white/20">
                                {course.title?.[0]?.toUpperCase()}
                            </span>
                        </div>
                    )}
                    <p className="font-display text-3xl font-bold text-ink-900">
                        {isFree ? 'Free' : formatPrice(course.price)}
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
            {confirmDialog}
        </div>
    );
}

interface ReviewFormProps {
    heading: string;
    submitLabel: string;
    initialRating?: number;
    initialComment?: string;
    isPending: boolean;
    error?: unknown;
    onSubmit: (payload: ReviewPayload) => void;
    onCancel?: () => void;
}

function ReviewForm({
    heading,
    submitLabel,
    initialRating = 5,
    initialComment = '',
    isPending,
    error,
    onSubmit,
    onCancel,
}: ReviewFormProps) {
    const [rating, setRating] = useState(initialRating);
    const [comment, setComment] = useState(initialComment);

    return (
        <form
            onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onSubmit({ rating, comment });
            }}
            className="card mb-4 p-5"
        >
            <label className="label">{heading}</label>
            <Select
                value={rating}
                onChange={setRating}
                options={[5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${n} star${n === 1 ? '' : 's'}` }))}
                className="w-auto"
            />
            <textarea
                value={comment}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                placeholder="Share your thoughts (optional)…"
                rows={3}
                className="input mt-3"
            />
            <div className="mt-3 flex gap-2">
                <button type="submit" disabled={isPending} className="btn-primary">
                    {submitLabel}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="btn-outline">
                        Cancel
                    </button>
                )}
            </div>
            {error !== undefined && <p className="mt-2 text-sm text-red-600">{generalError(error)}</p>}
        </form>
    );
}

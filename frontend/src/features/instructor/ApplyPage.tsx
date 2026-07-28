import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormError from '../../components/FormError';
import Skeleton from '../../components/Skeleton';
import { applyServerErrors } from '../../lib/apiErrors';
import { applyToTeach, fetchMyApplication } from '../../api/instructor';
import { AUTH_QUERY_KEY, useAuthUser } from '../auth/useAuth';

interface ApplyFormValues {
    bio: string;
    expertise?: string;
    portfolio_url?: string;
}

export default function ApplyPage() {
    const { data: user } = useAuthUser();
    const queryClient = useQueryClient();
    const { data: application, isLoading } = useQuery({
        queryKey: ['instructor-application', 'me'],
        queryFn: fetchMyApplication,
    });

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ApplyFormValues>();

    const apply = useMutation({
        mutationFn: applyToTeach,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-application', 'me'] }),
    });

    const onSubmit = async (values: ApplyFormValues) => {
        try {
            await apply.mutateAsync({
                bio: values.bio,
                portfolio_url: values.portfolio_url || undefined,
                expertise: values.expertise
                    ? values.expertise.split(',').map((s) => s.trim()).filter(Boolean)
                    : undefined,
            });
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        } catch (error) {
            applyServerErrors(error, setError);
        }
    };

    if (user?.roles?.some((r) => r.name === 'instructor')) {
        return <p className="text-slate-600">You're already an approved instructor.</p>;
    }

    if (isLoading) {
        return (
            <div className="max-w-lg space-y-4">
                <Skeleton className="h-36 w-full !rounded-3xl" />
                <div className="card space-y-3 p-6">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-11 w-32" />
                </div>
            </div>
        );
    }

    if (application && application.status === 'pending') {
        return (
            <div className="relative max-w-lg overflow-hidden rounded-3xl bg-ink-950 px-8 py-10 md:px-12">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative">
                    <p className="eyebrow">Instructor application</p>
                    <h1 className="mt-3 font-display text-2xl font-semibold text-white">Application pending</h1>
                    <p className="mt-3 text-white/60">
                        Your instructor application is awaiting review. We'll notify you once it's been decided.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg">
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-10 md:px-12">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative">
                    <p className="eyebrow">Teach on SkillZone</p>
                    <h1 className="mt-3 font-display text-2xl font-semibold text-white">
                        Apply to become an instructor
                    </h1>
                    <p className="mt-3 text-white/60">Tell us about yourself and we'll review your application.</p>
                </div>
            </div>

            {application?.status === 'rejected' && (
                <p className="badge-amber mt-6 block w-fit">
                    Your previous application was rejected
                    {application.rejection_reason && <>: {application.rejection_reason}</>}. You can apply again below.
                </p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-4 p-6">
                <div>
                    <label className="label">Tell us about your teaching/professional background</label>
                    <textarea
                        rows={5}
                        className="input"
                        {...register('bio', { required: true, minLength: 20 })}
                    />
                    <FormError message={errors.bio?.message} />
                </div>
                <div>
                    <label className="label">Areas of expertise (comma-separated)</label>
                    <input
                        type="text"
                        placeholder="React, Laravel, Data Science"
                        className="input"
                        {...register('expertise')}
                    />
                </div>
                <div>
                    <label className="label">Portfolio URL (optional)</label>
                    <input type="url" className="input" {...register('portfolio_url')} />
                    <FormError message={errors.portfolio_url?.message} />
                </div>
                <FormError message={errors.root?.message} />
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    Submit application
                </button>
            </form>
        </div>
    );
}

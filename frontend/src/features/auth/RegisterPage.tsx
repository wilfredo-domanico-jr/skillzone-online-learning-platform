import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import FormError from '../../components/FormError';
import { fieldErrors, generalError } from '../../lib/apiErrors';
import { useRegister } from './useAuth';

interface RegisterFormValues {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function RegisterPage() {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>();
    const registerUser = useRegister();
    const navigate = useNavigate();

    const onSubmit = async (values: RegisterFormValues) => {
        try {
            await registerUser.mutateAsync(values);
            navigate('/dashboard', { replace: true });
        } catch (error: unknown) {
            const fieldErrs = fieldErrors(error);
            if (Object.keys(fieldErrs).length) {
                Object.entries(fieldErrs).forEach(([field, message]) =>
                    setError(field as keyof RegisterFormValues, { message })
                );
            } else {
                setError('root', { message: generalError(error) });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Create your account</h2>
                <p className="mt-1 text-sm text-slate-500">Start learning in minutes — it's free to join.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="label">Name</label>
                    <input type="text" className="input" {...register('name', { required: true })} />
                    <FormError message={errors.name?.message} />
                </div>
                <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" {...register('email', { required: true })} />
                    <FormError message={errors.email?.message} />
                </div>
                <div>
                    <label className="label">Password</label>
                    <input type="password" className="input" {...register('password', { required: true })} />
                    <FormError message={errors.password?.message} />
                </div>
                <div>
                    <label className="label">Confirm password</label>
                    <input
                        type="password"
                        className="input"
                        {...register('password_confirmation', { required: true })}
                    />
                    <FormError message={errors.password_confirmation?.message} />
                </div>
                <FormError message={errors.root?.message} />
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                    Create account
                </button>
            </form>

            <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand-600 hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}

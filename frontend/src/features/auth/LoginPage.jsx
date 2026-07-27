import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormError from '../../components/FormError';
import { fieldErrors, generalError } from '../../lib/apiErrors';
import { socialRedirectUrl } from '../../api/auth';
import { useLogin } from './useAuth';

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm();
    const login = useLogin();
    const navigate = useNavigate();
    const location = useLocation();

    const onSubmit = async (values) => {
        try {
            await login.mutateAsync(values);
            navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
        } catch (error) {
            const fieldErrs = fieldErrors(error);
            if (Object.keys(fieldErrs).length) {
                Object.entries(fieldErrs).forEach(([field, message]) =>
                    setError(field, { message })
                );
            } else {
                setError('root', { message: generalError(error) });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Welcome back</h2>
                <p className="mt-1 text-sm text-slate-500">Log in to keep learning where you left off.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <FormError message={errors.root?.message} />
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                    Log in
                </button>
            </form>

            <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-xs font-medium text-slate-400">or</span>
            </div>

            <div className="space-y-2">
                <a href={socialRedirectUrl('google')} className="btn-outline w-full">
                    Continue with Google
                </a>
                <a href={socialRedirectUrl('github')} className="btn-outline w-full">
                    Continue with GitHub
                </a>
            </div>

            <p className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-brand-600 hover:underline">
                    Register
                </Link>
            </p>
        </div>
    );
}

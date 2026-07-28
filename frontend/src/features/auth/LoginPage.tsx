import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormError from '../../components/FormError';
import { fieldErrors, generalError } from '../../lib/apiErrors';
import { socialRedirectUrl } from '../../api/auth';
import { useDemoLogin, useLogin } from './useAuth';
import type { Role } from '../../types/api';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_ROLES: Role[] = ['student', 'instructor', 'admin'];

interface LoginFormValues {
    email: string;
    password: string;
}

interface LocationState {
    from?: { pathname: string };
}

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>();
    const login = useLogin();
    const demoLogin = useDemoLogin();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;

    const onSubmit = async (values: LoginFormValues) => {
        try {
            await login.mutateAsync(values);
            navigate(locationState?.from?.pathname ?? '/dashboard', { replace: true });
        } catch (error: unknown) {
            const fieldErrs = fieldErrors(error);
            if (Object.keys(fieldErrs).length) {
                Object.entries(fieldErrs).forEach(([field, message]) =>
                    setError(field as keyof LoginFormValues, { message })
                );
            } else {
                setError('root', { message: generalError(error) });
            }
        }
    };

    const onDemoLogin = async (role: Role) => {
        try {
            await demoLogin.mutateAsync(role);
            navigate('/dashboard', { replace: true });
        } catch {
            // surfaced via demoLogin.isError below
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Welcome back</h2>
                <p className="mt-1 text-sm text-slate-500">Log in to keep learning where you left off.</p>
            </div>

            {DEMO_MODE && (
                <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                    <p className="text-sm font-semibold text-brand-800">Just exploring?</p>
                    <p className="mt-1 text-xs text-brand-700">
                        Jump in instantly as a demo account — no sign-up needed.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {DEMO_ROLES.map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => onDemoLogin(role)}
                                disabled={demoLogin.isPending}
                                className="btn-outline !px-2 !py-1.5 !text-xs capitalize"
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                    {demoLogin.isError && (
                        <FormError message={generalError(demoLogin.error)} />
                    )}
                </div>
            )}

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
                <a href={socialRedirectUrl('facebook')} className="btn-outline w-full">
                    Continue with Facebook
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

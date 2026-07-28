import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormError from '../../components/FormError';
import { applyServerErrors, generalError } from '../../lib/apiErrors';
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
            applyServerErrors(error, setError);
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
                <a
                    href={socialRedirectUrl('google')}
                    className="btn-outline flex w-full items-center justify-center gap-2"
                >
                    <GoogleIcon />
                    Continue with Google
                </a>
                <a
                    href={socialRedirectUrl('facebook')}
                    className="btn-outline flex w-full items-center justify-center gap-2"
                >
                    <FacebookIcon />
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

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
        </svg>
    );
}

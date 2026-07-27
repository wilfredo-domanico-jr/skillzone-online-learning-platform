import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe } from '../../api/auth';
import { AUTH_QUERY_KEY } from './useAuth';

/**
 * Landed on after SocialController::callback() redirects the full browser
 * away from the API back into the SPA. The session cookie is already set at
 * this point, so this just needs to hydrate the auth query and move on.
 */
export default function OAuthCallbackPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        fetchMe()
            .then((user) => {
                queryClient.setQueryData(AUTH_QUERY_KEY, user);
                navigate('/dashboard', { replace: true });
            })
            .catch(() => navigate('/login?error=oauth_failed', { replace: true }));
    }, [navigate, queryClient]);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-6">
            <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
                <p className="font-display text-lg font-semibold text-white">Signing you in…</p>
                <p className="text-sm text-white/50">Hang tight, we're finishing setting up your session.</p>
            </div>
        </div>
    );
}

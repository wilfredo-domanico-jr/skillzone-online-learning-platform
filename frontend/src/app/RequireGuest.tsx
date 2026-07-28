import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthUser } from '../features/auth/useAuth';

interface RequireGuestProps {
    children: ReactNode;
}

/**
 * Gate a route to unauthenticated visitors only — an already-logged-in user
 * hitting /login or /register is redirected away instead of seeing the form.
 */
export default function RequireGuest({ children }: RequireGuestProps) {
    const { data: user, isLoading } = useAuthUser();

    if (isLoading) {
        return null;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

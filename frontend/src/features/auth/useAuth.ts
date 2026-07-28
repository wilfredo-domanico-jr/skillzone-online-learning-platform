import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../../api/auth';

export const AUTH_QUERY_KEY = ['auth', 'me'];

export function useAuthUser() {
    return useQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: authApi.fetchMe,
        retry: false,
        staleTime: 60_000,
    });
}

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.login,
        onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
    });
}

export function useDemoLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.demoLogin,
        onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
    });
}

export function useRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.register,
        onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => queryClient.setQueryData(AUTH_QUERY_KEY, null),
    });
}

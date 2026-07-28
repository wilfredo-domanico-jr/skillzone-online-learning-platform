import client, { ensureCsrfCookie } from './client';
import type { Role, User } from '../types/api';

export async function fetchMe(): Promise<User> {
    const { data } = await client.get('/api/v1/auth/me');
    return data.user;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export async function login({ email, password }: LoginPayload): Promise<User> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/auth/login', { email, password });
    return data.user;
}

export async function demoLogin(role: Role): Promise<User> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/auth/demo-login', { role });
    return data.user;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export async function register({
    name,
    email,
    password,
    password_confirmation,
}: RegisterPayload): Promise<User> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/auth/register', {
        name,
        email,
        password,
        password_confirmation,
    });
    return data.user;
}

export async function logout(): Promise<void> {
    await client.post('/api/v1/auth/logout');
}

export function socialRedirectUrl(provider: 'google' | 'facebook'): string {
    return `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/auth/${provider}/redirect`;
}

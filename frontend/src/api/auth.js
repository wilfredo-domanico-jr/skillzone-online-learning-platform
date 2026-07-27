import client, { ensureCsrfCookie } from './client';

export async function fetchMe() {
    const { data } = await client.get('/api/v1/auth/me');
    return data.user;
}

export async function login({ email, password }) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/auth/login', { email, password });
    return data.user;
}

export async function demoLogin(role) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/auth/demo-login', { role });
    return data.user;
}

export async function register({ name, email, password, password_confirmation }) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/auth/register', {
        name,
        email,
        password,
        password_confirmation,
    });
    return data.user;
}

export async function logout() {
    await client.post('/api/v1/auth/logout');
}

export function socialRedirectUrl(provider) {
    return `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/auth/${provider}/redirect`;
}

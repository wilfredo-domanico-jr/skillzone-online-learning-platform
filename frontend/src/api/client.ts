import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
    },
});

/**
 * Sanctum SPA auth requires a fresh CSRF cookie before any state-changing
 * request (login, register, etc). Safe to call before every such request —
 * it's a cheap GET and Sanctum rotates the token each time regardless.
 */
export async function ensureCsrfCookie() {
    await client.get('/sanctum/csrf-cookie');
}

export default client;

import client, { ensureCsrfCookie } from './client';

export async function fetchNotifications(params = {}) {
    const { data } = await client.get('/api/v1/notifications', { params });
    return data;
}

export async function markNotificationRead(id) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/notifications/${id}/read`);
    return data;
}

export async function markAllNotificationsRead() {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/notifications/read-all');
    return data;
}

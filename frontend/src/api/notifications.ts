import client, { ensureCsrfCookie } from './client';
import type { NotificationsResponse } from '../types/api';

export async function fetchNotifications(
    params: Record<string, unknown> = {}
): Promise<NotificationsResponse> {
    const { data } = await client.get('/api/v1/notifications', { params });
    return data;
}

export async function markNotificationRead(id: string): Promise<NotificationsResponse> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/notifications/${id}/read`);
    return data;
}

export async function markAllNotificationsRead(): Promise<NotificationsResponse> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/notifications/read-all');
    return data;
}

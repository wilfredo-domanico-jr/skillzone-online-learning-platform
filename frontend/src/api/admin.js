import client, { ensureCsrfCookie } from './client';

export async function fetchInstructorApplications(params = {}) {
    const { data } = await client.get('/api/v1/admin/instructor-applications', { params });
    return data;
}

export async function approveInstructorApplication(id) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/instructor-applications/${id}/approve`);
    return data.data;
}

export async function rejectInstructorApplication(id, rejectionReason) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/instructor-applications/${id}/reject`, {
        rejection_reason: rejectionReason,
    });
    return data.data;
}

export async function fetchCoursesForModeration(params = {}) {
    const { data } = await client.get('/api/v1/admin/courses', { params });
    return data;
}

export async function approveCourse(id) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/courses/${id}/approve`);
    return data.data;
}

export async function rejectCourse(id, rejectionReason) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/courses/${id}/reject`, {
        rejection_reason: rejectionReason,
    });
    return data.data;
}

// Payouts
export async function fetchAdminPayouts(params = {}) {
    const { data } = await client.get('/api/v1/admin/payouts', { params });
    return data;
}

export async function markPayoutPaid(id) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/payouts/${id}/mark-paid`);
    return data.data;
}

// Users
export async function fetchAdminUsers(params = {}) {
    const { data } = await client.get('/api/v1/admin/users', { params });
    return data;
}

export async function suspendUser(id) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/users/${id}/suspend`);
    return data.data;
}

export async function unsuspendUser(id) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/users/${id}/unsuspend`);
    return data.data;
}

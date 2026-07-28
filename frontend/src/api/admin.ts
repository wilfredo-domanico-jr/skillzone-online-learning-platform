import client, { ensureCsrfCookie } from './client';
import type {
    Course,
    CourseStatus,
    InstructorApplication,
    InstructorApplicationStatus,
    InstructorPayout,
    PaginatedResponse,
    PayoutStatus,
    User,
} from '../types/api';

export interface InstructorApplicationListParams {
    status?: InstructorApplicationStatus;
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export interface CourseModerationListParams {
    status?: CourseStatus;
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export interface AdminPayoutListParams {
    status?: PayoutStatus;
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export interface AdminUserListParams {
    search?: string;
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export async function fetchInstructorApplications(
    params: InstructorApplicationListParams = {}
): Promise<PaginatedResponse<InstructorApplication>> {
    const { data } = await client.get('/api/v1/admin/instructor-applications', { params });
    return data;
}

export async function approveInstructorApplication(id: number): Promise<InstructorApplication> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/instructor-applications/${id}/approve`);
    return data.data;
}

export async function rejectInstructorApplication(
    id: number,
    rejectionReason: string
): Promise<InstructorApplication> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/instructor-applications/${id}/reject`, {
        rejection_reason: rejectionReason,
    });
    return data.data;
}

export async function fetchCoursesForModeration(
    params: CourseModerationListParams = {}
): Promise<PaginatedResponse<Course>> {
    const { data } = await client.get('/api/v1/admin/courses', { params });
    return data;
}

export async function approveCourse(id: number): Promise<Course> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/courses/${id}/approve`);
    return data.data;
}

export async function rejectCourse(id: number, rejectionReason: string): Promise<Course> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/courses/${id}/reject`, {
        rejection_reason: rejectionReason,
    });
    return data.data;
}

// Payouts
export async function fetchAdminPayouts(
    params: AdminPayoutListParams = {}
): Promise<PaginatedResponse<InstructorPayout>> {
    const { data } = await client.get('/api/v1/admin/payouts', { params });
    return data;
}

export async function markPayoutPaid(id: number): Promise<InstructorPayout> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/payouts/${id}/mark-paid`);
    return data.data;
}

// Users
export async function fetchAdminUsers(
    params: AdminUserListParams = {}
): Promise<PaginatedResponse<User>> {
    const { data } = await client.get('/api/v1/admin/users', { params });
    return data;
}

export async function suspendUser(id: number): Promise<User> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/users/${id}/suspend`);
    return data.data;
}

export async function unsuspendUser(id: number): Promise<User> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/admin/users/${id}/unsuspend`);
    return data.data;
}

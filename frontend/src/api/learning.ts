import client, { ensureCsrfCookie } from './client';
import type { Course, Enrollment, PaginatedResponse } from '../types/api';

export interface EnrollmentListParams {
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export async function fetchMyEnrollments(
    params: EnrollmentListParams = {}
): Promise<PaginatedResponse<Enrollment>> {
    const { data } = await client.get('/api/v1/my/enrollments', { params });
    return data;
}

export async function enrollInCourse(slug: string): Promise<Enrollment> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/courses/${slug}/enroll`);
    return data.data;
}

export interface LearnCurriculum {
    course: Course;
    enrollment: Enrollment;
}

export async function fetchLearnCurriculum(slug: string): Promise<LearnCurriculum> {
    const { data } = await client.get(`/api/v1/courses/${slug}/curriculum`);
    return { course: data.data, enrollment: data.enrollment };
}

export async function completeLesson(lessonId: number): Promise<{ enrollment: Enrollment }> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/lessons/${lessonId}/complete`);
    return data;
}

export async function saveLessonProgress(
    lessonId: number,
    lastPositionSeconds: number
): Promise<void> {
    await ensureCsrfCookie();
    await client.post(`/api/v1/lessons/${lessonId}/progress`, {
        last_position_seconds: Math.floor(lastPositionSeconds),
    });
}

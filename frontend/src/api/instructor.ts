import client, { ensureCsrfCookie } from './client';
import type {
    Course,
    CourseLevel,
    CourseSection,
    InstructorApplication,
    InstructorPayout,
    Lesson,
    LessonAttachment,
    LessonType,
    PaginatedResponse,
} from '../types/api';

export interface InstructorApplicationPayload {
    bio: string;
    portfolio_url?: string;
    expertise?: string[];
}

export interface InstructorCourseListParams {
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export interface CourseFormPayload {
    title: string;
    category_id?: number | null;
    subtitle?: string;
    description?: string;
    price?: number | string;
    level?: CourseLevel;
    language?: string;
    requirements?: string[];
    what_you_will_learn?: string[];
}

// Instructor application
export async function applyToTeach(payload: InstructorApplicationPayload): Promise<InstructorApplication> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/instructor-applications', payload);
    return data.data;
}

export async function fetchMyApplication(): Promise<InstructorApplication | null> {
    const { data } = await client.get('/api/v1/instructor-applications/me');
    return data.application;
}

// Courses
export async function fetchMyCourses(
    params: InstructorCourseListParams = {}
): Promise<PaginatedResponse<Course>> {
    const { data } = await client.get('/api/v1/instructor/courses', { params });
    return data;
}

export async function createCourse(payload: CourseFormPayload): Promise<Course> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/instructor/courses', payload);
    return data.data;
}

export async function updateCourse(courseId: number, payload: CourseFormPayload): Promise<Course> {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/courses/${courseId}`, payload);
    return data.data;
}

export async function deleteCourse(courseId: number): Promise<void> {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/courses/${courseId}`);
}

export async function submitCourseForReview(courseId: number): Promise<Course> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/courses/${courseId}/submit-for-review`);
    return data.data;
}

// Sections
export async function createSection(courseId: number, title: string): Promise<CourseSection> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/courses/${courseId}/sections`, { title });
    return data.data;
}

export async function updateSection(sectionId: number, title: string): Promise<CourseSection> {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/sections/${sectionId}`, { title });
    return data.data;
}

export async function deleteSection(sectionId: number): Promise<void> {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/sections/${sectionId}`);
}

export async function reorderSections(courseId: number, sectionIds: number[]): Promise<CourseSection[]> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/courses/${courseId}/sections/reorder`, {
        section_ids: sectionIds,
    });
    return data.data;
}

// Lessons
export interface CreateLessonPayload {
    title: string;
    type: LessonType;
    is_previewable?: boolean;
}

export interface UpdateLessonPayload {
    title: string;
    is_previewable?: boolean;
}

export async function createLesson(sectionId: number, payload: CreateLessonPayload): Promise<Lesson> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/sections/${sectionId}/lessons`, payload);
    return data.data;
}

export async function updateLesson(lessonId: number, payload: UpdateLessonPayload): Promise<Lesson> {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/lessons/${lessonId}`, payload);
    return data.data;
}

export async function deleteLesson(lessonId: number): Promise<void> {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/lessons/${lessonId}`);
}

export async function reorderLessons(sectionId: number, lessonIds: number[]): Promise<Lesson[]> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/sections/${sectionId}/lessons/reorder`, {
        lesson_ids: lessonIds,
    });
    return data.data;
}

// Lesson content
export async function uploadLessonVideo(lessonId: number, file: File): Promise<Lesson> {
    await ensureCsrfCookie();
    const form = new FormData();
    form.append('video', file);
    const { data } = await client.post(`/api/v1/instructor/lessons/${lessonId}/video`, form);
    return data.data;
}

export async function updateLessonArticle(lessonId: number, bodyHtml: string): Promise<Lesson> {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/lessons/${lessonId}/article`, { body_html: bodyHtml });
    return data.data;
}

export async function uploadLessonAttachment(lessonId: number, file: File): Promise<LessonAttachment> {
    await ensureCsrfCookie();
    const form = new FormData();
    form.append('file', file);
    const { data } = await client.post(`/api/v1/instructor/lessons/${lessonId}/attachments`, form);
    return data.data;
}

export async function deleteLessonAttachment(attachmentId: number): Promise<void> {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/attachments/${attachmentId}`);
}

// Analytics & payouts. Matches Instructor\AnalyticsController::overview.
export interface AnalyticsOverview {
    published_courses: number;
    total_enrollments: number;
    total_revenue: number | string;
    average_rating: number | string;
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
    const { data } = await client.get('/api/v1/instructor/analytics/overview');
    return data;
}

export interface InstructorPayoutListParams {
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export async function fetchMyPayouts(
    params: InstructorPayoutListParams = {}
): Promise<PaginatedResponse<InstructorPayout>> {
    const { data } = await client.get('/api/v1/instructor/payouts', { params });
    return data;
}

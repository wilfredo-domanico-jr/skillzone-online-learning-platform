import client, { ensureCsrfCookie } from './client';

// Instructor application
export async function applyToTeach(payload) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/instructor-applications', payload);
    return data.data;
}

export async function fetchMyApplication() {
    const { data } = await client.get('/api/v1/instructor-applications/me');
    return data.application;
}

// Courses
export async function fetchMyCourses(params = {}) {
    const { data } = await client.get('/api/v1/instructor/courses', { params });
    return data;
}

export async function createCourse(payload) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/instructor/courses', payload);
    return data.data;
}

export async function updateCourse(courseId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/courses/${courseId}`, payload);
    return data.data;
}

export async function deleteCourse(courseId) {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/courses/${courseId}`);
}

export async function submitCourseForReview(courseId) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/courses/${courseId}/submit-for-review`);
    return data.data;
}

// Sections
export async function createSection(courseId, title) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/courses/${courseId}/sections`, { title });
    return data.data;
}

export async function updateSection(sectionId, title) {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/sections/${sectionId}`, { title });
    return data.data;
}

export async function deleteSection(sectionId) {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/sections/${sectionId}`);
}

export async function reorderSections(courseId, sectionIds) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/courses/${courseId}/sections/reorder`, {
        section_ids: sectionIds,
    });
    return data.data;
}

// Lessons
export async function createLesson(sectionId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/sections/${sectionId}/lessons`, payload);
    return data.data;
}

export async function updateLesson(lessonId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/lessons/${lessonId}`, payload);
    return data.data;
}

export async function deleteLesson(lessonId) {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/lessons/${lessonId}`);
}

export async function reorderLessons(sectionId, lessonIds) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/sections/${sectionId}/lessons/reorder`, {
        lesson_ids: lessonIds,
    });
    return data.data;
}

// Lesson content
export async function uploadLessonVideo(lessonId, file) {
    await ensureCsrfCookie();
    const form = new FormData();
    form.append('video', file);
    const { data } = await client.post(`/api/v1/instructor/lessons/${lessonId}/video`, form);
    return data.data;
}

export async function updateLessonArticle(lessonId, bodyHtml) {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/lessons/${lessonId}/article`, { body_html: bodyHtml });
    return data.data;
}

export async function uploadLessonAttachment(lessonId, file) {
    await ensureCsrfCookie();
    const form = new FormData();
    form.append('file', file);
    const { data } = await client.post(`/api/v1/instructor/lessons/${lessonId}/attachments`, form);
    return data.data;
}

export async function deleteLessonAttachment(attachmentId) {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/attachments/${attachmentId}`);
}

// Analytics & payouts
export async function fetchAnalyticsOverview() {
    const { data } = await client.get('/api/v1/instructor/analytics/overview');
    return data;
}

export async function fetchMyPayouts(params = {}) {
    const { data } = await client.get('/api/v1/instructor/payouts', { params });
    return data;
}

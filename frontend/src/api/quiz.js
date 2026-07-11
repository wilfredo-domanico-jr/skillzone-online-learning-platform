import client, { ensureCsrfCookie } from './client';

// Instructor quiz builder
export async function fetchInstructorQuiz(lessonId) {
    const { data } = await client.get(`/api/v1/instructor/lessons/${lessonId}/quiz`);
    return data.data;
}

export async function saveQuizSettings(lessonId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/lessons/${lessonId}/quiz`, payload);
    return data.data;
}

export async function createQuestion(quizId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/quizzes/${quizId}/questions`, payload);
    return data.data;
}

export async function updateQuestion(questionId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/questions/${questionId}`, payload);
    return data.data;
}

export async function deleteQuestion(questionId) {
    await ensureCsrfCookie();
    const { data } = await client.delete(`/api/v1/instructor/questions/${questionId}`);
    return data.data;
}

// Student quiz-taking
export async function fetchQuizForLesson(lessonId) {
    const { data } = await client.get(`/api/v1/lessons/${lessonId}/quiz`);
    return data;
}

export async function startQuizAttempt(lessonId) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/lessons/${lessonId}/quiz/attempts`);
    return data.data;
}

export async function submitQuizAttempt(attemptId, answers) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/quiz-attempts/${attemptId}/submit`, { answers });
    return data.data;
}

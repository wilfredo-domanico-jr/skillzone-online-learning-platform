import client, { ensureCsrfCookie } from './client';
import type { Quiz, QuizAttempt, QuizQuestion, QuizQuestionType } from '../types/api';

export interface QuizSettingsPayload {
    passing_score_percent: number;
    max_attempts: number | null;
    time_limit_minutes: number | null;
}

export interface QuizQuestionAnswerPayload {
    id?: number;
    answer_text: string;
    is_correct: boolean;
}

export interface QuizQuestionPayload {
    question_text: string;
    type: QuizQuestionType;
    points?: number;
    answers: QuizQuestionAnswerPayload[];
}

// Instructor quiz builder
export async function fetchInstructorQuiz(lessonId: number): Promise<Quiz> {
    const { data } = await client.get(`/api/v1/instructor/lessons/${lessonId}/quiz`);
    return data.data;
}

export async function saveQuizSettings(lessonId: number, payload: QuizSettingsPayload): Promise<Quiz> {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/lessons/${lessonId}/quiz`, payload);
    return data.data;
}

export async function createQuestion(quizId: number, payload: QuizQuestionPayload): Promise<QuizQuestion> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/instructor/quizzes/${quizId}/questions`, payload);
    return data.data;
}

export async function updateQuestion(questionId: number, payload: QuizQuestionPayload): Promise<QuizQuestion> {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/instructor/questions/${questionId}`, payload);
    return data.data;
}

export async function deleteQuestion(questionId: number): Promise<void> {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/instructor/questions/${questionId}`);
}

// Student quiz-taking. Matches QuizAttemptController::show — not JsonResource-wrapped,
// so there's no top-level "data" key.
export interface QuizForLessonResponse {
    quiz: Quiz;
    attempts_used: number;
    attempts_remaining: number | null;
    best_score_percent: number | null;
    passed: boolean;
}

export async function fetchQuizForLesson(lessonId: number): Promise<QuizForLessonResponse> {
    const { data } = await client.get(`/api/v1/lessons/${lessonId}/quiz`);
    return data;
}

export async function startQuizAttempt(lessonId: number): Promise<QuizAttempt> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/lessons/${lessonId}/quiz/attempts`);
    return data.data;
}

export async function submitQuizAttempt(
    attemptId: number,
    answers: Array<{ question_id: number; answer_ids: number[] }>
): Promise<QuizAttempt> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/quiz-attempts/${attemptId}/submit`, { answers });
    return data.data;
}

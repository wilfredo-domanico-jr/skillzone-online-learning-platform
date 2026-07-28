import client, { ensureCsrfCookie } from './client';
import type { PaginatedResponse, Review } from '../types/api';

export interface ReviewPayload {
    rating: number;
    comment?: string;
}

export interface ReviewListParams {
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export async function fetchReviews(
    slug: string,
    params: ReviewListParams = {}
): Promise<PaginatedResponse<Review>> {
    const { data } = await client.get(`/api/v1/courses/${slug}/reviews`, { params });
    return data;
}

export async function createReview(courseId: number, payload: ReviewPayload): Promise<Review> {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/courses/${courseId}/reviews`, payload);
    return data.data;
}

export async function updateReview(reviewId: number, payload: ReviewPayload): Promise<Review> {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/reviews/${reviewId}`, payload);
    return data.data;
}

export async function deleteReview(reviewId: number): Promise<void> {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/reviews/${reviewId}`);
}

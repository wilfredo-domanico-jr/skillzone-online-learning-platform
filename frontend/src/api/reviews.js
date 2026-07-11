import client, { ensureCsrfCookie } from './client';

export async function fetchReviews(slug, params = {}) {
    const { data } = await client.get(`/api/v1/courses/${slug}/reviews`, { params });
    return data;
}

export async function createReview(courseId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.post(`/api/v1/courses/${courseId}/reviews`, payload);
    return data.data;
}

export async function updateReview(reviewId, payload) {
    await ensureCsrfCookie();
    const { data } = await client.put(`/api/v1/reviews/${reviewId}`, payload);
    return data.data;
}

export async function deleteReview(reviewId) {
    await ensureCsrfCookie();
    await client.delete(`/api/v1/reviews/${reviewId}`);
}

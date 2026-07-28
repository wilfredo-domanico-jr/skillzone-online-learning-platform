import client from './client';
import type { Category, Course, PaginatedResponse } from '../types/api';

export interface CourseListParams {
    search?: string;
    category?: string;
    level?: string;
    price?: 'free' | 'paid';
    sort?: 'price_asc' | 'price_desc' | 'rating';
    page?: number;
    [key: string]: unknown;
}

export async function fetchCategories(): Promise<Category[]> {
    const { data } = await client.get('/api/v1/categories');
    return data.data;
}

export async function fetchCourses(
    params: CourseListParams = {}
): Promise<PaginatedResponse<Course>> {
    const { data } = await client.get('/api/v1/courses', { params });
    return data;
}

export async function fetchCourse(slug: string): Promise<Course> {
    const { data } = await client.get(`/api/v1/courses/${slug}`);
    return data.data;
}

export async function fetchCourseCurriculum(slug: string): Promise<Course> {
    const { data } = await client.get(`/api/v1/courses/${slug}/curriculum`);
    return data.data;
}

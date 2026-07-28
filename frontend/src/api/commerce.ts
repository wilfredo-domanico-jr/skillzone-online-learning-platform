import client, { ensureCsrfCookie } from './client';
import type { Cart, Order, PaginatedResponse } from '../types/api';

export interface OrderListParams {
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

export async function fetchCart(): Promise<Cart> {
    const { data } = await client.get('/api/v1/cart');
    return data.data;
}

export async function addToCart(courseId: number): Promise<Cart> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/cart/items', { course_id: courseId });
    return data.data;
}

export async function removeFromCart(courseId: number): Promise<Cart> {
    await ensureCsrfCookie();
    const { data } = await client.delete(`/api/v1/cart/items/${courseId}`);
    return data.data;
}

export interface CouponValidationResponse {
    code: string;
    subtotal: number;
    discount: number;
    total: number;
}

export async function validateCoupon(code: string): Promise<CouponValidationResponse> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/coupons/validate', { code });
    return data;
}

export interface CheckoutSessionResponse {
    checkout_url: string;
    [key: string]: unknown;
}

export async function startCheckout(couponCode?: string): Promise<CheckoutSessionResponse> {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/checkout/session', {
        coupon_code: couponCode || undefined,
    });
    return data;
}

export async function fetchOrders(
    params: OrderListParams = {}
): Promise<PaginatedResponse<Order>> {
    const { data } = await client.get('/api/v1/orders', { params });
    return data;
}

export async function fetchOrder(orderId: number | string): Promise<Order> {
    const { data } = await client.get(`/api/v1/orders/${orderId}`);
    return data.data;
}

import client, { ensureCsrfCookie } from './client';

export async function fetchCart() {
    const { data } = await client.get('/api/v1/cart');
    return data.data;
}

export async function addToCart(courseId) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/cart/items', { course_id: courseId });
    return data.data;
}

export async function removeFromCart(courseId) {
    await ensureCsrfCookie();
    const { data } = await client.delete(`/api/v1/cart/items/${courseId}`);
    return data.data;
}

export async function validateCoupon(code) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/coupons/validate', { code });
    return data;
}

export async function startCheckout(couponCode) {
    await ensureCsrfCookie();
    const { data } = await client.post('/api/v1/checkout/session', {
        coupon_code: couponCode || undefined,
    });
    return data;
}

export async function fetchOrders(params = {}) {
    const { data } = await client.get('/api/v1/orders', { params });
    return data;
}

export async function fetchOrder(orderId) {
    const { data } = await client.get(`/api/v1/orders/${orderId}`);
    return data.data;
}

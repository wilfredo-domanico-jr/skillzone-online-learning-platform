import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCart, removeFromCart, startCheckout, validateCoupon } from '../../api/commerce';
import { generalError } from '../../lib/apiErrors';

export default function CartPage() {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [couponCode, setCouponCode] = useState('');
    const [couponPreview, setCouponPreview] = useState(null);

    const { data: cart, isLoading } = useQuery({ queryKey: ['cart'], queryFn: fetchCart });

    const remove = useMutation({
        mutationFn: removeFromCart,
        onSuccess: (data) => queryClient.setQueryData(['cart'], data),
    });

    const applyCoupon = useMutation({
        mutationFn: validateCoupon,
        onSuccess: (preview) => setCouponPreview(preview),
    });

    const checkout = useMutation({
        mutationFn: () => startCheckout(couponPreview?.code),
        onSuccess: (data) => {
            window.location.href = data.checkout_url;
        },
    });

    if (isLoading) return <p className="text-slate-500">Loading…</p>;

    const isEmpty = !cart || cart.items.length === 0;

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 font-display text-2xl font-semibold text-ink-900">Your Cart</h1>

            {searchParams.get('canceled') && (
                <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    Checkout was canceled — your cart is unchanged.
                </p>
            )}

            {isEmpty ? (
                <p className="text-slate-500">
                    Your cart is empty.{' '}
                    <Link to="/courses" className="font-medium text-brand-600 hover:underline">
                        Browse courses
                    </Link>
                    .
                </p>
            ) : (
                <>
                    <ul className="card divide-y divide-slate-100">
                        {cart.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between px-5 py-4">
                                <span className="text-ink-900">{item.course.title}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-600">${item.course.price.toFixed(2)}</span>
                                    <button
                                        type="button"
                                        onClick={() => remove.mutate(item.course.id)}
                                        className="text-sm font-medium text-red-600 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 flex gap-2">
                        <input
                            type="text"
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="input flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => applyCoupon.mutate(couponCode)}
                            disabled={!couponCode || applyCoupon.isPending}
                            className="btn-outline"
                        >
                            Apply
                        </button>
                    </div>
                    {applyCoupon.isError && (
                        <p className="mt-1 text-sm text-red-600">{generalError(applyCoupon.error)}</p>
                    )}

                    <div className="card mt-6 p-5">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span>${(couponPreview?.subtotal ?? cart.subtotal).toFixed(2)}</span>
                        </div>
                        {couponPreview && (
                            <div className="flex justify-between text-sm text-brand-700">
                                <span>Discount ({couponPreview.code})</span>
                                <span>-${couponPreview.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-semibold text-ink-900">
                            <span>Total</span>
                            <span>${(couponPreview?.total ?? cart.subtotal).toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => checkout.mutate()}
                        disabled={checkout.isPending}
                        className="btn-primary mt-4 w-full"
                    >
                        Checkout
                    </button>
                    {checkout.isError && <p className="mt-2 text-sm text-red-600">{generalError(checkout.error)}</p>}
                </>
            )}
        </div>
    );
}

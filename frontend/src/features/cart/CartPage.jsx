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

    if (isLoading) return <p className="text-gray-500">Loading…</p>;

    const isEmpty = !cart || cart.items.length === 0;

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-xl font-semibold text-gray-900">Your Cart</h1>

            {searchParams.get('canceled') && (
                <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
                    Checkout was canceled — your cart is unchanged.
                </p>
            )}

            {isEmpty ? (
                <p className="text-gray-500">
                    Your cart is empty. <Link to="/courses" className="underline">Browse courses</Link>.
                </p>
            ) : (
                <>
                    <ul className="divide-y rounded border bg-white">
                        {cart.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between px-4 py-3">
                                <span className="text-gray-900">{item.course.title}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-700">${item.course.price.toFixed(2)}</span>
                                    <button
                                        type="button"
                                        onClick={() => remove.mutate(item.course.id)}
                                        className="text-sm text-red-600 hover:underline"
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
                            className="flex-1 rounded border-gray-300 shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={() => applyCoupon.mutate(couponCode)}
                            disabled={!couponCode || applyCoupon.isPending}
                            className="rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            Apply
                        </button>
                    </div>
                    {applyCoupon.isError && (
                        <p className="mt-1 text-sm text-red-600">{generalError(applyCoupon.error)}</p>
                    )}

                    <div className="mt-6 rounded border bg-white p-4">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>${(couponPreview?.subtotal ?? cart.subtotal).toFixed(2)}</span>
                        </div>
                        {couponPreview && (
                            <div className="flex justify-between text-sm text-green-700">
                                <span>Discount ({couponPreview.code})</span>
                                <span>-${couponPreview.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="mt-2 flex justify-between border-t pt-2 font-semibold text-gray-900">
                            <span>Total</span>
                            <span>${(couponPreview?.total ?? cart.subtotal).toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => checkout.mutate()}
                        disabled={checkout.isPending}
                        className="mt-4 w-full rounded bg-gray-900 py-2 text-white disabled:opacity-50"
                    >
                        Checkout
                    </button>
                    {checkout.isError && <p className="mt-2 text-sm text-red-600">{generalError(checkout.error)}</p>}
                </>
            )}
        </div>
    );
}

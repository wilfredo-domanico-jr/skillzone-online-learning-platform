import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchOrder } from '../../api/commerce';

export default function OrderDetailPage() {
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useQuery({
        queryKey: ['orders', orderId],
        queryFn: () => fetchOrder(orderId),
        // The webhook may not have processed yet when the success redirect
        // lands — poll briefly until the order flips to paid.
        refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
    });

    if (isLoading) return <p className="text-gray-500">Loading…</p>;
    if (!order) return <p className="text-gray-500">Order not found.</p>;

    return (
        <div className="max-w-xl">
            {searchParams.get('success') && order.status === 'paid' && (
                <p className="mb-4 rounded bg-green-50 p-3 text-sm text-green-800">
                    Payment successful! You're enrolled — check{' '}
                    <Link to="/my-learning" className="underline" onClick={() => queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })}>
                        My Learning
                    </Link>.
                </p>
            )}
            {searchParams.get('success') && order.status === 'pending' && (
                <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
                    Confirming your payment with Stripe — this updates automatically.
                </p>
            )}

            <h1 className="mb-4 text-xl font-semibold text-gray-900">Order #{order.id}</h1>

            <ul className="divide-y rounded border bg-white">
                {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between px-4 py-3">
                        <Link to={`/courses/${item.course.slug}`} className="text-gray-900 hover:underline">
                            {item.course.title}
                        </Link>
                        <span className="text-gray-700">${item.price_at_purchase.toFixed(2)}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-4 rounded border bg-white p-4 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount_total > 0 && (
                    <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span>-${order.discount_total.toFixed(2)}</span>
                    </div>
                )}
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}

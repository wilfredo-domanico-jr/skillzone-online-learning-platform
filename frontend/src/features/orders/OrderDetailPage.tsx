import { useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Skeleton from '../../components/Skeleton';
import { fetchOrder } from '../../api/commerce';
import { ORDER_POLL_INTERVAL_MS } from '../../lib/constants';
import { formatPrice } from '../../lib/formatPrice';
import type { Order } from '../../types/api';

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useQuery({
        queryKey: ['orders', orderId],
        queryFn: () => fetchOrder(orderId as string),
        // The webhook may not have processed yet when the success redirect
        // lands — poll briefly until the order flips to paid.
        refetchInterval: (query: Query<Order, Error, Order>) =>
            query.state.data?.status === 'pending' ? ORDER_POLL_INTERVAL_MS : false,
    });

    if (isLoading) {
        return (
            <div className="max-w-xl space-y-4">
                <Skeleton className="h-7 w-40" />
                <div className="card divide-y divide-slate-100">
                    {Array.from({ length: 2 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-4">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
                <div className="card space-y-2 p-5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        );
    }
    if (!order) return <p className="text-slate-500">Order not found.</p>;

    return (
        <div className="max-w-xl">
            {searchParams.get('success') && order.status === 'paid' && (
                <div className="card mb-4 border-brand-300/60 bg-brand-50 p-4 text-sm text-brand-800">
                    Payment successful! You're enrolled — check{' '}
                    <Link
                        to="/my-learning"
                        className="font-semibold underline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })}
                    >
                        My Learning
                    </Link>
                    .
                </div>
            )}
            {searchParams.get('success') && order.status === 'pending' && (
                <div className="card mb-4 border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-800">
                    Confirming your payment with Stripe — this updates automatically.
                </div>
            )}

            <h1 className="mb-4 font-display text-2xl font-semibold text-ink-900">Order #{order.id}</h1>

            <ul className="card divide-y divide-slate-100">
                {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between px-5 py-4">
                        <Link
                            to={`/courses/${item.course.slug}`}
                            className="text-ink-900 hover:text-brand-700 hover:underline"
                        >
                            {item.course.title}
                        </Link>
                        <span className="text-slate-600">{formatPrice(item.price_at_purchase)}</span>
                    </li>
                ))}
            </ul>

            <div className="card mt-4 p-5 text-sm">
                <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                </div>
                {Number(order.discount_total) > 0 && (
                    <div className="flex justify-between text-brand-700">
                        <span>Discount</span>
                        <span>-{formatPrice(order.discount_total)}</span>
                    </div>
                )}
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-semibold text-ink-900">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                </div>
            </div>
        </div>
    );
}

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import { fetchOrders } from '../../api/commerce';
import { formatPrice } from '../../lib/formatPrice';
import type { OrderStatus } from '../../types/api';

const STATUS_STYLES: Record<OrderStatus, string> = {
    pending: 'badge-amber',
    paid: 'badge-brand',
    failed: 'badge bg-red-100 text-red-700',
    refunded: 'badge-slate',
};

export default function OrdersPage() {
    const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => fetchOrders() });

    return (
        <div>
            <h1 className="mb-6 font-display text-2xl font-semibold text-ink-900">Order History</h1>

            {isLoading && <Loading />}
            {data && data.data.length === 0 && <p className="text-slate-500">No orders yet.</p>}

            <ul className="space-y-3">
                {data?.data.map((order) => (
                    <li key={order.id}>
                        <Link
                            to={`/orders/${order.id}`}
                            className="card card-hover flex items-center justify-between px-5 py-4"
                        >
                            <div>
                                <p className="text-sm font-semibold text-ink-900">Order #{order.id}</p>
                                <p className="text-xs text-slate-500">
                                    {order.items.map((i) => i.course.title).join(', ')}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-600">{formatPrice(order.total)}</span>
                                <span className={STATUS_STYLES[order.status]}>{order.status}</span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

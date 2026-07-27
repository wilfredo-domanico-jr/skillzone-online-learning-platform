import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../api/commerce';

const STATUS_STYLES = {
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

            {isLoading && <p className="text-slate-500">Loading…</p>}
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
                                <span className="text-sm text-slate-600">${order.total.toFixed(2)}</span>
                                <span className={STATUS_STYLES[order.status]}>{order.status}</span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

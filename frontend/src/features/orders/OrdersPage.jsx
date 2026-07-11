import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../api/commerce';

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-700',
};

export default function OrdersPage() {
    const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => fetchOrders() });

    return (
        <div>
            <h1 className="mb-6 text-xl font-semibold text-gray-900">Order History</h1>

            {isLoading && <p className="text-gray-500">Loading…</p>}
            {data && data.data.length === 0 && <p className="text-gray-500">No orders yet.</p>}

            <ul className="divide-y rounded border bg-white">
                {data?.data.map((order) => (
                    <li key={order.id}>
                        <Link to={`/orders/${order.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                            <div>
                                <p className="text-sm text-gray-900">Order #{order.id}</p>
                                <p className="text-xs text-gray-500">
                                    {order.items.map((i) => i.course.title).join(', ')}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700">${order.total.toFixed(2)}</span>
                                <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                                    {order.status}
                                </span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

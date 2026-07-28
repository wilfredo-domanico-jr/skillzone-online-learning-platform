import type { PayoutStatus } from '../types/api';

export const PAYOUT_STATUS_STYLES: Record<PayoutStatus, string> = {
    pending: 'badge-amber',
    processing: 'badge bg-sky-100 text-sky-700',
    paid: 'badge-brand',
};

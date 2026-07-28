import type { PaginationMeta } from '../types/api';

interface PaginationProps {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
    if (meta.last_page <= 1) return null;

    return (
        <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-500">
            <span>
                Page {meta.current_page} of {meta.last_page} · {meta.total} total
            </span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(meta.current_page - 1)}
                    disabled={meta.current_page <= 1}
                    className="btn-outline !px-3 !py-1.5 !text-xs disabled:opacity-30"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(meta.current_page + 1)}
                    disabled={meta.current_page >= meta.last_page}
                    className="btn-outline !px-3 !py-1.5 !text-xs disabled:opacity-30"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

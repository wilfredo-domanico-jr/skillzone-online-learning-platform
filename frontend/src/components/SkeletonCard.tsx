import Skeleton from './Skeleton';

// Matches the shape of the course-card grid used on the catalog and
// my-learning pages (thumbnail + title + subtitle + footer row).
export default function SkeletonCard() {
    return (
        <div className="card overflow-hidden">
            <Skeleton className="aspect-video w-full !rounded-none" />
            <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>
        </div>
    );
}

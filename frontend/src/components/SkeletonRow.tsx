import Skeleton from './Skeleton';

// Matches the shape of a simple list row used across orders, users,
// payouts, and moderation-queue style lists (a couple of text lines on the
// left, an action/status placeholder on the right).
export default function SkeletonRow() {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-20 shrink-0" />
        </div>
    );
}

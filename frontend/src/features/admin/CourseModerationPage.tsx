import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ModerationQueue from '../../components/ModerationQueue';
import { approveCourse, fetchCoursesForModeration, rejectCourse } from '../../api/admin';

export default function CourseModerationPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'courses', 'pending_review'],
        queryFn: () => fetchCoursesForModeration({ status: 'pending_review' }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    const approve = useMutation({ mutationFn: approveCourse, onSuccess: invalidate });
    const reject = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectCourse(id, reason),
        onSuccess: invalidate,
    });

    return (
        <ModerationQueue
            eyebrow="Admin"
            title="Course Moderation Queue"
            description="Review courses submitted by instructors for publication."
            items={data?.data}
            isLoading={isLoading}
            emptyMessage="Nothing awaiting review."
            onApprove={(id) => approve.mutate(id)}
            onReject={(id, reason) => reject.mutate({ id, reason })}
            renderHeader={(course) => (
                <div>
                    <Link
                        to={`/courses/${course.slug}`}
                        className="font-display font-semibold text-ink-900 hover:text-brand-700"
                    >
                        {course.title}
                    </Link>
                    <p className="text-sm text-slate-500">by {course.instructor?.name}</p>
                </div>
            )}
            renderDetails={(course) =>
                course.subtitle ? <p className="mt-2 text-sm text-slate-600">{course.subtitle}</p> : null
            }
        />
    );
}

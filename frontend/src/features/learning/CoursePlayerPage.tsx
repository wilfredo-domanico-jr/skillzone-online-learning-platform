import { useEffect, useMemo, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import Skeleton from '../../components/Skeleton';
import { completeLesson, fetchLearnCurriculum, saveLessonProgress } from '../../api/learning';
import type { LearnCurriculum } from '../../api/learning';
import { VIDEO_PROGRESS_SAVE_INTERVAL_SECONDS } from '../../lib/constants';
import QuizPlayer from './QuizPlayer';
import type { Lesson } from '../../types/api';

export default function CoursePlayerPage() {
    const { slug } = useParams<{ slug: string }>();
    const queryClient = useQueryClient();
    const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

    const { data, isLoading } = useQuery<LearnCurriculum>({
        queryKey: ['courses', slug, 'curriculum'],
        queryFn: () => fetchLearnCurriculum(slug!),
    });

    // The curriculum endpoint always returns `sections` for a course being
    // played (an empty array at worst) — treated as always-present here.
    const sections = useMemo(() => data?.course.sections ?? [], [data]);
    const allLessons = useMemo(() => sections.flatMap((s) => s.lessons), [sections]);

    useEffect(() => {
        if (!activeLessonId && allLessons.length > 0) {
            const firstIncomplete = allLessons.find((l) => !l.completed) ?? allLessons[0];
            setActiveLessonId(firstIncomplete.id);
        }
    }, [allLessons, activeLessonId]);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['courses', slug, 'curriculum'] });
    const complete = useMutation({ mutationFn: completeLesson, onSuccess: invalidate });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <aside className="card overflow-hidden lg:col-span-1">
                    <div className="space-y-2 border-b border-slate-100 px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                    <div className="space-y-3 p-3">
                        {Array.from({ length: 5 }, (_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                </aside>
                <div className="card space-y-4 p-6 lg:col-span-3">
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        );
    }
    if (!data?.enrollment) {
        return <Navigate to={`/courses/${slug}`} replace />;
    }

    const activeLesson = allLessons.find((l) => l.id === activeLessonId);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <aside className="card overflow-hidden lg:col-span-1">
                <div className="border-b border-slate-100 px-4 py-3">
                    <Link
                        to={`/courses/${slug}`}
                        className="text-sm text-slate-500 hover:text-brand-700 hover:underline"
                    >
                        ← {data.course.title}
                    </Link>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                        <div
                            className="h-2 rounded-full bg-brand-500"
                            style={{ width: `${data.enrollment.progress_percent}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{data.enrollment.progress_percent}% complete</p>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                    {sections.map((section) => (
                        <div key={section.id}>
                            <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-ink-900">
                                {section.title}
                            </div>
                            <ul>
                                {section.lessons.map((lesson) => (
                                    <li key={lesson.id}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveLessonId(lesson.id)}
                                            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-brand-50 ${
                                                lesson.id === activeLessonId
                                                    ? 'bg-brand-50 font-medium text-brand-700'
                                                    : 'text-slate-600'
                                            }`}
                                        >
                                            <span className={lesson.completed ? 'text-brand-500' : 'text-slate-300'}>
                                                {lesson.completed ? '✓' : '○'}
                                            </span>
                                            <span>{lesson.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="card p-6 lg:col-span-3">
                {activeLesson ? (
                    <LessonContent
                        key={activeLesson.id}
                        lesson={activeLesson}
                        onComplete={() => complete.mutate(activeLesson.id)}
                        isCompleting={complete.isPending}
                        onQuizPassed={invalidate}
                    />
                ) : (
                    <p className="text-slate-500">This course has no lessons yet.</p>
                )}
            </main>
        </div>
    );
}

interface LessonContentProps {
    lesson: Lesson;
    onComplete: () => void;
    isCompleting: boolean;
    onQuizPassed: () => void;
}

function LessonContent({ lesson, onComplete, isCompleting, onQuizPassed }: LessonContentProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const lastSavedRef = useRef(0);

    const handleTimeUpdate = (e: SyntheticEvent<HTMLVideoElement>) => {
        const t = e.currentTarget.currentTime;
        if (t - lastSavedRef.current > VIDEO_PROGRESS_SAVE_INTERVAL_SECONDS) {
            lastSavedRef.current = t;
            saveLessonProgress(lesson.id, t);
        }
    };

    useEffect(() => {
        if (videoRef.current && lesson.last_position_seconds) {
            videoRef.current.currentTime = lesson.last_position_seconds;
        }
    }, [lesson.id, lesson.last_position_seconds]);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="font-display text-xl font-semibold text-ink-900">{lesson.title}</h1>
                {lesson.type !== 'quiz' && !lesson.completed && (
                    <button type="button" onClick={onComplete} disabled={isCompleting} className="btn-primary">
                        Mark complete
                    </button>
                )}
                {lesson.completed && <span className="badge-brand">✓ Completed</span>}
            </div>

            {lesson.locked && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    This lesson's content isn't available. Try refreshing — your enrollment may not have loaded yet.
                </p>
            )}

            {lesson.type === 'video' && lesson.video && (
                <video
                    ref={videoRef}
                    src={lesson.video.url}
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={onComplete}
                    className="w-full rounded-xl"
                />
            )}

            {lesson.type === 'article' && lesson.article && (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.article.body_html }} />
            )}

            {lesson.type === 'quiz' && <QuizPlayer lessonId={lesson.id} onPassed={onQuizPassed} />}

            {(lesson.attachments?.length ?? 0) > 0 && (
                <div className="mt-6">
                    <h2 className="mb-2 text-sm font-semibold text-ink-900">Resources</h2>
                    <ul className="space-y-1">
                        {lesson.attachments!.map((a) => (
                            <li key={a.id}>
                                <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-medium text-brand-600 hover:underline"
                                >
                                    📎 {a.file_name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

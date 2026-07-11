import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { completeLesson, fetchLearnCurriculum, saveLessonProgress } from '../../api/learning';
import QuizPlayer from './QuizPlayer';

export default function CoursePlayerPage() {
    const { slug } = useParams();
    const queryClient = useQueryClient();
    const [activeLessonId, setActiveLessonId] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['courses', slug, 'curriculum'],
        queryFn: () => fetchLearnCurriculum(slug),
    });

    const allLessons = useMemo(
        () => data?.course.sections.flatMap((s) => s.lessons) ?? [],
        [data]
    );

    useEffect(() => {
        if (!activeLessonId && allLessons.length > 0) {
            const firstIncomplete = allLessons.find((l) => !l.completed) ?? allLessons[0];
            setActiveLessonId(firstIncomplete.id);
        }
    }, [allLessons, activeLessonId]);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['courses', slug, 'curriculum'] });
    const complete = useMutation({ mutationFn: completeLesson, onSuccess: invalidate });

    if (isLoading) return <p className="text-gray-500">Loading…</p>;
    if (!data?.enrollment) {
        return <Navigate to={`/courses/${slug}`} replace />;
    }

    const activeLesson = allLessons.find((l) => l.id === activeLessonId);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <aside className="rounded border bg-white lg:col-span-1">
                <div className="border-b px-4 py-3">
                    <Link to={`/courses/${slug}`} className="text-sm text-gray-500 hover:underline">
                        ← {data.course.title}
                    </Link>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                        <div
                            className="h-2 rounded-full bg-gray-900"
                            style={{ width: `${data.enrollment.progress_percent}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{data.enrollment.progress_percent}% complete</p>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                    {data.course.sections.map((section) => (
                        <div key={section.id}>
                            <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                                {section.title}
                            </div>
                            <ul>
                                {section.lessons.map((lesson) => (
                                    <li key={lesson.id}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveLessonId(lesson.id)}
                                            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                                                lesson.id === activeLessonId ? 'bg-gray-100 font-medium' : ''
                                            }`}
                                        >
                                            <span>{lesson.completed ? '✅' : '⬜'}</span>
                                            <span className="text-gray-700">{lesson.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="rounded border bg-white p-6 lg:col-span-3">
                {activeLesson ? (
                    <LessonContent
                        key={activeLesson.id}
                        lesson={activeLesson}
                        onComplete={() => complete.mutate(activeLesson.id)}
                        isCompleting={complete.isPending}
                        onQuizPassed={invalidate}
                    />
                ) : (
                    <p className="text-gray-500">This course has no lessons yet.</p>
                )}
            </main>
        </div>
    );
}

function LessonContent({ lesson, onComplete, isCompleting, onQuizPassed }) {
    const videoRef = useRef(null);
    const lastSavedRef = useRef(0);

    const handleTimeUpdate = (e) => {
        const t = e.target.currentTime;
        if (t - lastSavedRef.current > 5) {
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
                <h1 className="text-xl font-semibold text-gray-900">{lesson.title}</h1>
                {lesson.type !== 'quiz' && !lesson.completed && (
                    <button
                        type="button"
                        onClick={onComplete}
                        disabled={isCompleting}
                        className="rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                        Mark complete
                    </button>
                )}
                {lesson.completed && <span className="text-sm text-green-600">✅ Completed</span>}
            </div>

            {lesson.locked && (
                <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
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
                    className="w-full rounded"
                />
            )}

            {lesson.type === 'article' && lesson.article && (
                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: lesson.article.body_html }}
                />
            )}

            {lesson.type === 'quiz' && <QuizPlayer lessonId={lesson.id} onPassed={onQuizPassed} />}

            {lesson.attachments?.length > 0 && (
                <div className="mt-6">
                    <h2 className="mb-2 text-sm font-medium text-gray-900">Resources</h2>
                    <ul className="space-y-1">
                        {lesson.attachments.map((a) => (
                            <li key={a.id}>
                                <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
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

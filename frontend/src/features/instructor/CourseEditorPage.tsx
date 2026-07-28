import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import FileButton from '../../components/FileButton';
import Select from '../../components/Select';
import Skeleton from '../../components/Skeleton';
import { fetchCourseCurriculum } from '../../api/catalog';
import {
    createLesson,
    createSection,
    deleteLesson,
    deleteSection,
    reorderLessons,
    reorderSections,
    submitCourseForReview,
    updateCourse,
    updateLesson,
    updateLessonArticle,
    uploadCourseThumbnail,
    uploadLessonVideo,
} from '../../api/instructor';
import type { CreateLessonPayload } from '../../api/instructor';
import { fetchMyCourses } from '../../api/instructor';
import { generalError } from '../../lib/apiErrors';
import { formatSnakeCase } from '../../lib/formatSnakeCase';
import { swapPosition } from '../../lib/reorder';
import type { CourseSection, Lesson, LessonType } from '../../types/api';
import QuizBuilder from './QuizBuilder';

interface CourseDetailsForm {
    title: string;
    subtitle: string;
    description: string;
    price: number | string;
}

function useCourse(courseId: string) {
    // The instructor courses list endpoint is the simplest way to get a
    // single owned course with full field access (including draft/rejected).
    return useQuery({
        queryKey: ['instructor', 'courses', 'all'],
        queryFn: () => fetchMyCourses({ per_page: 100 }),
        select: (data) => data.data.find((c) => String(c.id) === courseId),
    });
}

export default function CourseEditorPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const numericCourseId = Number(courseId);
    const queryClient = useQueryClient();
    const { data: course } = useCourse(courseId ?? '');

    const { data: curriculum, refetch: refetchCurriculum } = useQuery({
        queryKey: ['instructor', 'courses', courseId, 'curriculum'],
        queryFn: () => fetchCourseCurriculum(course!.slug),
        enabled: !!course,
    });

    // The curriculum endpoint always returns `sections` for a course the
    // instructor owns (an empty array at worst) — treated as always-present.
    const sections = curriculum?.sections ?? [];

    const [details, setDetails] = useState<CourseDetailsForm | null>(null);
    useEffect(() => {
        if (course) {
            setDetails({
                title: course.title,
                subtitle: course.subtitle ?? '',
                description: course.description ?? '',
                price: course.price,
            });
        }
    }, [course]);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
        refetchCurriculum();
    };

    const saveDetails = useMutation({
        mutationFn: () => updateCourse(numericCourseId, details!),
        onSuccess: invalidate,
    });

    const uploadThumbnail = useMutation({
        mutationFn: (file: File) => uploadCourseThumbnail(numericCourseId, file),
        onSuccess: invalidate,
    });

    const submitForReview = useMutation({
        mutationFn: () => submitCourseForReview(numericCourseId),
        onSuccess: invalidate,
    });

    const addSection = useMutation({
        mutationFn: (title: string) => createSection(numericCourseId, title),
        onSuccess: invalidate,
    });

    if (!course || !details) {
        return (
            <div className="max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <Skeleton className="h-7 w-64" />
                    <Skeleton className="h-6 w-20" />
                </div>
                <div className="card mb-8 space-y-3 p-5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 2 }, (_, i) => (
                        <div key={i} className="card overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="space-y-3 p-3">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <div className="mb-6 flex items-center justify-between gap-3">
                <h1 className="font-display text-xl font-semibold text-ink-900">{course.title}</h1>
                <div className="flex shrink-0 items-center gap-2">
                    <span className="badge-slate">{formatSnakeCase(course.status)}</span>
                    {['draft', 'rejected'].includes(course.status) && (
                        <button
                            type="button"
                            onClick={() => submitForReview.mutate()}
                            disabled={submitForReview.isPending}
                            className="btn-dark !px-3 !py-1.5 !text-sm"
                        >
                            Submit for review
                        </button>
                    )}
                </div>
            </div>
            {submitForReview.isError && (
                <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {generalError(submitForReview.error)}
                </p>
            )}
            {course.status === 'rejected' && course.rejection_reason && (
                <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    Rejected: {course.rejection_reason}
                </p>
            )}

            <section className="card mb-8 p-5">
                <h2 className="mb-3 font-display font-semibold text-ink-900">Details</h2>
                <div className="space-y-3">
                    <div>
                        <label className="label">Thumbnail</label>
                        <div className="flex items-center gap-4">
                            {course.thumbnail_url ? (
                                <img
                                    src={course.thumbnail_url}
                                    alt=""
                                    className="aspect-video w-40 shrink-0 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex aspect-video w-40 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                    No image
                                </div>
                            )}
                            <div>
                                <FileButton
                                    label={course.thumbnail_url ? 'Replace image' : 'Upload image'}
                                    accept="image/jpeg,image/png,image/webp"
                                    disabled={uploadThumbnail.isPending}
                                    onSelect={(file) => uploadThumbnail.mutate(file)}
                                />
                                <p className="mt-1 text-xs text-slate-400">JPG, PNG, or WEBP. Up to 5MB.</p>
                                {uploadThumbnail.isPending && (
                                    <p className="mt-1 text-xs text-slate-500">Uploading…</p>
                                )}
                                {uploadThumbnail.isError && (
                                    <p className="mt-1 text-xs text-red-600">{generalError(uploadThumbnail.error)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="label">Title</label>
                        <input
                            className="input"
                            value={details.title}
                            onChange={(e) => setDetails({ ...details, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Subtitle</label>
                        <input
                            className="input"
                            value={details.subtitle}
                            onChange={(e) => setDetails({ ...details, subtitle: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea
                            rows={4}
                            className="input"
                            value={details.description}
                            onChange={(e) => setDetails({ ...details, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Price (USD)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-40"
                            value={details.price}
                            onChange={(e) => setDetails({ ...details, price: e.target.value })}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => saveDetails.mutate()}
                        disabled={saveDetails.isPending}
                        className="btn-primary !text-sm"
                    >
                        Save details
                    </button>
                </div>
            </section>

            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display font-semibold text-ink-900">Curriculum</h2>
                </div>

                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <SectionEditor
                            key={section.id}
                            section={section}
                            isFirst={index === 0}
                            isLast={index === sections.length - 1}
                            allSectionIds={sections.map((s) => s.id)}
                            courseId={numericCourseId}
                            onChange={invalidate}
                        />
                    ))}
                </div>

                <form
                    onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const title = (form.elements.namedItem('sectionTitle') as HTMLInputElement).value.trim();
                        if (title) {
                            addSection.mutate(title);
                            form.reset();
                        }
                    }}
                    className="card mt-4 flex gap-2 p-3"
                >
                    <input name="sectionTitle" placeholder="New section title…" className="input flex-1" />
                    <button type="submit" className="btn-outline !text-sm">
                        Add section
                    </button>
                </form>
            </section>
        </div>
    );
}

interface SectionEditorProps {
    section: CourseSection;
    isFirst: boolean;
    isLast: boolean;
    allSectionIds: number[];
    courseId: number;
    onChange: () => void;
}

function SectionEditor({ section, isFirst, isLast, allSectionIds, courseId, onChange }: SectionEditorProps) {
    const [lessonType, setLessonType] = useState<LessonType>('article');

    const move = useMutation({
        mutationFn: (ids: number[]) => reorderSections(courseId, ids),
        onSuccess: onChange,
    });
    const remove = useMutation({
        mutationFn: () => deleteSection(section.id),
        onSuccess: onChange,
    });
    const addLesson = useMutation({
        mutationFn: (payload: CreateLessonPayload) => createLesson(section.id, payload),
        onSuccess: onChange,
    });

    const moveSection = (direction: number) => {
        const ids = swapPosition(allSectionIds, section.id, direction);
        if (ids) move.mutate(ids);
    };

    return (
        <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <span className="font-display font-semibold text-ink-900">{section.title}</span>
                <div className="flex items-center gap-1 text-sm">
                    <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveSection(-1)}
                        className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveSection(1)}
                        className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        onClick={() => remove.mutate()}
                        className="ml-2 font-medium text-red-600 hover:underline"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <ul className="divide-y divide-slate-100">
                {section.lessons.map((lesson, index) => (
                    <LessonEditor
                        key={lesson.id}
                        lesson={lesson}
                        isFirst={index === 0}
                        isLast={index === section.lessons.length - 1}
                        allLessonIds={section.lessons.map((l) => l.id)}
                        sectionId={section.id}
                        onChange={onChange}
                    />
                ))}
            </ul>

            <form
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const title = (form.elements.namedItem('lessonTitle') as HTMLInputElement).value.trim();
                    if (title) {
                        addLesson.mutate({ title, type: lessonType });
                        form.reset();
                        setLessonType('article');
                    }
                }}
                className="flex gap-2 p-3"
            >
                <input name="lessonTitle" placeholder="New lesson title…" className="input flex-1 !text-sm" />
                <Select
                    value={lessonType}
                    onChange={setLessonType}
                    className="w-auto !text-sm"
                    options={[
                        { value: 'article', label: 'Article' },
                        { value: 'video', label: 'Video' },
                        { value: 'resource', label: 'Resource' },
                        { value: 'quiz', label: 'Quiz' },
                    ]}
                />
                <button type="submit" className="btn-outline !text-sm">
                    Add lesson
                </button>
            </form>
        </div>
    );
}

interface LessonEditorProps {
    lesson: Lesson;
    isFirst: boolean;
    isLast: boolean;
    allLessonIds: number[];
    sectionId: number;
    onChange: () => void;
}

function LessonEditor({ lesson, isFirst, isLast, allLessonIds, sectionId, onChange }: LessonEditorProps) {
    const [expanded, setExpanded] = useState(false);
    const [articleBody, setArticleBody] = useState(lesson.article?.body_html ?? '');

    const move = useMutation({
        mutationFn: (ids: number[]) => reorderLessons(sectionId, ids),
        onSuccess: onChange,
    });
    const remove = useMutation({
        mutationFn: () => deleteLesson(lesson.id),
        onSuccess: onChange,
    });
    const togglePreview = useMutation({
        mutationFn: () => updateLesson(lesson.id, { title: lesson.title, is_previewable: !lesson.is_previewable }),
        onSuccess: onChange,
    });
    const saveArticle = useMutation({
        mutationFn: () => updateLessonArticle(lesson.id, articleBody),
        onSuccess: onChange,
    });
    const uploadVideo = useMutation({
        mutationFn: (file: File) => uploadLessonVideo(lesson.id, file),
        onSuccess: onChange,
    });

    const moveLesson = (direction: number) => {
        const ids = swapPosition(allLessonIds, lesson.id, direction);
        if (ids) move.mutate(ids);
    };

    return (
        <li className="p-3">
            <div className="flex items-center justify-between text-sm">
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="text-left font-medium text-ink-800 hover:text-brand-700"
                >
                    {lesson.title} <span className="font-normal text-slate-400">({lesson.type})</span>
                </button>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                        <input
                            type="checkbox"
                            checked={lesson.is_previewable}
                            onChange={() => togglePreview.mutate()}
                            className="accent-brand-500"
                        />
                        Free preview
                    </label>
                    <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveLesson(-1)}
                        className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveLesson(1)}
                        className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        onClick={() => remove.mutate()}
                        className="font-medium text-red-600 hover:underline"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="mt-2 rounded-xl bg-slate-50 p-3">
                    {lesson.type === 'article' && (
                        <div>
                            <textarea
                                rows={4}
                                className="input !text-sm"
                                value={articleBody}
                                onChange={(e) => setArticleBody(e.target.value)}
                                placeholder="Lesson body (HTML)…"
                            />
                            <button
                                type="button"
                                onClick={() => saveArticle.mutate()}
                                disabled={saveArticle.isPending}
                                className="btn-dark mt-2 !px-3 !py-1.5 !text-xs"
                            >
                                Save content
                            </button>
                        </div>
                    )}
                    {lesson.type === 'video' && (
                        <div>
                            {lesson.video && (
                                <video src={lesson.video.url} controls className="mb-2 max-h-48 w-full rounded-xl" />
                            )}
                            <FileButton
                                label={lesson.video ? 'Replace video' : 'Upload video'}
                                accept="video/*"
                                disabled={uploadVideo.isPending}
                                onSelect={(file) => uploadVideo.mutate(file)}
                            />
                            {uploadVideo.isPending && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
                        </div>
                    )}
                    {lesson.type === 'resource' && (
                        <p className="text-xs text-slate-500">
                            Attach downloadable files to this lesson (attachments API already supports this; UI coming
                            soon).
                        </p>
                    )}
                    {lesson.type === 'quiz' && <QuizBuilder lessonId={lesson.id} />}
                </div>
            )}
        </li>
    );
}

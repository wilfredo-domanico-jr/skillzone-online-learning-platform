import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createQuestion,
    deleteQuestion,
    fetchInstructorQuiz,
    saveQuizSettings,
    updateQuestion,
} from '../../api/quiz';
import type { QuizQuestionPayload } from '../../api/quiz';
import { DEFAULT_PASSING_SCORE_PERCENT } from '../../lib/constants';
import type { QuizQuestion, QuizQuestionType } from '../../types/api';

// Local draft type for the answer-editing form only: a newly-added option
// has no `id` yet (unlike the canonical QuizAnswer, which always comes from
// a saved API response).
type QuizAnswerDraft = QuizQuestionPayload['answers'][number];

interface QuizSettingsForm {
    passing_score_percent: number | string;
    max_attempts: number | string;
    time_limit_minutes: number | string;
}

interface QuizBuilderProps {
    lessonId: number;
}

const quizQueryKey = (lessonId: number) => ['instructor', 'lessons', lessonId, 'quiz'] as const;

export default function QuizBuilder({ lessonId }: QuizBuilderProps) {
    const queryClient = useQueryClient();
    const { data: quiz, isLoading } = useQuery({
        queryKey: quizQueryKey(lessonId),
        queryFn: () => fetchInstructorQuiz(lessonId),
    });

    const questions = quiz?.questions ?? [];

    // Question mutations resolve to a single QuizQuestion (or void, for
    // delete) — not the full Quiz — so they must refetch rather than
    // overwrite the cached quiz with a mismatched shape.
    const invalidateQuiz = () =>
        queryClient.invalidateQueries({ queryKey: quizQueryKey(lessonId) });

    const [settings, setSettings] = useState<QuizSettingsForm | null>(null);
    const activeSettings: QuizSettingsForm = settings ?? {
        passing_score_percent: quiz?.passing_score_percent ?? DEFAULT_PASSING_SCORE_PERCENT,
        max_attempts: quiz?.max_attempts ?? '',
        time_limit_minutes: quiz?.time_limit_minutes ?? '',
    };

    const saveSettings = useMutation({
        mutationFn: () =>
            saveQuizSettings(lessonId, {
                passing_score_percent: Number(activeSettings.passing_score_percent) || DEFAULT_PASSING_SCORE_PERCENT,
                max_attempts: activeSettings.max_attempts ? Number(activeSettings.max_attempts) : null,
                time_limit_minutes: activeSettings.time_limit_minutes ? Number(activeSettings.time_limit_minutes) : null,
            }),
        onSuccess: (updatedQuiz) => {
            // saveQuizSettings resolves to the full Quiz, so writing it
            // straight into the cache (instead of refetching) is safe here.
            queryClient.setQueryData(quizQueryKey(lessonId), updatedQuiz);
            setSettings(null);
        },
    });

    const addQuestion = useMutation({
        mutationFn: (payload: QuizQuestionPayload) => createQuestion(quiz!.id, payload),
        onSuccess: invalidateQuiz,
    });

    if (isLoading) return <p className="text-xs text-slate-500">Loading quiz…</p>;

    return (
        <div className="space-y-4 text-sm">
            <div className="card flex flex-wrap items-end gap-3 p-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-ink-700">Passing score (%)</label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        className="input w-24 !text-sm"
                        value={activeSettings.passing_score_percent}
                        onChange={(e) => setSettings({ ...activeSettings, passing_score_percent: e.target.value })}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-ink-700">Max attempts</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        className="input w-24 !text-sm"
                        value={activeSettings.max_attempts ?? ''}
                        onChange={(e) => setSettings({ ...activeSettings, max_attempts: e.target.value })}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-ink-700">Time limit (min)</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="None"
                        className="input w-24 !text-sm"
                        value={activeSettings.time_limit_minutes ?? ''}
                        onChange={(e) => setSettings({ ...activeSettings, time_limit_minutes: e.target.value })}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => saveSettings.mutate()}
                    disabled={saveSettings.isPending}
                    className="btn-dark !px-3 !py-1.5 !text-xs"
                >
                    Save settings
                </button>
            </div>

            {!quiz ? (
                <p className="text-xs text-slate-500">Save settings above to create the quiz, then add questions.</p>
            ) : (
                <>
                    <div className="space-y-3">
                        {questions.map((question) => (
                            <QuestionEditor
                                key={question.id}
                                question={question}
                                onSave={(payload) =>
                                    updateQuestion(question.id, payload).then(invalidateQuiz)
                                }
                                onDelete={() => deleteQuestion(question.id).then(invalidateQuiz)}
                            />
                        ))}
                    </div>

                    <NewQuestionForm onCreate={(payload) => addQuestion.mutate(payload)} />
                </>
            )}
        </div>
    );
}

function emptyAnswers(type: QuizQuestionType): QuizAnswerDraft[] {
    if (type === 'true_false') {
        return [
            { answer_text: 'True', is_correct: true },
            { answer_text: 'False', is_correct: false },
        ];
    }

    return [
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
    ];
}

interface QuestionEditorProps {
    question: QuizQuestion;
    onSave: (payload: QuizQuestionPayload) => void;
    onDelete: () => void;
}

function QuestionEditor({ question, onSave, onDelete }: QuestionEditorProps) {
    const [editing, setEditing] = useState(false);

    if (!editing) {
        return (
            <div className="card p-3">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-medium text-ink-900">{question.question_text}</p>
                        <p className="text-xs text-slate-500">
                            {question.type.replace('_', ' ')} · {question.points} pt(s)
                        </p>
                        <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                            {question.answers.map((a, i) => (
                                <li key={a.id ?? i}>
                                    {a.answer_text} {a.is_correct ? '✓' : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="font-medium text-brand-600 hover:underline"
                        >
                            Edit
                        </button>
                        <button type="button" onClick={onDelete} className="font-medium text-red-600 hover:underline">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-3">
            <QuestionForm
                initialText={question.question_text}
                initialType={question.type}
                initialAnswers={question.answers.map((a) => ({
                    id: a.id,
                    answer_text: a.answer_text,
                    is_correct: a.is_correct ?? false,
                }))}
                submitLabel="Save question"
                onSubmit={(payload) => {
                    onSave(payload);
                    setEditing(false);
                }}
                onCancel={() => setEditing(false)}
            />
        </div>
    );
}

interface NewQuestionFormProps {
    onCreate: (payload: QuizQuestionPayload) => void;
}

function NewQuestionForm({ onCreate }: NewQuestionFormProps) {
    const [adding, setAdding] = useState(false);

    if (!adding) {
        return (
            <button
                type="button"
                onClick={() => setAdding(true)}
                className="text-xs font-medium text-brand-600 hover:underline"
            >
                + Add question
            </button>
        );
    }

    return (
        <div className="rounded-2xl border border-dashed border-slate-300 p-3">
            <QuestionForm
                submitLabel="Add question"
                onSubmit={(payload) => {
                    onCreate(payload);
                    setAdding(false);
                }}
                onCancel={() => setAdding(false)}
            />
        </div>
    );
}

interface QuestionFormProps {
    initialText?: string;
    initialType?: QuizQuestionType;
    initialAnswers?: QuizAnswerDraft[];
    submitLabel: string;
    onSubmit: (payload: QuizQuestionPayload) => void;
    onCancel: () => void;
}

function QuestionForm({
    initialText = '',
    initialType = 'single_choice',
    initialAnswers,
    submitLabel,
    onSubmit,
    onCancel,
}: QuestionFormProps) {
    const [text, setText] = useState(initialText);
    const [type, setType] = useState<QuizQuestionType>(initialType);
    const [answers, setAnswers] = useState<QuizAnswerDraft[]>(initialAnswers ?? emptyAnswers(initialType));

    const toggleCorrect = (index: number) => {
        setAnswers((prev) =>
            prev.map((a, i) => ({
                ...a,
                is_correct: type === 'multiple_choice' ? (i === index ? !a.is_correct : a.is_correct) : i === index,
            }))
        );
    };

    return (
        <div className="space-y-2">
            <textarea
                placeholder="Question text…"
                className="input !text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <select
                className="input w-auto !text-sm"
                value={type}
                onChange={(e) => {
                    const nextType = e.target.value as QuizQuestionType;
                    setType(nextType);
                    setAnswers(emptyAnswers(nextType));
                }}
            >
                <option value="single_choice">Single choice</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="true_false">True / False</option>
            </select>

            {answers.map((answer, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input
                        type={type === 'multiple_choice' ? 'checkbox' : 'radio'}
                        checked={answer.is_correct}
                        onChange={() => toggleCorrect(index)}
                        className="accent-brand-500"
                    />
                    <input
                        className="input flex-1 !text-sm"
                        value={answer.answer_text}
                        disabled={type === 'true_false'}
                        onChange={(e) =>
                            setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, answer_text: e.target.value } : a)))
                        }
                    />
                    {type !== 'true_false' && (
                        <button
                            type="button"
                            onClick={() => setAnswers((prev) => prev.filter((_, i) => i !== index))}
                            className="text-xs text-red-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}
            {type !== 'true_false' && (
                <button
                    type="button"
                    onClick={() => setAnswers((prev) => [...prev, { answer_text: '', is_correct: false }])}
                    className="text-xs font-medium text-slate-600 hover:underline"
                >
                    + Add option
                </button>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onSubmit({ question_text: text, type, answers })}
                    className="btn-dark !px-3 !py-1.5 !text-xs"
                >
                    {submitLabel}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs font-medium text-slate-600 hover:text-ink-900"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createQuestion,
    deleteQuestion,
    fetchInstructorQuiz,
    saveQuizSettings,
    updateQuestion,
} from '../../api/quiz';

export default function QuizBuilder({ lessonId }) {
    const queryClient = useQueryClient();
    const { data: quiz, isLoading } = useQuery({
        queryKey: ['instructor', 'lessons', lessonId, 'quiz'],
        queryFn: () => fetchInstructorQuiz(lessonId),
    });

    const invalidate = (updated) => queryClient.setQueryData(['instructor', 'lessons', lessonId, 'quiz'], updated);

    const [settings, setSettings] = useState(null);
    const activeSettings = settings ?? {
        passing_score_percent: quiz?.passing_score_percent ?? 70,
        max_attempts: quiz?.max_attempts ?? '',
        time_limit_minutes: quiz?.time_limit_minutes ?? '',
    };

    const saveSettings = useMutation({
        mutationFn: () =>
            saveQuizSettings(lessonId, {
                passing_score_percent: Number(activeSettings.passing_score_percent) || 70,
                max_attempts: activeSettings.max_attempts ? Number(activeSettings.max_attempts) : null,
                time_limit_minutes: activeSettings.time_limit_minutes ? Number(activeSettings.time_limit_minutes) : null,
            }),
        onSuccess: (updated) => {
            invalidate(updated);
            setSettings(null);
        },
    });

    const addQuestion = useMutation({
        mutationFn: (payload) => createQuestion(quiz.id, payload),
        onSuccess: invalidate,
    });

    if (isLoading) return <p className="text-xs text-gray-500">Loading quiz…</p>;

    return (
        <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs text-gray-600">Passing score (%)</label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        className="mt-1 w-24 rounded border-gray-300 text-sm shadow-sm"
                        value={activeSettings.passing_score_percent}
                        onChange={(e) => setSettings({ ...activeSettings, passing_score_percent: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-600">Max attempts</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        className="mt-1 w-24 rounded border-gray-300 text-sm shadow-sm"
                        value={activeSettings.max_attempts}
                        onChange={(e) => setSettings({ ...activeSettings, max_attempts: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-600">Time limit (min)</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="None"
                        className="mt-1 w-24 rounded border-gray-300 text-sm shadow-sm"
                        value={activeSettings.time_limit_minutes}
                        onChange={(e) => setSettings({ ...activeSettings, time_limit_minutes: e.target.value })}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => saveSettings.mutate()}
                    disabled={saveSettings.isPending}
                    className="rounded bg-gray-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                >
                    Save settings
                </button>
            </div>

            {!quiz ? (
                <p className="text-xs text-gray-500">Save settings above to create the quiz, then add questions.</p>
            ) : (
                <>
                    <div className="space-y-3">
                        {quiz.questions.map((question) => (
                            <QuestionEditor
                                key={question.id}
                                question={question}
                                onSave={(payload) =>
                                    updateQuestion(question.id, payload).then(invalidate)
                                }
                                onDelete={() => deleteQuestion(question.id).then(invalidate)}
                            />
                        ))}
                    </div>

                    <NewQuestionForm onCreate={(payload) => addQuestion.mutate(payload)} />
                </>
            )}
        </div>
    );
}

function emptyAnswers(type) {
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

function QuestionEditor({ question, onSave, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(question.question_text);
    const [type, setType] = useState(question.type);
    const [answers, setAnswers] = useState(question.answers.map((a) => ({ ...a })));

    const toggleCorrect = (index) => {
        setAnswers((prev) =>
            prev.map((a, i) => ({
                ...a,
                is_correct: type === 'single_choice' || type === 'true_false' ? i === index : i === index ? !a.is_correct : a.is_correct,
            }))
        );
    };

    return (
        <div className="rounded border p-3">
            {!editing ? (
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-medium text-gray-900">{question.question_text}</p>
                        <p className="text-xs text-gray-500">
                            {question.type.replace('_', ' ')} · {question.points} pt(s)
                        </p>
                        <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                            {question.answers.map((a) => (
                                <li key={a.id}>
                                    {a.answer_text} {a.is_correct ? '✓' : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <button type="button" onClick={() => setEditing(true)} className="text-blue-600 hover:underline">
                            Edit
                        </button>
                        <button type="button" onClick={onDelete} className="text-red-600 hover:underline">
                            Delete
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <textarea
                        className="w-full rounded border-gray-300 text-sm shadow-sm"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <select
                        className="rounded border-gray-300 text-sm shadow-sm"
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            setAnswers(emptyAnswers(e.target.value));
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
                            />
                            <input
                                className="flex-1 rounded border-gray-300 text-sm shadow-sm"
                                value={answer.answer_text}
                                disabled={type === 'true_false'}
                                onChange={(e) =>
                                    setAnswers((prev) =>
                                        prev.map((a, i) => (i === index ? { ...a, answer_text: e.target.value } : a))
                                    )
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
                            className="text-xs text-gray-600 hover:underline"
                        >
                            + Add option
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onSave({ question_text: text, type, answers });
                                setEditing(false);
                            }}
                            className="rounded bg-gray-900 px-3 py-1.5 text-xs text-white"
                        >
                            Save question
                        </button>
                        <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-600">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function NewQuestionForm({ onCreate }) {
    const [adding, setAdding] = useState(false);
    const [text, setText] = useState('');
    const [type, setType] = useState('single_choice');
    const [answers, setAnswers] = useState(emptyAnswers('single_choice'));

    if (!adding) {
        return (
            <button type="button" onClick={() => setAdding(true)} className="text-xs text-gray-600 hover:underline">
                + Add question
            </button>
        );
    }

    const toggleCorrect = (index) => {
        setAnswers((prev) =>
            prev.map((a, i) => ({
                ...a,
                is_correct: type === 'multiple_choice' ? (i === index ? !a.is_correct : a.is_correct) : i === index,
            }))
        );
    };

    const reset = () => {
        setText('');
        setType('single_choice');
        setAnswers(emptyAnswers('single_choice'));
        setAdding(false);
    };

    return (
        <div className="space-y-2 rounded border border-dashed p-3">
            <textarea
                placeholder="Question text…"
                className="w-full rounded border-gray-300 text-sm shadow-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <select
                className="rounded border-gray-300 text-sm shadow-sm"
                value={type}
                onChange={(e) => {
                    setType(e.target.value);
                    setAnswers(emptyAnswers(e.target.value));
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
                    />
                    <input
                        className="flex-1 rounded border-gray-300 text-sm shadow-sm"
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
                    className="text-xs text-gray-600 hover:underline"
                >
                    + Add option
                </button>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => {
                        onCreate({ question_text: text, type, answers });
                        reset();
                    }}
                    className="rounded bg-gray-900 px-3 py-1.5 text-xs text-white"
                >
                    Add question
                </button>
                <button type="button" onClick={reset} className="text-xs text-gray-600">
                    Cancel
                </button>
            </div>
        </div>
    );
}

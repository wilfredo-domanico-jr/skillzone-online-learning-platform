import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuizForLesson, startQuizAttempt, submitQuizAttempt } from '../../api/quiz';
import type { QuizForLessonResponse } from '../../api/quiz';
import Skeleton from '../../components/Skeleton';
import { generalError } from '../../lib/apiErrors';
import type { QuizAttempt, QuizQuestion } from '../../types/api';

interface QuizPlayerProps {
    lessonId: number;
    onPassed?: () => void;
}

type Selections = Record<number, number[]>;

export default function QuizPlayer({ lessonId, onPassed }: QuizPlayerProps) {
    const queryClient = useQueryClient();
    const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null);
    const [selections, setSelections] = useState<Selections>({});
    const [result, setResult] = useState<QuizAttempt | null>(null);

    const { data, isLoading } = useQuery<QuizForLessonResponse>({
        queryKey: ['quiz', lessonId],
        queryFn: () => fetchQuizForLesson(lessonId),
    });

    const questions = data?.quiz.questions ?? [];

    const start = useMutation({
        mutationFn: () => startQuizAttempt(lessonId),
        onSuccess: (attempt) => {
            setActiveAttempt(attempt);
            setSelections({});
            setResult(null);
        },
    });

    const submit = useMutation({
        mutationFn: () =>
            submitQuizAttempt(
                activeAttempt!.id,
                questions.map((q) => ({
                    question_id: q.id,
                    answer_ids: selections[q.id] ?? [],
                }))
            ),
        onSuccess: (attemptResult) => {
            setResult(attemptResult);
            setActiveAttempt(null);
            queryClient.invalidateQueries({ queryKey: ['quiz', lessonId] });
            if (attemptResult.passed) onPassed?.();
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }
    if (!data?.quiz || questions.length === 0) {
        return <p className="text-sm text-slate-500">This quiz has no questions yet.</p>;
    }

    const toggleAnswer = (question: QuizQuestion, answerId: number) => {
        setSelections((prev) => {
            const current = prev[question.id] ?? [];
            if (question.type === 'multiple_choice') {
                return {
                    ...prev,
                    [question.id]: current.includes(answerId)
                        ? current.filter((id) => id !== answerId)
                        : [...current, answerId],
                };
            }
            return { ...prev, [question.id]: [answerId] };
        });
    };

    if (result) {
        return (
            <div>
                <div
                    className={`mb-4 rounded-xl p-3 text-sm ${
                        result.passed ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
                    }`}
                >
                    {result.passed ? '🎉 You passed!' : "You didn't pass this time."} Score: {result.score_percent}%
                </div>
                <ReviewAnswers questions={questions} result={result} />
                <RetakeControls data={data} onRetake={() => start.mutate()} pending={start.isPending} />
            </div>
        );
    }

    if (!activeAttempt) {
        return (
            <div>
                {data.passed && (
                    <p className="mb-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                        You've already passed this quiz (best score: {data.best_score_percent}%).
                    </p>
                )}
                <p className="mb-3 text-sm text-slate-600">
                    {questions.length} question(s) · Passing score: {data.quiz.passing_score_percent}%
                    {data.quiz.max_attempts && (
                        <>
                            {' '}
                            · Attempts: {data.attempts_used}/{data.quiz.max_attempts}
                        </>
                    )}
                </p>
                <RetakeControls data={data} onRetake={() => start.mutate()} pending={start.isPending} />
                {start.isError && <p className="mt-2 text-sm text-red-600">{generalError(start.error)}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {questions.map((question, index) => (
                <div key={question.id} className="card p-4">
                    <p className="mb-2 text-sm font-semibold text-ink-900">
                        {index + 1}. {question.question_text}
                    </p>
                    <div className="space-y-1.5">
                        {question.answers.map((answer) => (
                            <label key={answer.id} className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                                    name={`question-${question.id}`}
                                    checked={(selections[question.id] ?? []).includes(answer.id)}
                                    onChange={() => toggleAnswer(question, answer.id)}
                                    className="accent-brand-500"
                                />
                                {answer.answer_text}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            <button type="button" onClick={() => submit.mutate()} disabled={submit.isPending} className="btn-primary">
                Submit quiz
            </button>
            {submit.isError && <p className="mt-2 text-sm text-red-600">{generalError(submit.error)}</p>}
        </div>
    );
}

interface RetakeControlsProps {
    data: QuizForLessonResponse;
    onRetake: () => void;
    pending: boolean;
}

function RetakeControls({ data, onRetake, pending }: RetakeControlsProps) {
    const exhausted = data.attempts_remaining === 0;

    return (
        <button type="button" onClick={onRetake} disabled={pending || exhausted} className="btn-primary">
            {exhausted ? 'No attempts remaining' : data.attempts_used > 0 ? 'Retake quiz' : 'Start quiz'}
        </button>
    );
}

interface ReviewAnswersProps {
    questions: QuizQuestion[];
    result: QuizAttempt;
}

function ReviewAnswers({ questions, result }: ReviewAnswersProps) {
    const byQuestion = Object.fromEntries((result.answers ?? []).map((a) => [a.question_id, a]));

    return (
        <div className="mb-4 space-y-3">
            {questions.map((question, index) => {
                const answer = byQuestion[question.id];
                return (
                    <div key={question.id} className="card p-4 text-sm">
                        <p className="font-semibold text-ink-900">
                            {index + 1}. {question.question_text}{' '}
                            <span className={answer?.is_correct ? 'text-brand-600' : 'text-red-600'}>
                                {answer?.is_correct ? '✓' : '✗'}
                            </span>
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                            {question.answers.map((option) => (
                                <li key={option.id}>
                                    {option.answer_text}
                                    {answer?.correct_answer_ids?.includes(option.id) && (
                                        <span className="text-brand-600"> (correct)</span>
                                    )}
                                    {answer?.selected_answer_ids?.includes(option.id) &&
                                        !answer?.correct_answer_ids?.includes(option.id) && (
                                            <span className="text-red-600"> (your answer)</span>
                                        )}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}

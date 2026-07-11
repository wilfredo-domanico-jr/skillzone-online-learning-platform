import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuizForLesson, startQuizAttempt, submitQuizAttempt } from '../../api/quiz';
import { generalError } from '../../lib/apiErrors';

export default function QuizPlayer({ lessonId, onPassed }) {
    const queryClient = useQueryClient();
    const [activeAttempt, setActiveAttempt] = useState(null);
    const [selections, setSelections] = useState({});
    const [result, setResult] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['quiz', lessonId],
        queryFn: () => fetchQuizForLesson(lessonId),
    });

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
                activeAttempt.id,
                data.quiz.questions.map((q) => ({
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

    if (isLoading) return <p className="text-sm text-gray-500">Loading quiz…</p>;
    if (!data?.quiz || data.quiz.questions.length === 0) {
        return <p className="text-sm text-gray-500">This quiz has no questions yet.</p>;
    }

    const toggleAnswer = (question, answerId) => {
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
                <div className={`mb-4 rounded p-3 text-sm ${result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {result.passed ? '🎉 You passed!' : "You didn't pass this time."} Score: {result.score_percent}%
                </div>
                <ReviewAnswers quiz={data.quiz} result={result} />
                <RetakeControls data={data} onRetake={() => start.mutate()} pending={start.isPending} />
            </div>
        );
    }

    if (!activeAttempt) {
        return (
            <div>
                {data.passed && (
                    <p className="mb-3 rounded bg-green-50 p-3 text-sm text-green-800">
                        You've already passed this quiz (best score: {data.best_score_percent}%).
                    </p>
                )}
                <p className="mb-3 text-sm text-gray-600">
                    {data.quiz.questions.length} question(s) · Passing score: {data.quiz.passing_score_percent}%
                    {data.quiz.max_attempts && (
                        <> · Attempts: {data.attempts_used}/{data.quiz.max_attempts}</>
                    )}
                </p>
                <RetakeControls data={data} onRetake={() => start.mutate()} pending={start.isPending} />
                {start.isError && <p className="mt-2 text-sm text-red-600">{generalError(start.error)}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {data.quiz.questions.map((question, index) => (
                <div key={question.id}>
                    <p className="mb-2 text-sm font-medium text-gray-900">
                        {index + 1}. {question.question_text}
                    </p>
                    <div className="space-y-1">
                        {question.answers.map((answer) => (
                            <label key={answer.id} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                                    name={`question-${question.id}`}
                                    checked={(selections[question.id] ?? []).includes(answer.id)}
                                    onChange={() => toggleAnswer(question, answer.id)}
                                />
                                {answer.answer_text}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={() => submit.mutate()}
                disabled={submit.isPending}
                className="rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
                Submit quiz
            </button>
            {submit.isError && <p className="mt-2 text-sm text-red-600">{generalError(submit.error)}</p>}
        </div>
    );
}

function RetakeControls({ data, onRetake, pending }) {
    const exhausted = data.attempts_remaining === 0;

    return (
        <button
            type="button"
            onClick={onRetake}
            disabled={pending || exhausted}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
            {exhausted ? 'No attempts remaining' : data.attempts_used > 0 ? 'Retake quiz' : 'Start quiz'}
        </button>
    );
}

function ReviewAnswers({ quiz, result }) {
    const byQuestion = Object.fromEntries(result.answers.map((a) => [a.question_id, a]));

    return (
        <div className="mb-4 space-y-3">
            {quiz.questions.map((question, index) => {
                const answer = byQuestion[question.id];
                return (
                    <div key={question.id} className="rounded border p-3 text-sm">
                        <p className="font-medium text-gray-900">
                            {index + 1}. {question.question_text}{' '}
                            <span className={answer?.is_correct ? 'text-green-600' : 'text-red-600'}>
                                {answer?.is_correct ? '✓' : '✗'}
                            </span>
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                            {question.answers.map((option) => (
                                <li key={option.id}>
                                    {option.answer_text}
                                    {answer?.correct_answer_ids?.includes(option.id) && (
                                        <span className="text-green-600"> (correct)</span>
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

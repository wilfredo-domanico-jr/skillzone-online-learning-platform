<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\LessonType;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuizAttemptResource;
use App\Http\Resources\QuizResource;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizAttemptController extends Controller
{
    /**
     * The quiz for taking (no correct answers revealed) plus the
     * requester's attempt history for it.
     */
    public function show(Request $request, Lesson $lesson): JsonResponse
    {
        $quiz = $this->quizFor($lesson);
        $this->ensureEnrolled($request, $lesson);

        $attempts = $quiz->attempts()->where('user_id', $request->user()->id)->get();

        return response()->json([
            'quiz' => new QuizResource($quiz->load('questions.answers')),
            'attempts_used' => $attempts->count(),
            'attempts_remaining' => $quiz->max_attempts ? max(0, $quiz->max_attempts - $attempts->count()) : null,
            'best_score_percent' => $attempts->max('score_percent'),
            'passed' => $attempts->contains('passed', true),
        ]);
    }

    public function start(Request $request, Lesson $lesson): JsonResponse
    {
        $quiz = $this->quizFor($lesson);
        $this->ensureEnrolled($request, $lesson);

        $attemptsUsed = $quiz->attempts()->where('user_id', $request->user()->id)->count();

        if ($quiz->max_attempts !== null && $attemptsUsed >= $quiz->max_attempts) {
            throw ValidationException::withMessages([
                'attempts' => 'You have used all of your attempts for this quiz.',
            ]);
        }

        $attempt = $quiz->attempts()->create([
            'user_id' => $request->user()->id,
            'started_at' => now(),
        ]);

        return (new QuizAttemptResource($attempt))->response()->setStatusCode(201);
    }

    /**
     * Body: { "answers": [{ "question_id": 1, "answer_ids": [3] }, ...] }
     */
    public function submit(Request $request, QuizAttempt $attempt): JsonResponse
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);

        if ($attempt->submitted_at !== null) {
            throw ValidationException::withMessages(['attempt' => 'This attempt has already been submitted.']);
        }

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'exists:quiz_questions,id'],
            // Not required — a student can leave a question unanswered
            // (submitted as an empty array, or omitted entirely), which
            // simply grades as incorrect for that question.
            'answers.*.answer_ids' => ['nullable', 'array'],
            'answers.*.answer_ids.*' => ['integer'],
        ]);

        $quiz = $attempt->quiz()->with('questions.answers')->first();

        DB::transaction(function () use ($attempt, $data, $quiz) {
            $totalPoints = 0;
            $earnedPoints = 0;

            $submitted = collect($data['answers'])->keyBy('question_id');

            foreach ($quiz->questions as $question) {
                $selected = collect(data_get($submitted->get($question->id), 'answer_ids', []))->sort()->values()->all();
                $correct = $question->correctAnswerIds();
                $isCorrect = $selected === $correct;

                $attempt->answers()->create([
                    'question_id' => $question->id,
                    'selected_answer_ids' => $selected,
                    'is_correct' => $isCorrect,
                ]);

                $totalPoints += $question->points;
                $earnedPoints += $isCorrect ? $question->points : 0;
            }

            $scorePercent = $totalPoints > 0 ? (int) round(($earnedPoints / $totalPoints) * 100) : 0;
            $passed = $scorePercent >= $quiz->passing_score_percent;

            $attempt->update([
                'score_percent' => $scorePercent,
                'passed' => $passed,
                'submitted_at' => now(),
            ]);

            if ($passed) {
                app(LearningController::class)->completeLessonForQuiz($quiz->lesson, $attempt->user);
            }
        });

        return (new QuizAttemptResource($attempt->fresh('answers.question')))->response();
    }

    public function showAttempt(Request $request, QuizAttempt $attempt): JsonResponse
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);

        return (new QuizAttemptResource($attempt->load('answers.question')))->response();
    }

    private function quizFor(Lesson $lesson): \App\Models\Quiz
    {
        abort_if($lesson->type !== LessonType::Quiz, 404);

        $quiz = $lesson->quiz;
        abort_if(! $quiz, 404);

        return $quiz;
    }

    private function ensureEnrolled(Request $request, Lesson $lesson): void
    {
        $course = $lesson->section->course;
        $user = $request->user();
        $isOwnerOrAdmin = $user->can('view', $course);
        $isEnrolled = $user->isEnrolledIn($course);

        if (! $isOwnerOrAdmin && ! $isEnrolled) {
            throw ValidationException::withMessages(['enrollment' => 'You must be enrolled in this course to take this quiz.']);
        }
    }
}

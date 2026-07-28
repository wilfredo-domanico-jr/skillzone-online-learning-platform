<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Enums\LessonType;
use App\Http\Controllers\Concerns\ReordersModels;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuizQuestionRequest;
use App\Http\Resources\QuizResource;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class QuizController extends Controller
{
    use ReordersModels;

    /**
     * The quiz for editing (full detail, correct answers included), or an
     * empty shell if the instructor hasn't configured it yet.
     */
    public function show(Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson->section->course);

        $quiz = $lesson->quiz;

        if (! $quiz) {
            return response()->json(['data' => null]);
        }

        return $this->respond($quiz->load('questions.answers'));
    }

    /**
     * Create or update the quiz settings for a quiz-type lesson.
     */
    public function upsertSettings(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson->section->course);

        if ($lesson->type !== LessonType::Quiz) {
            throw ValidationException::withMessages(['type' => 'This lesson is not a quiz lesson.']);
        }

        $data = $request->validate([
            'passing_score_percent' => ['nullable', 'integer', 'min:1', 'max:100'],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
        ]);

        $quiz = $lesson->quiz()->updateOrCreate([], [
            'passing_score_percent' => $data['passing_score_percent'] ?? 70,
            ...$data,
        ]);

        return $this->respond($quiz);
    }

    public function storeQuestion(StoreQuizQuestionRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', $quiz->lesson->section->course);

        $question = $quiz->questions()->create([
            'question_text' => $request->validated('question_text'),
            'type' => $request->validated('type'),
            'points' => $request->validated('points') ?? 1,
            'position' => $quiz->questions()->max('position') + 1,
        ]);

        $this->syncAnswers($question, $request->validated('answers'));

        return $this->respond($quiz->fresh());
    }

    public function updateQuestion(StoreQuizQuestionRequest $request, QuizQuestion $question): JsonResponse
    {
        $this->authorize('update', $question->quiz->lesson->section->course);

        $question->update([
            'question_text' => $request->validated('question_text'),
            'type' => $request->validated('type'),
            'points' => $request->validated('points') ?? 1,
        ]);

        $this->syncAnswers($question, $request->validated('answers'));

        return $this->respond($question->quiz->fresh());
    }

    public function destroyQuestion(QuizQuestion $question): JsonResponse
    {
        $this->authorize('update', $question->quiz->lesson->section->course);
        $quiz = $question->quiz;

        $question->delete();

        return $this->respond($quiz->fresh());
    }

    /**
     * Body: { "question_ids": [5, 3, 4] } — the array order becomes position 0..n.
     */
    public function reorderQuestions(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', $quiz->lesson->section->course);

        $ids = $request->validate([
            'question_ids' => ['required', 'array'],
            'question_ids.*' => ['integer', 'exists:quiz_questions,id'],
        ])['question_ids'];

        $this->reorderPositions($quiz->questions(), $ids);

        return $this->respond($quiz->fresh());
    }

    /**
     * Replace a question's full answer set (delete + recreate) — simpler and
     * safer than trying to diff/patch individual answers from the builder UI.
     */
    private function syncAnswers(QuizQuestion $question, array $answers): void
    {
        $question->answers()->delete();

        foreach (array_values($answers) as $position => $answer) {
            $question->answers()->create([
                'answer_text' => $answer['answer_text'],
                'is_correct' => ! empty($answer['is_correct']),
                'position' => $position,
            ]);
        }
    }

    private function respond(Quiz $quiz): JsonResponse
    {
        request()->attributes->set('can_view_correct_answers', true);

        return (new QuizResource($quiz->load('questions.answers')))->response();
    }
}

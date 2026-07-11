<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LearningController extends Controller
{
    /**
     * Mark a lesson complete for the requester's enrollment in its course,
     * then recompute the enrollment's overall progress percentage.
     */
    public function complete(Request $request, Lesson $lesson): JsonResponse
    {
        $enrollment = $this->completeLessonForQuiz($lesson, $request->user());

        return response()->json([
            'lesson_id' => $lesson->id,
            'completed_at' => $enrollment->lessonProgress()->where('lesson_id', $lesson->id)->value('completed_at'),
            'enrollment' => [
                'progress_percent' => $enrollment->progress_percent,
                'completed_at' => $enrollment->completed_at,
            ],
        ]);
    }

    /**
     * Record a video's resume position without marking the lesson complete.
     */
    public function updateProgress(Request $request, Lesson $lesson): JsonResponse
    {
        $enrollment = $this->enrollmentFor($lesson, $request->user());

        $data = $request->validate([
            'last_position_seconds' => ['required', 'integer', 'min:0'],
        ]);

        $enrollment->lessonProgress()->updateOrCreate(
            ['lesson_id' => $lesson->id],
            ['last_position_seconds' => $data['last_position_seconds']]
        );

        return response()->json(['message' => 'Progress saved.']);
    }

    /**
     * Shared core used both by the direct "mark complete" endpoint and by
     * QuizAttemptController when a passing quiz attempt should complete its
     * lesson. Returns the freshly-recalculated enrollment.
     */
    public function completeLessonForQuiz(Lesson $lesson, User $user): Enrollment
    {
        $enrollment = $this->enrollmentFor($lesson, $user);

        $enrollment->lessonProgress()->updateOrCreate(
            ['lesson_id' => $lesson->id],
            ['completed_at' => now()]
        );

        $enrollment->recalculateProgress();

        return $enrollment->fresh();
    }

    private function enrollmentFor(Lesson $lesson, User $user): Enrollment
    {
        $course = $lesson->section->course;

        $enrollment = $course->enrollments()->where('user_id', $user->id)->first();

        if (! $enrollment) {
            throw ValidationException::withMessages([
                'enrollment' => 'You must be enrolled in this course to track progress.',
            ]);
        }

        return $enrollment;
    }
}

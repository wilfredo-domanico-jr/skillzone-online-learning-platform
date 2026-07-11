<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CourseStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Notifications\CourseDecided;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    /**
     * List courses for moderation, optionally filtered by status (defaults to pending_review).
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', CourseStatus::PendingReview->value);

        $courses = Course::query()
            ->with(['instructor', 'category'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return CourseResource::collection($courses)->response();
    }

    public function approve(Course $course): JsonResponse
    {
        $this->ensurePendingReview($course);

        $course->update([
            'status' => CourseStatus::Published,
            'published_at' => now(),
            'rejection_reason' => null,
        ]);

        $course->instructor->notify(new CourseDecided($course));

        return (new CourseResource($course))->response();
    }

    public function reject(Request $request, Course $course): JsonResponse
    {
        $this->ensurePendingReview($course);

        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $course->update([
            'status' => CourseStatus::Rejected,
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        $course->instructor->notify(new CourseDecided($course));

        return (new CourseResource($course))->response();
    }

    private function ensurePendingReview(Course $course): void
    {
        if ($course->status !== CourseStatus::PendingReview) {
            throw ValidationException::withMessages([
                'status' => 'Only courses pending review can be approved or rejected.',
            ]);
        }
    }
}

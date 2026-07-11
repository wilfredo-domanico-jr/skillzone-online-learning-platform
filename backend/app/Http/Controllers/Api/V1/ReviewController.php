<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Course;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ReviewController extends Controller
{
    /**
     * Public: reviews for a published course.
     */
    public function index(Request $request, string $slug): JsonResponse
    {
        $course = Course::published()->where('slug', $slug)->first();

        if (! $course) {
            throw new NotFoundHttpException();
        }

        $reviews = $course->reviews()->with('user')->latest()->paginate($request->integer('per_page', 15));

        return ReviewResource::collection($reviews)->response();
    }

    /**
     * A student can review a course once they're enrolled — one review per
     * course, editable afterward via update() rather than re-posting.
     */
    public function store(Request $request, Course $course): JsonResponse
    {
        if (! $course->enrollments()->where('user_id', $request->user()->id)->exists()) {
            throw ValidationException::withMessages([
                'course' => 'You must be enrolled in this course to review it.',
            ]);
        }

        if ($course->reviews()->where('user_id', $request->user()->id)->exists()) {
            throw ValidationException::withMessages([
                'course' => 'You have already reviewed this course — edit your existing review instead.',
            ]);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $review = $course->reviews()->create([...$data, 'user_id' => $request->user()->id]);

        return (new ReviewResource($review->load('user')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Review $review): JsonResponse
    {
        abort_unless($review->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $review->update($data);

        return (new ReviewResource($review->load('user')))->response();
    }

    public function destroy(Request $request, Review $review): JsonResponse
    {
        abort_unless($review->user_id === $request->user()->id || $request->user()->hasRole('admin'), 403);

        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}

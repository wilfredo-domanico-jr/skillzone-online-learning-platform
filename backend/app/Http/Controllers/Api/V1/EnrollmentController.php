<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CourseStatus;
use App\Enums\EnrollmentSource;
use App\Http\Controllers\Controller;
use App\Http\Resources\EnrollmentResource;
use App\Models\Course;
use App\Notifications\NewEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class EnrollmentController extends Controller
{
    /**
     * The authenticated user's enrollments.
     */
    public function index(Request $request): JsonResponse
    {
        $enrollments = $request->user()->enrollments()
            ->with('course.category', 'course.instructor')
            ->latest('enrolled_at')
            ->paginate($request->integer('per_page', 15));

        return EnrollmentResource::collection($enrollments)->response();
    }

    /**
     * Enroll the authenticated user in a free, published course.
     *
     * Paid-course checkout doesn't exist yet (Phase 3/Stripe) — enrolling in
     * a priced course is rejected for now rather than silently granting
     * access. Re-enrolling in an already-enrolled course is idempotent.
     */
    public function store(Request $request, string $slug): JsonResponse
    {
        $course = Course::where('slug', $slug)->where('status', CourseStatus::Published)->first();

        if (! $course) {
            throw new NotFoundHttpException();
        }

        $existing = $request->user()->enrollments()->where('course_id', $course->id)->first();

        if ($existing) {
            return (new EnrollmentResource($existing->load('course.category', 'course.instructor')))->response();
        }

        if ((float) $course->price > 0) {
            throw ValidationException::withMessages([
                'course' => 'This course requires payment. Checkout isn\'t available yet.',
            ]);
        }

        // Explicit progress_percent rather than relying on the DB column
        // default: Eloquent doesn't refetch DB-applied defaults after
        // create(), so the in-memory model would read null until reloaded.
        $enrollment = $request->user()->enrollments()->create([
            'course_id' => $course->id,
            'source' => EnrollmentSource::Free,
            'enrolled_at' => now(),
            'progress_percent' => 0,
        ]);

        $course->instructor->notify(new NewEnrollment($enrollment->load('user', 'course')));

        return (new EnrollmentResource($enrollment->load('course.category', 'course.instructor')))
            ->response()
            ->setStatusCode(201);
    }
}

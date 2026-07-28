<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Enums\CourseLevel;
use App\Enums\CourseStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    /**
     * The authenticated instructor's own courses.
     */
    public function index(Request $request): JsonResponse
    {
        $courses = $request->user()->courses()
            ->with('category')
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return CourseResource::collection($courses)->response();
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $this->authorize('create', Course::class);

        // Explicit defaults rather than relying on the DB column default: an
        // enum-cast attribute left unset after create() reads as null in the
        // in-memory model (Eloquent doesn't refetch DB-applied defaults).
        // `status` isn't fillable (system-managed), so it's forced onto the
        // unsaved model before the single save() call.
        $course = $request->user()->courses()->make([
            'level' => CourseLevel::AllLevels,
            'language' => 'en',
            ...$request->validated(),
        ]);
        $course->forceFill(['status' => CourseStatus::Draft]);
        $course->save();

        return (new CourseResource($course))->response()->setStatusCode(201);
    }

    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $course->update($request->validated());

        return (new CourseResource($course->fresh('category')))->response();
    }

    public function destroy(Course $course): JsonResponse
    {
        $this->authorize('delete', $course);

        $course->delete();

        return response()->json(['message' => 'Course deleted.']);
    }

    /**
     * Upload/replace the course's cover thumbnail. Public disk, since
     * catalog/course-detail cards need to display it to anyone — unlike
     * lesson video/attachments, there's nothing to gate access behind here.
     */
    public function uploadThumbnail(Request $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $request->validate([
            'thumbnail' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($course->thumbnail_path) {
            Storage::disk('public')->delete($course->thumbnail_path);
        }

        $path = $request->file('thumbnail')->store('course-thumbnails', 'public');

        $course->update(['thumbnail_path' => $path]);

        return (new CourseResource($course->fresh('category')))->response();
    }

    /**
     * Move a draft/rejected course into the admin review queue.
     */
    public function submitForReview(Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        if (! in_array($course->status, [CourseStatus::Draft, CourseStatus::Rejected], true)) {
            throw ValidationException::withMessages([
                'status' => 'Only draft or rejected courses can be submitted for review.',
            ]);
        }

        if (! $course->sections()->whereHas('lessons')->exists()) {
            throw ValidationException::withMessages([
                'status' => 'Add at least one section with a lesson before submitting for review.',
            ]);
        }

        $course->forceFill(['status' => CourseStatus::PendingReview, 'rejection_reason' => null])->save();

        return (new CourseResource($course))->response();
    }
}

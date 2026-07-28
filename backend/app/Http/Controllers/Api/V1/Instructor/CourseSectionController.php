<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Http\Controllers\Concerns\ReordersModels;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseSectionRequest;
use App\Http\Resources\CourseSectionResource;
use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseSectionController extends Controller
{
    use ReordersModels;

    public function store(StoreCourseSectionRequest $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $section = $course->sections()->create([
            'title' => $request->validated('title'),
            'position' => $course->sections()->max('position') + 1,
        ]);

        return (new CourseSectionResource($section))->response()->setStatusCode(201);
    }

    public function update(StoreCourseSectionRequest $request, CourseSection $section): JsonResponse
    {
        $this->authorize('update', $section->course);

        $section->update($request->validated());

        return (new CourseSectionResource($section))->response();
    }

    public function destroy(CourseSection $section): JsonResponse
    {
        $this->authorize('update', $section->course);

        $section->delete();

        return response()->json(['message' => 'Section deleted.']);
    }

    /**
     * Persist a new section ordering for a course.
     *
     * Body: { "section_ids": [3, 1, 2] } — the array order becomes position 0..n.
     */
    public function reorder(Request $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $ids = $request->validate([
            'section_ids' => ['required', 'array'],
            'section_ids.*' => ['integer', 'exists:course_sections,id'],
        ])['section_ids'];

        $this->reorderPositions($course->sections(), $ids);

        return CourseSectionResource::collection($course->sections()->get())->response();
    }
}

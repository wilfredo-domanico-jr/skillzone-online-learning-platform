<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\CourseStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Category;
use App\Models\Course;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CourseController extends Controller
{
    /**
     * Public course catalog: published courses only, with search/filter/sort.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->published()
            ->with(['instructor', 'category'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->string('search').'%';
                $query->where(fn ($q) => $q->where('title', 'like', $term)->orWhere('subtitle', 'like', $term));
            })
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->whereHas('category', fn ($q) => $q->where('slug', $request->string('category')));
            })
            ->when($request->filled('level'), fn ($query) => $query->where('level', $request->string('level')))
            ->when($request->query('price') === 'free', fn ($query) => $query->where('price', 0))
            ->when($request->query('price') === 'paid', fn ($query) => $query->where('price', '>', 0));

        match ($request->query('sort')) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'rating' => $query->orderByDesc('average_rating')->orderByDesc('reviews_count'),
            default => $query->latest('published_at'),
        };

        $courses = $query->paginate($request->integer('per_page', 12));

        return CourseResource::collection($courses)->response();
    }

    /**
     * Public course detail page. Published courses are visible to anyone;
     * draft/pending/rejected courses are only visible to their owner or an admin.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $course = $this->findVisibleBySlug($request, $slug, ['instructor', 'category']);

        return (new CourseResource($course))->response();
    }

    /**
     * Course curriculum (sections + lessons). Lesson content is locked unless
     * the requester owns the course, is an admin, is enrolled, or the lesson
     * is previewable. When enrolled, each lesson also reports completion
     * status and video resume position for the course player.
     */
    public function curriculum(Request $request, string $slug): JsonResponse
    {
        $course = $this->findVisibleBySlug($request, $slug);

        $user = $request->user();
        $enrollment = $user?->enrollmentFor($course);

        $canViewLockedContent = $user?->can('view', $course) || $enrollment !== null;
        $request->attributes->set('can_view_locked_lesson_content', $canViewLockedContent);

        if ($enrollment) {
            $progressMap = LessonProgress::where('enrollment_id', $enrollment->id)
                ->get()
                ->keyBy('lesson_id')
                ->map(fn (LessonProgress $p) => [
                    'completed' => $p->completed_at !== null,
                    'last_position_seconds' => $p->last_position_seconds,
                ]);
            $request->attributes->set('lesson_progress_map', $progressMap);
        }

        $course->load(['sections.lessons.videoDetail', 'sections.lessons.article', 'sections.lessons.attachments']);

        return (new CourseResource($course))
            ->additional(['enrollment' => $enrollment ? [
                'id' => $enrollment->id,
                'progress_percent' => $enrollment->progress_percent,
                'completed_at' => $enrollment->completed_at,
            ] : null])
            ->response();
    }

    private function findVisibleBySlug(Request $request, string $slug, array $with = []): Course
    {
        $course = Course::query()->with($with)->where('slug', $slug)->first();

        if (! $course) {
            throw new NotFoundHttpException();
        }

        $isOwnerOrAdmin = $request->user()?->can('view', $course) ?? false;

        if ($course->status !== CourseStatus::Published && ! $isOwnerOrAdmin) {
            throw new NotFoundHttpException();
        }

        return $course;
    }
}

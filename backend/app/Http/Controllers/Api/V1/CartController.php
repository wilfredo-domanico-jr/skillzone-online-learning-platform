<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CourseStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return (new CartResource($this->cartFor($request)->load('items.course')))->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
        ]);

        $course = Course::findOrFail($data['course_id']);

        if ($course->status !== CourseStatus::Published) {
            throw ValidationException::withMessages(['course_id' => 'This course is not available for purchase.']);
        }

        if ((float) $course->price <= 0) {
            throw ValidationException::withMessages([
                'course_id' => 'This course is free — enroll directly instead of adding it to your cart.',
            ]);
        }

        if ($request->user()->enrollments()->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages(['course_id' => 'You are already enrolled in this course.']);
        }

        $cart = $this->cartFor($request);
        $cart->items()->firstOrCreate(['course_id' => $course->id]);

        return (new CartResource($cart->load('items.course')))->response()->setStatusCode(201);
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        $cart = $this->cartFor($request);
        $cart->items()->where('course_id', $course->id)->delete();

        return (new CartResource($cart->load('items.course')))->response();
    }

    private function cartFor(Request $request): Cart
    {
        return $request->user()->cart()->firstOrCreate();
    }
}

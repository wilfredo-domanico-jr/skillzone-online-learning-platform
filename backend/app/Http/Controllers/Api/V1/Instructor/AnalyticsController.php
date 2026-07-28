<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $instructor = $request->user();
        $courseIds = $instructor->courses()->pluck('id');

        $revenue = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'paid')
            ->where('order_items.instructor_id', $instructor->id)
            ->sum('order_items.price_at_purchase');

        return response()->json([
            'published_courses' => $instructor->courses()->where('status', 'published')->count(),
            'total_enrollments' => Enrollment::whereIn('course_id', $courseIds)->count(),
            'total_revenue' => round((float) $revenue, 2),
            'average_rating' => round((float) ($instructor->courses()->whereNotNull('average_rating')->avg('average_rating') ?? 0), 2),
        ]);
    }
}

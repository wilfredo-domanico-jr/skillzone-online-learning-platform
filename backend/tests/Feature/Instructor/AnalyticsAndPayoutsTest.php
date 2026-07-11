<?php

namespace Tests\Feature\Instructor;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\InstructorPayout;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsAndPayoutsTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_view_their_analytics_overview(): void
    {
        $instructor = User::factory()->create();
        $instructor->assignRole('instructor');
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id]);
        $student = User::factory()->create();
        Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id]);

        $order = Order::factory()->paid()->create();
        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'price_at_purchase' => 50,
            'instructor_id' => $instructor->id,
        ]);

        $response = $this->actingAs($instructor)->getJson('/api/v1/instructor/analytics/overview');

        $response->assertOk()
            ->assertJsonPath('published_courses', 1)
            ->assertJsonPath('total_enrollments', 1)
            ->assertJsonPath('total_revenue', 50);
    }

    public function test_instructor_can_list_their_own_payouts_only(): void
    {
        $instructor = User::factory()->create();
        $instructor->assignRole('instructor');
        $otherInstructor = User::factory()->create();

        InstructorPayout::create([
            'instructor_id' => $instructor->id,
            'period_start' => '2026-06-01',
            'period_end' => '2026-06-30',
            'gross_amount' => 100,
            'platform_fee_amount' => 30,
            'net_amount' => 70,
            'status' => 'pending',
        ]);
        InstructorPayout::create([
            'instructor_id' => $otherInstructor->id,
            'period_start' => '2026-06-01',
            'period_end' => '2026-06-30',
            'gross_amount' => 200,
            'platform_fee_amount' => 60,
            'net_amount' => 140,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($instructor)->getJson('/api/v1/instructor/payouts');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.net_amount', 70);
    }
}

<?php

namespace Tests\Feature\Console;

use App\Models\Course;
use App\Models\InstructorPayout;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class GeneratePayoutsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_generates_a_payout_from_paid_orders_in_the_period(): void
    {
        $instructor = User::factory()->create();
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 100]);

        $order = Order::factory()->paid()->create(['paid_at' => Carbon::parse('2026-06-15')]);
        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'price_at_purchase' => 100,
            'instructor_id' => $instructor->id,
        ]);

        $this->artisan('payouts:generate', ['--start' => '2026-06-01', '--end' => '2026-06-30'])
            ->assertExitCode(0);

        $payout = InstructorPayout::where('instructor_id', $instructor->id)->first();
        $this->assertNotNull($payout);
        $this->assertSame('100.00', $payout->gross_amount);
        $this->assertSame('30.00', $payout->platform_fee_amount);
        $this->assertSame('70.00', $payout->net_amount);
        $this->assertSame('pending', $payout->status);
    }

    public function test_it_skips_a_period_that_already_has_a_payout(): void
    {
        $instructor = User::factory()->create();
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 100]);
        $order = Order::factory()->paid()->create(['paid_at' => Carbon::parse('2026-06-15')]);
        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'price_at_purchase' => 100,
            'instructor_id' => $instructor->id,
        ]);

        $this->artisan('payouts:generate', ['--start' => '2026-06-01', '--end' => '2026-06-30']);
        $this->artisan('payouts:generate', ['--start' => '2026-06-01', '--end' => '2026-06-30']);

        $this->assertSame(1, InstructorPayout::where('instructor_id', $instructor->id)->count());
    }

    public function test_it_ignores_orders_outside_the_period(): void
    {
        $instructor = User::factory()->create();
        $course = Course::factory()->published()->create(['instructor_id' => $instructor->id, 'price' => 100]);
        $order = Order::factory()->paid()->create(['paid_at' => Carbon::parse('2026-05-15')]);
        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'price_at_purchase' => 100,
            'instructor_id' => $instructor->id,
        ]);

        $this->artisan('payouts:generate', ['--start' => '2026-06-01', '--end' => '2026-06-30']);

        $this->assertSame(0, InstructorPayout::where('instructor_id', $instructor->id)->count());
    }
}

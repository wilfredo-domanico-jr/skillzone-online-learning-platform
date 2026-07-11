<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Enums\CouponType;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private FakePaymentGateway $gateway;

    protected function setUp(): void
    {
        parent::setUp();

        $this->gateway = new FakePaymentGateway();
        $this->app->instance(PaymentGateway::class, $this->gateway);
    }

    public function test_checkout_creates_a_pending_order_and_returns_a_stripe_url(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);
        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);

        $response = $this->actingAs($student)->postJson('/api/v1/checkout/session');

        $response->assertOk()->assertJsonStructure(['checkout_url', 'order_id']);
        $this->assertDatabaseHas('orders', [
            'user_id' => $student->id,
            'status' => 'pending',
            'total' => 49.99,
        ]);
        $this->assertCount(1, $this->gateway->createdSessions);
    }

    public function test_a_stripe_outage_fails_the_order_cleanly_instead_of_leaking_an_exception(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);
        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);
        $this->gateway->shouldFail = true;

        $response = $this->actingAs($student)->postJson('/api/v1/checkout/session');

        $response->assertUnprocessable()->assertJsonValidationErrors('checkout');
        $this->assertDatabaseHas('orders', ['user_id' => $student->id, 'status' => 'failed']);
    }

    public function test_checkout_fails_with_an_empty_cart(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)
            ->postJson('/api/v1/checkout/session')
            ->assertUnprocessable();
    }

    public function test_a_valid_coupon_reduces_the_order_total(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 100]);
        $coupon = Coupon::factory()->create(['type' => CouponType::Percent, 'value' => 20]);
        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);

        $response = $this->actingAs($student)->postJson('/api/v1/checkout/session', [
            'coupon_code' => $coupon->code,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('orders', [
            'user_id' => $student->id,
            'subtotal' => 100,
            'discount_total' => 20,
            'total' => 80,
        ]);
    }

    public function test_coupon_validate_previews_the_discount_for_the_cart(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 50]);
        $coupon = Coupon::factory()->create(['type' => CouponType::Fixed, 'value' => 15]);
        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);

        $response = $this->actingAs($student)->postJson('/api/v1/coupons/validate', ['code' => $coupon->code]);

        $response->assertOk()
            ->assertJsonPath('subtotal', 50)
            ->assertJsonPath('discount', 15)
            ->assertJsonPath('total', 35);
    }

    public function test_an_expired_coupon_is_rejected(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 50]);
        $coupon = Coupon::factory()->create(['expires_at' => now()->subDay()]);
        $this->actingAs($student)->postJson('/api/v1/cart/items', ['course_id' => $course->id]);

        $this->actingAs($student)
            ->postJson('/api/v1/coupons/validate', ['code' => $coupon->code])
            ->assertUnprocessable();
    }
}

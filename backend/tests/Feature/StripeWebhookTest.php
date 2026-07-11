<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->instance(PaymentGateway::class, new FakePaymentGateway());
    }

    private function completedSessionPayload(Order $order): array
    {
        return [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => $order->stripe_checkout_session_id,
                    'payment_intent' => 'pi_test_123',
                ],
            ],
        ];
    }

    public function test_webhook_marks_the_order_paid_and_grants_enrollment(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);
        $order = Order::factory()->for($student)->create([
            'subtotal' => 49.99,
            'total' => 49.99,
            'stripe_checkout_session_id' => 'cs_test_webhook_1',
        ]);
        $order->items()->create([
            'course_id' => $course->id,
            'price_at_purchase' => 49.99,
            'instructor_id' => $course->instructor_id,
        ]);

        $response = $this->postJson('/webhooks/stripe', $this->completedSessionPayload($order));

        $response->assertOk();
        $this->assertSame('paid', $order->fresh()->status->value);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'source' => 'purchase',
        ]);
    }

    public function test_webhook_is_idempotent_on_retry(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);
        $order = Order::factory()->for($student)->create([
            'subtotal' => 49.99,
            'total' => 49.99,
            'stripe_checkout_session_id' => 'cs_test_webhook_2',
        ]);
        $order->items()->create([
            'course_id' => $course->id,
            'price_at_purchase' => 49.99,
            'instructor_id' => $course->instructor_id,
        ]);

        $payload = $this->completedSessionPayload($order);
        $this->postJson('/webhooks/stripe', $payload)->assertOk();
        $this->postJson('/webhooks/stripe', $payload)->assertOk();

        $this->assertSame(1, \App\Models\Enrollment::where('user_id', $student->id)
            ->where('course_id', $course->id)->count());
    }

    public function test_webhook_for_an_unknown_session_id_is_a_harmless_no_op(): void
    {
        $response = $this->postJson('/webhooks/stripe', [
            'type' => 'checkout.session.completed',
            'data' => ['object' => ['id' => 'cs_test_does_not_exist', 'payment_intent' => 'pi_x']],
        ]);

        $response->assertOk();
    }

    public function test_webhook_clears_purchased_items_from_the_cart(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => 49.99]);
        $cart = $student->cart()->create();
        $cart->items()->create(['course_id' => $course->id]);

        $order = Order::factory()->for($student)->create([
            'subtotal' => 49.99,
            'total' => 49.99,
            'stripe_checkout_session_id' => 'cs_test_webhook_3',
        ]);
        $order->items()->create([
            'course_id' => $course->id,
            'price_at_purchase' => 49.99,
            'instructor_id' => $course->instructor_id,
        ]);

        $this->postJson('/webhooks/stripe', $this->completedSessionPayload($order))->assertOk();

        $this->assertSame(0, $cart->items()->count());
    }
}

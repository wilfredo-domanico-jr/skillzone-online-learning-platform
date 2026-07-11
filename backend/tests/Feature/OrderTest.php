<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_only_sees_their_own_orders(): void
    {
        $student = User::factory()->create();
        $other = User::factory()->create();
        Order::factory()->for($student)->paid()->create(['subtotal' => 10, 'total' => 10]);
        Order::factory()->for($other)->paid()->create(['subtotal' => 20, 'total' => 20]);

        $response = $this->actingAs($student)->getJson('/api/v1/orders');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_a_user_cannot_view_another_users_order_detail(): void
    {
        $student = User::factory()->create();
        $other = User::factory()->create();
        $order = Order::factory()->for($other)->paid()->create(['subtotal' => 20, 'total' => 20]);

        $this->actingAs($student)->getJson("/api/v1/orders/{$order->id}")->assertNotFound();
    }
}

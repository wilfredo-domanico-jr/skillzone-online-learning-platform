<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => OrderStatus::Pending,
            'subtotal' => 0,
            'discount_total' => 0,
            'total' => 0,
            'currency' => 'usd',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => OrderStatus::Paid, 'paid_at' => now()]);
    }
}
